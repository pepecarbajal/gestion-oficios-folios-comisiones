import { Router } from 'express'
import { authMiddleware } from '../middlewares/auth.middleware.js'

const router = Router()

router.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected route', user: req.user })
})

export default router