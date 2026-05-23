import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config.js'
import { getIp } from '../utils/ip.js'
import { registerUser, authenticateUser, logFailedLogin, logLogout } from '../services/auth.service.js'

export const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body
    const userId = await registerUser({
      username, email, password, role,
      auditInfo: {
        userId: req.user?.id,
        email: req.user?.email || null,
        role: req.user?.role,
        ip: getIp(req)
      }
    })
    res.status(201).json({ userId })
  } catch (error) {
    next(error)
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body
  const ip = getIp(req)

  try {
    const { user, unidadId, unidadAlias } = await authenticateUser({ email, password, ip })

    const tokenPayload = { id: user._id, role: user.role, unidadId, unidadAlias }
    const token = jwt.sign(tokenPayload, SECRET_JWT_KEY, { expiresIn: '8h' })

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 8
      })
      .redirect('/dashboard')
  } catch (error) {
    await logFailedLogin({ email, ip, reason: error.message }).catch(() => {})
    res.status(401).render('login', { error: 'Credenciales incorrectas' })
  }
}

export const logout = async (req, res) => {
  try {
    await logLogout({
      userId: req.user?.id || null,
      role: req.user?.role || null,
      ip: getIp(req)
    })
  } catch (_) {} finally {
    res.clearCookie('access_token').redirect('/login')
  }
}
