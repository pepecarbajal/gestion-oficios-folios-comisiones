import { db } from '../db.js'
import { ValidationError, NotFoundError } from '../utils/errors.js'
import { StorageService } from '../services/storage.service.js'

const FOLIOS_COLLECTION = 'folios'

export class FolioRepository {
  static async getById (id) {
    const firestore = db()
    const ref = firestore.collection(FOLIOS_COLLECTION).doc(id)
    const docSnap = await ref.get()
    if (!docSnap.exists) throw new NotFoundError('Folio no encontrado')
    return { id: docSnap.id, ...docSnap.data() }
  }

  static async getNextNoFolio () {
    const firestore = db()
    const snapshot = await firestore.collection(FOLIOS_COLLECTION).get()
    let max = 0
    snapshot.forEach(doc => {
      const num = parseInt(doc.data().noFolio, 10)
      if (!isNaN(num) && num > max) max = num
    })
    const next = max + 1
    return String(next).padStart(Math.max(4, String(next).length), '0')
  }

  static async create ({
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

  static async registrarEntrega (id, { estatus, fechaEntrega, comentario, archivoPath }) {
    const firestore = db()
    const ref = firestore.collection(FOLIOS_COLLECTION).doc(id)
    const docSnap = await ref.get()
    if (!docSnap.exists) throw new NotFoundError('Folio no encontrado')

    await ref.update({
      estatus: estatus || 'Atendido',
      fechaEntrega: fechaEntrega || new Date().toISOString(),
      comentario: comentario?.trim() || '',
      archivoPath,
      actualizadoEn: new Date().toISOString()
    })

    return id
  }

  static async cancelar (id) {
    const firestore = db()
    const ref = firestore.collection(FOLIOS_COLLECTION).doc(id)
    const docSnap = await ref.get()
    if (!docSnap.exists) throw new NotFoundError('Folio no encontrado')

    await ref.update({
      estatus: 'Cancelado',
      fechaCancelacion: new Date().toISOString(),
      actualizadoEn: new Date().toISOString()
    })

    return id
  }

  static async getAll () {
    const firestore = db()
    const snapshot = await firestore
      .collection(FOLIOS_COLLECTION)
      .orderBy('fechaSolicitud', 'asc')
      .get()

    const folios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return Promise.all(folios.map(f => StorageService.hydrateFolioUrl(f)))
  }

  static async getByUnidad (unidadId) {
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
    return Promise.all(folios.map(f => StorageService.hydrateFolioUrl(f)))
  }
}
