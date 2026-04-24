import admin from 'firebase-admin'
import { createRequire } from 'module'

const require = createRequire(import.meta.url)
const serviceAccount = require('./serviceAccountKey.json')

export const initFirebase = () => {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    })
    console.log('Firebase conectado correctamente')
  } catch (error) {
    console.error('Error al conectar Firebase:', error.message)
    process.exit(1)
  }
}

export const db = () => admin.firestore()