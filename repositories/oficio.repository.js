import { db, bucket } from '../db.js'
import { ValidationError, NotFoundError } from '../utils/errors.js'
import { FieldValue } from 'firebase-admin/firestore'

const OFICIOS_COLLECTION = 'oficios'
const SIGNED_URL_EXPIRY_MINUTES = 60

async function getSignedUrl (storageBucket, filePath) {
  const file = storageBucket.file(filePath)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000
  })
  return url
}

export class OficioRepository {
  static async create ({
    noOficio, fechaOficio, fechaRecibo, fechaLimite,
    asunto, remitente, cargo, dependencia,
    unidadIds, unidadAlias, archivoBuffer, archivoMime,
    tipoArchivo = 0, modo = 0,
    responsableIds, cooresponsableIds
  }) {
    const firestore = db()

    const existing = await firestore
      .collection(OFICIOS_COLLECTION)
      .where('noOficio', '==', noOficio.trim())
      .limit(1)
      .get()

    if (!existing.empty) {
      throw new ValidationError(`El oficio "${noOficio}" ya está registrado`)
    }
    let archivoPath = null

    if (archivoBuffer && archivoMime === 'application/pdf') {
      const storageBucket = bucket()
      const nombreArchivo = noOficio.toUpperCase().replace(/[^A-Z0-9\-_]/g, '_') + '.pdf'
      archivoPath = `oficios/${nombreArchivo}`
      const file = storageBucket.file(archivoPath)
      await file.save(archivoBuffer, {
        metadata: { contentType: 'application/pdf' },
        resumable: false
      })
    }

    const docRef = await firestore.collection(OFICIOS_COLLECTION).add({
      noOficio: noOficio.trim(),
      fechaOficio: fechaOficio || null,
      fechaRecibo: fechaRecibo || null,
      fechaLimite: fechaLimite || null,
      asunto: asunto.trim(),
      remitente: remitente.trim(),
      cargo: cargo?.trim() || '',
      dependencia: dependencia?.trim() || '',
      unidadIds,
      unidadId: unidadIds[0],
      unidadAlias: unidadAlias || '',
      responsableIds: responsableIds && responsableIds.length > 0
        ? responsableIds
        : (cooresponsableIds && cooresponsableIds.length > 0
            ? unidadIds.filter(id => !cooresponsableIds.includes(id))
            : unidadIds),
      cooresponsableIds: cooresponsableIds || [],
      estatus: 'Pendiente',
      archivoPath,
      tipoArchivo: Number(tipoArchivo) === 1 ? 1 : 0,
      modo: Number(modo) === 1 ? 1 : 0,
      respuestas: [],
      creadoEn: new Date().toISOString()
    })

    return docRef.id
  }

  static async update (id, {
    noOficio, fechaOficio, fechaRecibo, fechaLimite,
    asunto, remitente, cargo, dependencia,
    unidadIds, unidadAlias, estatus,
    archivoBuffer, archivoMime,
    tipoArchivo, modo,
    responsableIds, cooresponsableIds
  }) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(id)
    const docSnap = await ref.get()
    if (!docSnap.exists) throw new NotFoundError('Oficio no encontrado')

    const actual = docSnap.data()
    const noOficioTrimmed = noOficio.trim()
    if (noOficioTrimmed !== actual.noOficio) {
      const existing = await firestore
        .collection(OFICIOS_COLLECTION)
        .where('noOficio', '==', noOficioTrimmed)
        .limit(1)
        .get()

      if (!existing.empty) {
        throw new ValidationError(`El oficio "${noOficioTrimmed}" ya está registrado`)
      }
    }

    const storageBucket = bucket()
    let archivoPath = actual.archivoPath || null

    if (archivoBuffer && archivoMime === 'application/pdf') {
      if (actual.archivoPath) {
        try {
          await storageBucket.file(actual.archivoPath).delete()
        } catch {}
      }

      const nombreArchivo = noOficioTrimmed.toUpperCase().replace(/[^A-Z0-9\-_]/g, '_') + '.pdf'
      archivoPath = `oficios/${nombreArchivo}`
      const file = storageBucket.file(archivoPath)
      await file.save(archivoBuffer, {
        metadata: { contentType: 'application/pdf' },
        resumable: false
      })
    } else if (!archivoBuffer && noOficioTrimmed !== actual.noOficio && actual.archivoPath) {
      const nombreNuevo = noOficioTrimmed.toUpperCase().replace(/[^A-Z0-9\-_]/g, '_') + '.pdf'
      const nuevoPath = `oficios/${nombreNuevo}`

      try {
        await storageBucket.file(actual.archivoPath).copy(storageBucket.file(nuevoPath))
        await storageBucket.file(actual.archivoPath).delete()
        archivoPath = nuevoPath
      } catch {
        archivoPath = actual.archivoPath
      }
    }

    // tipoArchivo: if provided use it, otherwise keep existing value
    const nuevoTipo = tipoArchivo !== undefined
      ? (Number(tipoArchivo) === 1 ? 1 : 0)
      : (actual.tipoArchivo ?? 0)

    await ref.update({
      noOficio: noOficioTrimmed,
      fechaOficio: fechaOficio || null,
      fechaRecibo: fechaRecibo || null,
      fechaLimite: fechaLimite || null,
      asunto: asunto.trim(),
      remitente: remitente.trim(),
      cargo: cargo?.trim() || '',
      dependencia: dependencia?.trim() || '',
      unidadIds,
      unidadId: unidadIds[0],
      unidadAlias: unidadAlias || '',
      responsableIds: responsableIds && responsableIds.length > 0
        ? responsableIds
        : (cooresponsableIds && cooresponsableIds.length > 0
            ? unidadIds.filter(id => !cooresponsableIds.includes(id))
            : unidadIds),
      cooresponsableIds: cooresponsableIds || [],
      estatus: estatus || actual.estatus,
      archivoPath,
      tipoArchivo: nuevoTipo,
      modo: modo !== undefined ? (Number(modo) === 1 ? 1 : 0) : (actual.modo ?? 0),
      actualizadoEn: new Date().toISOString()
    })

    return id
  }

  static async _hydratarUrls (oficio) {
    const storageBucket = bucket()

    if (oficio.archivoPath) {
      try {
        oficio.archivoUrl = await getSignedUrl(storageBucket, oficio.archivoPath)
      } catch {
        oficio.archivoUrl = null
      }
    } else {
      oficio.archivoUrl = null
    }

    if (Array.isArray(oficio.respuestas)) {
      for (const resp of oficio.respuestas) {
        if (Array.isArray(resp.archivos)) {
          for (const arch of resp.archivos) {
            if (arch.filePath) {
              try {
                arch.url = await getSignedUrl(storageBucket, arch.filePath)
              } catch {
                arch.url = null
              }
            }
          }
        }
      }
    }

    return oficio
  }

  static async getAll () {
    const firestore = db()
    const snapshot = await firestore
      .collection(OFICIOS_COLLECTION)
      .orderBy('creadoEn', 'desc')
      .get()

    const oficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return Promise.all(oficios.map(o => OficioRepository._hydratarUrls(o)))
  }

  static async getByUnidad (unidadId) {
    const firestore = db()

    const snapshot = await firestore
      .collection(OFICIOS_COLLECTION)
      .where('unidadIds', 'array-contains', unidadId)
      .orderBy('creadoEn', 'desc')
      .get()

    let oficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const legacySnapshot = await firestore
      .collection(OFICIOS_COLLECTION)
      .where('unidadId', '==', unidadId)
      .orderBy('creadoEn', 'desc')
      .get()

    const legacyIds = new Set(oficios.map(o => o.id))
    for (const doc of legacySnapshot.docs) {
      if (!legacyIds.has(doc.id)) {
        oficios.push({ id: doc.id, ...doc.data() })
      }
    }

    oficios.sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn))

    return Promise.all(oficios.map(o => OficioRepository._hydratarUrls(o)))
  }

  static async guardarRespuesta (oficioId, { unidadId, unidadAlias, comentario, archivos }) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(oficioId)
    const docSnap = await ref.get()

    if (!docSnap.exists) throw new NotFoundError('Oficio no encontrado')

    const oficio = docSnap.data()

    const cooresp = oficio.cooresponsableIds || []
    if (cooresp.includes(unidadId)) {
      throw new ValidationError('Esta unidad es co-responsable y no puede responder el oficio')
    }

    if (oficio.modo === 1) {
      const vistoPor = oficio.vistoPor || []
      if (!vistoPor.includes(unidadId)) {
        throw new ValidationError('Debe visualizar el oficio antes de marcar como enterado')
      }
    }

    const noOficio = oficio.noOficio.toUpperCase().replace(/[^A-Z0-9\-_]/g, '_')
    const aliasLimpio = unidadAlias.toUpperCase().replace(/[^A-Z0-9\-_]/g, '_')
    const storageBucket = bucket()

    const archivosGuardados = []

    for (let i = 0; i < archivos.length; i++) {
      const { buffer, mimetype, originalname } = archivos[i]
      const ext = originalname.split('.').pop().toLowerCase()
      const timestamp = Date.now()
      const nombreArchivo = `${noOficio}_${aliasLimpio}_${timestamp}_${i + 1}.${ext}`
      const filePath = `evidencias/${nombreArchivo}`

      const file = storageBucket.file(filePath)
      await file.save(buffer, {
        metadata: { contentType: mimetype },
        resumable: false
      })

      archivosGuardados.push({
        filePath,
        nombre: nombreArchivo,
        tipo: mimetype
      })
    }

    const respuestas = oficio.respuestas || []
    const idx = respuestas.findIndex(r => r.unidadId === unidadId)

    const nuevaRespuesta = {
      unidadId,
      unidadAlias,
      comentario: comentario?.trim() || '',
      fechaAtendido: new Date().toISOString(),
      archivos: archivosGuardados
    }

    if (idx >= 0) {
      if (archivosGuardados.length > 0) {
        nuevaRespuesta.archivos = [
          ...(respuestas[idx].archivos || []),
          ...archivosGuardados
        ]
      } else {
        nuevaRespuesta.archivos = respuestas[idx].archivos || []
      }
      respuestas[idx] = nuevaRespuesta
    } else {
      respuestas.push(nuevaRespuesta)
    }

    let nuevoEstatus = oficio.estatus

    const coorespIds = oficio.cooresponsableIds || []
    const idsTurnados = coorespIds.length > 0
      ? (oficio.responsableIds || oficio.unidadIds || (oficio.unidadId ? [oficio.unidadId] : []))
      : (oficio.unidadIds || (oficio.unidadId ? [oficio.unidadId] : []))
    const uadsQueRespondieron = new Set(respuestas.map(r => r.unidadId))
    const todasRespondieron = idsTurnados.every(id => uadsQueRespondieron.has(id))

    if (idsTurnados.length > 0 && todasRespondieron) {
      nuevoEstatus = 'Atendido'
    }

    await ref.update({ respuestas, estatus: nuevoEstatus })
    return oficioId
  }

  static async marcarVisto (oficioId, unidadId) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(oficioId)
    await ref.update({ vistoPor: FieldValue.arrayUnion(unidadId) })
  }

  static async agregarAclaracion (oficioId, { unidadId, unidadAlias, comentario, archivos }) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(oficioId)
    const docSnap = await ref.get()

    if (!docSnap.exists) throw new NotFoundError('Oficio no encontrado')

    const oficio = docSnap.data()

    const noOficio = oficio.noOficio.toUpperCase().replace(/[^A-Z0-9\-_]/g, '_')
    const aliasLimpio = unidadAlias.toUpperCase().replace(/[^A-Z0-9\-_]/g, '_')
    const storageBucket = bucket()

    const archivosGuardados = []
    for (let i = 0; i < archivos.length; i++) {
      const { buffer, mimetype, originalname } = archivos[i]
      const ext = originalname.split('.').pop().toLowerCase()
      const timestamp = Date.now()
      const nombreArchivo = `${noOficio}_${aliasLimpio}_aclaracion_${timestamp}_${i + 1}.${ext}`
      const filePath = `evidencias/${nombreArchivo}`

      const file = storageBucket.file(filePath)
      await file.save(buffer, {
        metadata: { contentType: mimetype },
        resumable: false
      })

      archivosGuardados.push({
        filePath,
        nombre: nombreArchivo,
        tipo: mimetype
      })
    }

    const respuestas = oficio.respuestas || []
    respuestas.push({
      unidadId,
      unidadAlias,
      comentario: comentario?.trim() || '',
      fechaAtendido: new Date().toISOString(),
      archivos: archivosGuardados,
      esAclaracion: true
    })

    await ref.update({ respuestas })
    return oficioId
  }

  static async updateEstatus (id, estatus) {
    if (!['Pendiente', 'Atendido'].includes(estatus)) {
      throw new ValidationError('Estatus inválido')
    }
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new NotFoundError('Oficio no encontrado')
    await ref.update({ estatus })
    return id
  }
}