import express from 'express'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import { connectDB } from './db.js'
import { UserRepository } from './repositories/user.repository.js'
import { PORT, SECRET_JWT_KEY } from './config.js'

const app = express()

await connectDB()

app.use(express.json())
app.use(cookieParser())

// Middleware para verificar el token
const authMiddleware = (req, res, next) => {
  const token = req.cookies?.access_token
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const decoded = jwt.verify(token, SECRET_JWT_KEY)
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/register', async (req, res) => {
  const { username, email, password, role, administrativeUnitId } = req.body
  try {
    const userId = await UserRepository.create({ username, email, password, role, administrativeUnitId })
    res.status(201).json({ userId })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const user = await UserRepository.login({ email, password })
    const token = jwt.sign(user, SECRET_JWT_KEY, { expiresIn: '1h' })

    res
      .cookie('access_token', token, {
        httpOnly: true,     // No accesible desde JS del cliente
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 // 1 hora
      })
      .json({ message: 'Login successful', user })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
})

app.post('/logout', (req, res) => {
  res.clearCookie('access_token').json({ message: 'Logout successful' })
})

app.get('/protected', authMiddleware, (req, res) => {
  res.json({ message: 'Protected route', user: req.user })
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})