import { Router } from 'express'
import { dashboard } from '../controllers/dashboard.controller.js'
import { authMiddleware, requireAdm } from '../middlewares/auth.middleware.js'
import { AuditRepository } from '../repositories/audit.repository.js'

const router = Router()

router.get('/dashboard', authMiddleware, dashboard)

router.get('/api/auditoria', authMiddleware, requireAdm, async (req, res, next) => {
  try {
    const { fechaDesde, fechaHasta, usuarioId } = req.query
    const logs = await AuditRepository.getByFilters({ fechaDesde, fechaHasta, usuarioId })
    res.json(logs)
  } catch (err) {
    next(err)
  }
})

export default router
