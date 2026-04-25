import { Router } from 'express'
import { register, login, logout } from '../controllers/auth.controller.js'
import { registeruad, getUads } from '../controllers/uad.controller.js'
import { getUsuarios } from '../controllers/users.controller.js'
import { authMiddleware, requireAdm } from '../middlewares/auth.middleware.js'
import { dashboard } from '../controllers/dashboard.controller.js'
import { updateUsuario } from '../controllers/users.controller.js'

const router = Router()

router.post('/login', login)
router.post('/logout', logout)

router.post('/register', authMiddleware, requireAdm, register)
router.post('/registeruad', authMiddleware, requireAdm, registeruad)

router.get('/users', authMiddleware, requireAdm, getUsuarios)
router.get('/uads', authMiddleware, requireAdm, getUads)

router.get('/dashboard', authMiddleware, dashboard)
router.put('/users/:id', authMiddleware, requireAdm, updateUsuario)


export default router