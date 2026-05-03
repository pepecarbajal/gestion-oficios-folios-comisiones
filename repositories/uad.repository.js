import { db } from '../db.js'

const UADS_COLLECTION = 'unidadesAdministrativas'
let uadCache = null

export class UADRepository {
  static async create ({ uadname, alias, titularId = null }) {
    const firestore = db()


    const existingAlias = await firestore
      .collection(UADS_COLLECTION)
      .where('alias', '==', alias)
      .limit(1)
      .get()

    if (!existingAlias.empty) {
      throw new Error(`El alias "${alias}" ya está registrado`)
    }

    const userRef = await firestore.collection(UADS_COLLECTION).add({
      uadname,
      alias,
      titularId
    })

    return userRef.id
  }

  static async getAll () {
    if (uadCache) return uadCache
    const firestore = db()
    const snapshot = await firestore.collection(UADS_COLLECTION).get()
    uadCache = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    return uadCache
  }

  static async getByTitularId (titularId) {
    const firestore = db()
    const snapshot = await firestore
      .collection(UADS_COLLECTION)
      .where('titularId', '==', titularId)
      .limit(1)
      .get()
    if (snapshot.empty) return null
    const doc = snapshot.docs[0]
    return { id: doc.id, ...doc.data() }
  }

  static async update (id, { uadname, alias, titularId }) {
    const firestore = db()

    const ref = firestore.collection(UADS_COLLECTION).doc(id)
    const doc = await ref.get()

    if (!doc.exists) throw new Error('Unidad no encontrada')

    const existing = await firestore
      .collection(UADS_COLLECTION)
      .where('alias', '==', alias)
      .limit(1)
      .get()

    if (!existing.empty && existing.docs[0].id !== id) {
      throw new Error(`El alias "${alias}" ya está en uso`)
    }

    const updateData = { uadname, alias }
    if (titularId !== undefined) {
      updateData.titularId = titularId || null
    }

    await ref.update(updateData)
    return id
  }
}