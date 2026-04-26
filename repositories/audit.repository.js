import { db } from '../db.js'

const AUDIT_COLLECTION = 'auditoria'

export class AuditRepository {
  /**
   * @param {object} entrada
   * @param {string} entrada.accion
   * @param {string|null} entrada.usuarioId
   * @param {string|null} entrada.usuarioEmail
   * @param {string|null} entrada.rol
   * @param {object} [entrada.detalle]
   * @param {string} [entrada.ip]
   */
  static async registrar ({ accion, usuarioId = null, usuarioEmail = null, rol = null, detalle = {}, ip = null }) {
    try {
      const firestore = db()
      await firestore.collection(AUDIT_COLLECTION).add({
        accion,
        usuarioId,
        usuarioEmail,
        rol,
        detalle,
        ip,
        timestamp: new Date().toISOString()
      })
    } catch (err) {
      console.error('[AuditRepository] Error al escribir entrada de auditoría:', err)
    }
  }
  
  static async getRecientes (limite = 100) {
    const firestore = db()
    const snapshot = await firestore
      .collection(AUDIT_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(limite)
      .get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  }
}