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

  static async getByFilters ({ fechaDesde, fechaHasta, usuarioId, limite = 50 }) {
    const firestore = db()
    let query = firestore.collection(AUDIT_COLLECTION)

    if (usuarioId) {
      query = query.where('usuarioId', '==', usuarioId)
    }

    if (fechaDesde) {
      query = query.where('timestamp', '>=', new Date(fechaDesde).toISOString())
    }

    if (fechaHasta) {
      const hasta = new Date(fechaHasta)
      hasta.setDate(hasta.getDate() + 1)
      query = query.where('timestamp', '<=', hasta.toISOString())
    }

    query = query.orderBy('timestamp', 'desc').limit(limite)

    try {
      const snapshot = await query.get()
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    } catch (err) {
      if (err.code === 'ENOENT' || err.message?.includes('index')) {
        const todos = await this.getRecientes(limite)
        return todos.filter(log => {
          if (usuarioId && log.usuarioId !== usuarioId) return false
          if (fechaDesde && log.timestamp < new Date(fechaDesde).toISOString()) return false
          if (fechaHasta) {
            const hasta = new Date(fechaHasta)
            hasta.setDate(hasta.getDate() + 1)
            if (log.timestamp > hasta.toISOString()) return false
          }
          return true
        })
      }
      throw err
    }
  }

  static async getDistinctUsers (limite = 1000) {
    const firestore = db()
    const snapshot = await firestore
      .collection(AUDIT_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(limite)
      .get()
    const userMap = {}
    snapshot.docs.forEach(doc => {
      const data = doc.data()
      if (data.usuarioId && !userMap[data.usuarioId]) {
        userMap[data.usuarioId] = {
          id: data.usuarioId,
          email: data.usuarioEmail || '—',
          rol: data.rol || '—'
        }
      }
    })
    return Object.values(userMap)
  }
}