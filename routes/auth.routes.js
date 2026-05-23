import { Router } from 'express'
import { login, logout } from '../controllers/auth.controller.js'
import { loginLimiter, csrfProtection } from '../middlewares/security.middleware.js'

const router = Router()

router.get('/login', (req, res) => {
  res.render('login', { error: null, query: req.query })
})

router.get('/', (req, res) => {
  res.render('login', { error: null, query: req.query })
})

router.post('/login', loginLimiter, login)
router.post('/logout', csrfProtection, logout)

export default router
