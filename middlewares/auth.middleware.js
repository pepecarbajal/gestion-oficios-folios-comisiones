import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config.js'
import { UserRepository } from '../repositories/user.repository.js'

export const authMiddleware = async (req, res, next) => {
  const token = req.cookies?.access_token
  if (!token) return res.redirect('/login')

  try {
    const decoded = jwt.verify(token, SECRET_JWT_KEY)
    const usuarioActual = await UserRepository.getById(decoded.id)

    if (!usuarioActual) {
      res.clearCookie('access_token')
      return res.redirect('/login')
    }

    if (usuarioActual.estatus === 'Inactivo') {
      res.clearCookie('access_token')
      return res.redirect('/login?razon=cuenta_inactiva')
    }

    req.user = decoded
    next()
  } catch {
    res.clearCookie('access_token')
    res.redirect('/login')
  }
}

export const requireAdm = (req, res, next) => {
  if (req.user?.role !== 'ADM') {
    return res.status(403).json({ error: 'Forbidden: solo el rol ADM puede realizar esta acción' })
  }
  next()
}

export const requireAOF = (req, res, next) => {
  if (!['ADM', 'AOF'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Forbidden: acción solo disponible para Asistente de Oficios' })
  }
  next()
}

export const requireUAD = (req, res, next) => {
  if (req.user?.role !== 'UAD') {
    return res.status(403).json({ error: 'Forbidden: acción solo disponible para Unidades Administrativas' })
  }
  if (!req.user?.unidadId) {
    return res.status(403).json({ error: 'Tu usuario no tiene una unidad administrativa asignada' })
  }
  req.uad = {
    unidadId: req.user.unidadId,
    unidadAlias: req.user.unidadAlias || ''
  }
  next()
}