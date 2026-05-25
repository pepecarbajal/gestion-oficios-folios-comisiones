import { db, bucket } from '../db.js'
import { ValidationError, NotFoundError } from '../utils/errors.js'

const FOLIOS_COLLECTION = 'folios'
const SIGNED_URL_EXPIRY_MINUTES = 60

async function getSignedUrl(storageBucket, filePath) {
  const file = storageBucket.file(filePath)
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000
  })
  return url
}

export class FolioRepository {
  static async getNextNoFolio() {
    const firestore = db()
    const snapshot = await firestore.collection(FOLIOS_COLLECTION).get()
    let max = 0
    snapshot.forEach(doc => {
      const num = parseInt(doc.data().noFolio, 10)
      if (!isNaN(num) && num > max) max = num
    })
    const next = max + 1
    return String(next).padStart(Math.max(3, String(next).length), '0')
  }

  static async create({
    noFolio, destinatario, dependencia, cargo, asunto,
    unidadIds, unidadAlias, creadoPor, creadoPorId
  }) {
    const firestore = db()

    const existing = await firestore
      .collection(FOLIOS_COLLECTION)
      .where('noFolio', '==', noFolio.trim())
      .limit(1)
      .get()

    if (!existing.empty) {
      throw new ValidationError(`El folio "${noFolio}" ya está registrado`)
    }

    const docRef = await firestore.collection(FOLIOS_COLLECTION).add({
      noFolio,
      destinatario: destinatario.trim(),
      dependencia: dependencia?.trim() || '',
      cargo: cargo?.trim() || '',
      asunto: asunto.trim(),
      unidadIds,
      unidadId: unidadIds[0],
      unidadAlias: unidadAlias || '',
      creadoPor,
      creadoPorId,
      fechaSolicitud: new Date().toISOString(),
      estatus: 'Pendiente',
      fechaEntrega: null,
      comentario: null,
      archivoPath: null,
      creadoEn: new Date().toISOString()
    })
    return docRef.id
  }

  static async registrarEntrega(id, { fechaEntrega, comentario, archivoBuffer, archivoMime }) {
    const firestore = db()
    const ref = firestore.collection(FOLIOS_COLLECTION).doc(id)
    const docSnap = await ref.get()
    if (!docSnap.exists) throw new NotFoundError('Folio no encontrado')

    const actual = docSnap.data()
    if (actual.estatus === 'Atendido') {
      throw new ValidationError('Este folio ya fue atendido')
    }
    if (actual.estatus === 'Cancelado') {
      throw new ValidationError('Este folio fue cancelado')
    }

    let archivoPath = null
    if (archivoBuffer && archivoMime === 'application/pdf') {
      const storageBucket = bucket()
      const nombreArchivo = `folio_${actual.noFolio}.pdf`
      archivoPath = `folios/${nombreArchivo}`
      const file = storageBucket.file(archivoPath)
      await file.save(archivoBuffer, {
        metadata: { contentType: 'application/pdf' },
        resumable: false
      })
    }

    await ref.update({
      estatus: 'Atendido',
      fechaEntrega: fechaEntrega || new Date().toISOString(),
      comentario: comentario?.trim() || '',
      archivoPath,
      actualizadoEn: new Date().toISOString()
    })

    return id
  }

  static async cancelar(id) {
    const firestore = db()
    const ref = firestore.collection(FOLIOS_COLLECTION).doc(id)
    const docSnap = await ref.get()
    if (!docSnap.exists) throw new NotFoundError('Folio no encontrado')

    const actual = docSnap.data()
    if (actual.estatus !== 'Pendiente') {
      throw new ValidationError('Solo se pueden cancelar folios pendientes')
    }

    await ref.update({
      estatus: 'Cancelado',
      fechaCancelacion: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    })

    return id
  }

  static async getAll() {
    const firestore = db()
    const snapshot = await firestore
      .collection(FOLIOS_COLLECTION)
      .orderBy('fechaSolicitud', 'asc')
      .get()

    const folios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return FolioRepository._hydratarUrls(folios)
  }

  static async getByUnidad(unidadId) {
    const firestore = db()

    const snapshot = await firestore
      .collection(FOLIOS_COLLECTION)
      .where('unidadIds', 'array-contains', unidadId)
      .orderBy('fechaSolicitud', 'asc')
      .get()

    let folios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    const legacySnapshot = await firestore
      .collection(FOLIOS_COLLECTION)
      .where('unidadId', '==', unidadId)
      .orderBy('fechaSolicitud', 'asc')
      .get()

    const legacyIds = new Set(folios.map(f => f.id))
    for (const doc of legacySnapshot.docs) {
      if (!legacyIds.has(doc.id)) {
        folios.push({ id: doc.id, ...doc.data() })
      }
    }

    folios.sort((a, b) => new Date(a.fechaSolicitud) - new Date(b.fechaSolicitud))
    return FolioRepository._hydratarUrls(folios)
  }

  static async _hydratarUrls(folios) {
    const storageBucket = bucket()
    return Promise.all(folios.map(async folio => {
      if (folio.archivoPath) {
        try {
          folio.archivoUrl = await getSignedUrl(storageBucket, folio.archivoPath)
        } catch {
          folio.archivoUrl = null
        }
      } else {
        folio.archivoUrl = null
      }
      return folio
    }))
  }
}
