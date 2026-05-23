import { Router } from 'express'
import { registeruad, getUads, updateUad } from '../controllers/uad.controller.js'
import { authMiddleware, requireAdm } from '../middlewares/auth.middleware.js'
import { csrfProtection } from '../middlewares/security.middleware.js'

const router = Router()

router.post('/registeruad', authMiddleware, requireAdm, csrfProtection, registeruad)
router.get('/uads',         authMiddleware, requireAdm, getUads)
router.put('/uads/:id',     authMiddleware, requireAdm, csrfProtection, updateUad)

export default router
