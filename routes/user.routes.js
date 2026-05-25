import { Router } from 'express'
import { register } from '../controllers/auth.controller.js'
import { getUsuarios, updateUsuario } from '../controllers/users.controller.js'
import { authMiddleware, requireAdm } from '../middlewares/auth.middleware.js'
import { csrfProtection } from '../middlewares/security.middleware.js'

const router = Router()

router.post('/register',  authMiddleware, requireAdm, csrfProtection, register)
router.get('/users',      authMiddleware, requireAdm, getUsuarios)
router.put('/users/:id',  authMiddleware, requireAdm, csrfProtection, updateUsuario)

export default router
