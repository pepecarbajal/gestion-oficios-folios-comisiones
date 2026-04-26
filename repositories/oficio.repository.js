import { db, bucket } from '../db.js'

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
    unidadId, unidadAlias, archivoBuffer, archivoMime
  }) {
    if (!noOficio) throw new Error('El número de oficio es obligatorio')
    if (!asunto) throw new Error('El asunto es obligatorio')
    if (!remitente) throw new Error('El remitente es obligatorio')
    if (!unidadId) throw new Error('La unidad a turnar es obligatoria')

    const firestore = db()

    const existing = await firestore
      .collection(OFICIOS_COLLECTION)
      .where('noOficio', '==', noOficio.trim())
      .limit(1)
      .get()

    if (!existing.empty) {
      throw new Error(`El oficio "${noOficio}" ya está registrado`)
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
      unidadId,
      unidadAlias: unidadAlias || '',
      estatus: 'Pendiente',
      archivoPath,
      respuestas: [],
      creadoEn: new Date().toISOString()
    })

    return docRef.id
  }

  static async _hydratarUrls (oficio) {
    const storageBucket = bucket()

    // URL del PDF principal
    if (oficio.archivoPath) {
      try {
        oficio.archivoUrl = await getSignedUrl(storageBucket, oficio.archivoPath)
      } catch {
        oficio.archivoUrl = null
      }
    } else {
      oficio.archivoUrl = null
    }

    // URLs de archivos de evidencias en respuestas
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
      .get()

    const oficios = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(o => o.unidadId === unidadId || o.unidadId === 'TODAS')
      .sort((a, b) => (b.creadoEn > a.creadoEn ? 1 : -1))

    return Promise.all(oficios.map(o => OficioRepository._hydratarUrls(o)))
  }

  static async guardarRespuesta (oficioId, { unidadId, unidadAlias, comentario, archivos }) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(oficioId)
    const docSnap = await ref.get()

    if (!docSnap.exists) throw new Error('Oficio no encontrado')

    const oficio = docSnap.data()
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

    if (oficio.unidadId === 'TODAS') {
      const todasUads = await firestore.collection('unidadesAdministrativas').get()
      const totalUads = todasUads.size
      const uadsQueRespondieron = new Set(respuestas.map(r => r.unidadId)).size
      if (uadsQueRespondieron >= totalUads && totalUads > 0) {
        nuevoEstatus = 'Atendido'
      }
    } else {
      nuevoEstatus = 'Atendido'
    }

    await ref.update({ respuestas, estatus: nuevoEstatus })
    return oficioId
  }

  static async updateEstatus (id, estatus) {
    if (!['Pendiente', 'Atendido'].includes(estatus)) {
      throw new Error('Estatus inválido')
    }
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new Error('Oficio no encontrado')
    await ref.update({ estatus })
    return id
  }
}