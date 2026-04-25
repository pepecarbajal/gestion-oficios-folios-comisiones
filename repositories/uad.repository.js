import bcrypt from 'bcrypt'
import { db } from '../db.js'
import { Validation } from '../validations/uad.validation.js'

const UADS_COLLECTION = 'unidadesAdministrativas'

export class UADRepository {
  static async create({ uadname, alias }) {
    Validation.uadname(uadname)
    Validation.alias(alias)

    const firestore = db()

    const existingUser = await firestore
      .collection(UADS_COLLECTION)
      .where('alias', '==', alias)
      .limit(1)
      .get()

    if (!existingUser.empty) {
      throw new Error(`El alias "${alias}" ya está registrado`)
    }

    const userRef = await firestore.collection(UADS_COLLECTION).add({
      uadname,
      alias
    })

    return userRef.id
  }

  static async registeruad({ uadname, alias }) {
    Validation.uadname(uadname)
    Validation.alias(alias)

    const firestore = db()

    const snapshot = await firestore
      .collection(UADS_COLLECTION)
      .where('alias', '==', alias)
      .limit(1)
      .get()

    if (snapshot.empty) throw new Error('User not found')

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()
  }

  static async getAll() {
    const firestore = db()
    const snapshot = await firestore.collection(UADS_COLLECTION).get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }

  static async update(id, { uadname, alias }) {
    Validation.uadname(uadname)
    Validation.alias(alias)

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

    await ref.update({ uadname, alias })
    return id
  }
}