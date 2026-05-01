import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config.js'
import { UserRepository } from '../repositories/user.repository.js'
import { UADRepository } from '../repositories/uad.repository.js'
import { AuditRepository } from '../repositories/audit.repository.js'

const getIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || null

export const register = async (req, res) => {
  const { username, email, password, role } = req.body
  try {
    const userId = await UserRepository.create({ username, email, password, role })

    await AuditRepository.registrar({
      accion: 'USUARIO_CREADO',
      usuarioId: req.user?.id,
      usuarioEmail: req.user?.email || null,
      rol: req.user?.role,
      detalle: { nuevoUsuarioEmail: email, nuevoRol: role },
      ip: getIp(req)
    })

    res.status(201).json({ userId })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body
  const ip = getIp(req)

  try {
    const user = await UserRepository.login({ email, password })

    let unidadId = null
    let unidadAlias = ''

    if (user.role === 'UAD') {
      try {
        const unidad = await UADRepository.getByTitularId(user._id)
        if (unidad) {
          unidadId = unidad.id
          unidadAlias = unidad.alias || ''
        }
      } catch (_) {}
    }

    const tokenPayload = {
      id: user._id,
      role: user.role,
      unidadId,
      unidadAlias
    }

    const token = jwt.sign(tokenPayload, SECRET_JWT_KEY, { expiresIn: '8h' })

    await AuditRepository.registrar({
      accion: 'LOGIN_OK',
      usuarioId: user._id,
      usuarioEmail: email,
      rol: user.role,
      detalle: {},
      ip
    })

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 8
      })
      .redirect('/dashboard')
  } catch (error) {
    await AuditRepository.registrar({
      accion: 'LOGIN_FAIL',
      usuarioId: null,
      usuarioEmail: email,
      rol: null,
      detalle: { razon: error.message },
      ip
    })

    res.status(401).render('login', { error: 'Credenciales incorrectas' })
  }
}

export const logout = (req, res) => {
  AuditRepository.registrar({
    accion: 'LOGOUT',
    usuarioId: req.user?.id || null,
    usuarioEmail: null,
    rol: req.user?.role || null,
    detalle: {},
    ip: getIp(req)
  })

  res.clearCookie('access_token').redirect('/login')
}