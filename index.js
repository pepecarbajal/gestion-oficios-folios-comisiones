import express from 'express'
import cookieParser from 'cookie-parser'
import { initFirebase } from './db.js'
import { PORT } from './config.js'
import authRoutes from './routes/admin.routes.js'
import protectedRoutes from './routes/protected.routes.js'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()

initFirebase()

app.set('view engine', 'ejs')
app.set('views', './views')
app.use(express.json())
app.use(express.urlencoded({ extended: true })); 
app.use(cookieParser())
app.use(express.static(join(__dirname, 'public')))


app.get('/login', (req, res) => {
  res.render('login', { error: null })
})

app.use(authRoutes)
app.use(protectedRoutes)

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})