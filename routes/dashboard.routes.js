import { Router } from 'express'
import { dashboard } from '../controllers/dashboard.controller.js'
import { authMiddleware, requireAdm } from '../middlewares/auth.middleware.js'
import { AuditRepository } from '../repositories/audit.repository.js'
import { UserRepository } from '../repositories/user.repository.js'
import { formatAuditLogs, mapaUsuarios } from '../utils/audit-format.js'

const router = Router()

router.get('/dashboard', authMiddleware, dashboard)

router.get('/api/auditoria', authMiddleware, requireAdm, async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, usuarioId } = req.query
    const limite = Math.min(Math.max(parseInt(req.query.limite, 10) || 50, 1), 500)
    const [logs, usuarios] = await Promise.all([
      AuditRepository.getByFilters({ fechaDesde, fechaHasta, usuarioId, limite }),
      UserRepository.getAll()
    ])
    res.json(formatAuditLogs(logs, mapaUsuarios(usuarios)))
  } catch (err) {
    next(err)
  }
})

export default router
