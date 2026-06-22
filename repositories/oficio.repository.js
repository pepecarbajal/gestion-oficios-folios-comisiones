import { db } from '../db.js'
import { ValidationError, NotFoundError } from '../utils/errors.js'
import { FieldValue } from 'firebase-admin/firestore'
import { StorageService } from '../services/storage.service.js'

const OFICIOS_COLLECTION = 'oficios'

export class OficioRepository {
  static async getById (id) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(id)
    const docSnap = await ref.get()
    if (!docSnap.exists) throw new NotFoundError('Oficio no encontrado')
    return { id: docSnap.id, ...docSnap.data() }
  }

  static async create ({
    noOficio, fechaOficio, fechaRecibo, fechaLimite,
    asunto, remitente, cargo, dependencia,
    unidadIds, unidadAlias, archivoPath,
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
    archivoPath,
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
      archivoPath: archivoPath !== undefined ? archivoPath : actual.archivoPath,
      tipoArchivo: nuevoTipo,
      modo: modo !== undefined ? (Number(modo) === 1 ? 1 : 0) : (actual.modo ?? 0),
      actualizadoEn: new Date().toISOString()
    })

    return id
  }

  static async getAll () {
    const firestore = db()
    const snapshot = await firestore
      .collection(OFICIOS_COLLECTION)
      .orderBy('creadoEn', 'desc')
      .get()

    const oficios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return Promise.all(oficios.map(o => StorageService.hydrateOficioUrls(o)))
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

    return Promise.all(oficios.map(o => StorageService.hydrateOficioUrls(o)))
  }

  static async guardarRespuesta (oficioId, { respuestas, estatus }) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(oficioId)
    const docSnap = await ref.get()
    if (!docSnap.exists) throw new NotFoundError('Oficio no encontrado')
    await ref.update({ respuestas, estatus })
    return oficioId
  }

  static async agregarAclaracion (oficioId, { respuestas }) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(oficioId)
    const docSnap = await ref.get()
    if (!docSnap.exists) throw new NotFoundError('Oficio no encontrado')
    await ref.update({ respuestas })
    return oficioId
  }

  static async marcarVisto (oficioId, unidadId) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(oficioId)
    await ref.update({ vistoPor: FieldValue.arrayUnion(unidadId) })
  }

  static async marcarVistoAOF (oficioId, userId) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(oficioId)
    await ref.update({ aofVisto: FieldValue.arrayUnion(userId) })
  }

  static async updateEstatus (id, estatus) {
    const firestore = db()
    const ref = firestore.collection(OFICIOS_COLLECTION).doc(id)
    const doc = await ref.get()
    if (!doc.exists) throw new NotFoundError('Oficio no encontrado')
    await ref.update({ estatus })
    return id
  }
}
