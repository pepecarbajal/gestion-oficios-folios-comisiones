import express from 'express'
import cookieParser from 'cookie-parser'
import { initFirebase } from './db.js'
import { PORT } from './config.js'
import authRoutes from './routes/auth.routes.js'
import adminRoutes from './routes/admin.routes.js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { securityHeaders, csrfInit } from './middlewares/security.middleware.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()

initFirebase()

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(securityHeaders)
app.use(csrfInit)

app.use(express.static(join(__dirname, 'public')))

app.use(authRoutes)
app.use(adminRoutes)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})