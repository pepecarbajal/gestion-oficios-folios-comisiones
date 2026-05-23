import { Router } from 'express'
import { dashboard } from '../controllers/dashboard.controller.js'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/dashboard', authMiddleware, dashboard)

export default router
