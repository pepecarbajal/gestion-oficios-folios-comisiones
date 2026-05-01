import bcrypt from 'bcrypt'
import { db } from '../db.js'
import { Validation } from '../validations/user.validation.js'
import { SALT_ROUND } from '../config.js'

const USERS_COLLECTION = 'users'

export class UserRepository {
  static async create ({ username, email, password, role }) {
    Validation.username(username)
    Validation.email(email)
    Validation.password(password)
    Validation.role(role)

    const firestore = db()

    const existingUser = await firestore
      .collection(USERS_COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!existingUser.empty) {
      throw new Error(`El email "${email}" ya está registrado`)
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUND)

    const userRef = await firestore.collection(USERS_COLLECTION).add({
      username,
      email,
      password: hashedPassword,
      role,
      estatus: 'Activo'
    })

    return userRef.id
  }

  static async login ({ email, password }) {
    Validation.email(email)
    Validation.password(password)

    const firestore = db()

    const snapshot = await firestore
      .collection(USERS_COLLECTION)
      .where('email', '==', email)
      .limit(1)
      .get()

    if (snapshot.empty) throw new Error('Credenciales incorrectas')

    const userDoc = snapshot.docs[0]
    const userData = userDoc.data()

    if (userData.estatus === 'Inactivo') {
      throw new Error('La cuenta está desactivada. Contacta al administrador.')
    }

    const isValid = await bcrypt.compare(password, userData.password)
    if (!isValid) throw new Error('Credenciales incorrectas')

    const { password: _, ...publicUser } = userData
    return { _id: userDoc.id, ...publicUser }
  }

  static async getById (id) {
    const firestore = db()
    const doc = await firestore.collection(USERS_COLLECTION).doc(id).get()
    if (!doc.exists) return null
    const { password: _, ...data } = doc.data()
    return { id: doc.id, ...data }
  }

  static async getAll () {
    const firestore = db()
    const snapshot = await firestore.collection(USERS_COLLECTION).get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }

  static async update (id, { username, email, role, estatus, password }) {
    const VALID_ESTATUS = ['Activo', 'Inactivo']
    if (estatus && !VALID_ESTATUS.includes(estatus)) {
      throw new Error(`Estatus inválido. Los valores permitidos son: ${VALID_ESTATUS.join(', ')}`)
    }

    const firestore = db()
    const userRef = firestore.collection(USERS_COLLECTION).doc(id)
    const userDoc = await userRef.get()

    if (!userDoc.exists) throw new Error('Usuario no encontrado')

    const updateData = { username, email, role, estatus }

    if (password && password.trim() !== '') {
      updateData.password = await bcrypt.hash(password, SALT_ROUND)
    }

    await userRef.update(updateData)
    return id
  }
}