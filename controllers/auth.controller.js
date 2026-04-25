import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config.js'
import { UserRepository } from '../repositories/user.repository.js'

export const register = async (req, res) => {
  const { username, email, password, role, administrativeUnitId } = req.body
  try {
    const userId = await UserRepository.create({ username, email, password, role, administrativeUnitId })
    res.status(201).json({ userId })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const login = async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await UserRepository.login({ email, password })
    const token = jwt.sign({ id: user.id, role: user.role }, SECRET_JWT_KEY, { expiresIn: '1h' })

    res
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 // 1 hora
      })
      .redirect('/dashboard')
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
}

export const logout = (req, res) => {
  res.clearCookie('access_token').redirect('/login')
}