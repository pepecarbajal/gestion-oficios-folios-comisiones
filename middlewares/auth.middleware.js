import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config.js'

export const authMiddleware = (req, res, next) => {
  const token = req.cookies?.access_token
  if (!token) return res.redirect('/login')

  try {
    const decoded = jwt.verify(token, SECRET_JWT_KEY)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

export const requireAdm = (req, res, next) => {
  if (req.user?.role !== 'ADM') {
    return res.status(403).json({ error: 'Forbidden: solo el rol ADM puede realizar esta acción' })
  }
  next()
}