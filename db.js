import admin from 'firebase-admin'
import { createRequire } from 'module'
import {
  STORAGE_BUCKET,
  FIREBASE_PROJECT_ID,
  FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_PRIVATE_KEY,
  FIREBASE_CLIENT_EMAIL,
  FIREBASE_CLIENT_ID,
  FIREBASE_CLIENT_CERT_URL
} from './config.js'

const require = createRequire(import.meta.url)

export const initFirebase = () => {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: 'service_account',
        project_id: FIREBASE_PROJECT_ID,
        private_key_id: FIREBASE_PRIVATE_KEY_ID,
        private_key: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: FIREBASE_CLIENT_EMAIL,
        client_id: FIREBASE_CLIENT_ID,
        auth_uri: 'https://www.googleapis.com/oauth2/v1/certs',
        token_uri: 'https://oauth2.googleapis.com/token',
        client_x509_cert_url: FIREBASE_CLIENT_CERT_URL
      }),
      storageBucket: STORAGE_BUCKET
    })
    console.log('Firebase conectado correctamente')
  } catch (error) {
    console.error('Error al conectar Firebase:', error.message)
    process.exit(1)
  }
}

export const db = () => admin.firestore()
export const bucket = () => admin.storage().bucket()
