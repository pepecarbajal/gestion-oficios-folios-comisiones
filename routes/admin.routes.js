import { Router } from 'express'
import multer from 'multer'
import { register, login, logout } from '../controllers/auth.controller.js'
import { registeruad, getUads, updateUad } from '../controllers/uad.controller.js'
import { getUsuarios, updateUsuario } from '../controllers/users.controller.js'
import { authMiddleware, requireAdm, requireAOF, requireUAD } from '../middlewares/auth.middleware.js'
import { loginLimiter, csrfProtection } from '../middlewares/security.middleware.js'
import { dashboard } from '../controllers/dashboard.controller.js'
import { registrarOficio, actualizarEstatusOficio, guardarRespuestaUAD } from '../controllers/oficio.controller.js'

const router = Router()

const tiposPermitidos = [
  'application/pdf',
  'image/jpeg', 'image/jpg', 'image/png', 'image/webp'
]

const uploadPDF = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    file.mimetype === 'application/pdf'
      ? cb(null, true)
      : cb(new Error('Solo se permiten archivos PDF'), false)
  }
})

const uploadEvidencias = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    tiposPermitidos.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`Tipo no permitido: ${file.mimetype}`), false)
  }
})


router.post('/login', loginLimiter, login)

router.post('/logout', csrfProtection, logout)

router.post('/register',    authMiddleware, requireAdm, csrfProtection, register)
router.post('/registeruad', authMiddleware, requireAdm, csrfProtection, registeruad)
router.put('/uads/:id',     authMiddleware, requireAdm, csrfProtection, updateUad)

router.get('/users', authMiddleware, requireAdm, getUsuarios)
router.get('/uads',  authMiddleware, requireAdm, getUads)
router.put('/users/:id', authMiddleware, requireAdm, csrfProtection, updateUsuario)

router.get('/dashboard', authMiddleware, dashboard)

router.post('/oficios',
  authMiddleware, requireAOF, csrfProtection,
  uploadPDF.single('archivo'), registrarOficio)

router.put('/oficios/:id/estatus',
  authMiddleware, requireAOF, csrfProtection,
  actualizarEstatusOficio)

router.post('/oficios/:id/respuesta',
  authMiddleware, requireUAD,
  uploadEvidencias.array('archivos', 10),
  csrfProtection,
  guardarRespuestaUAD)

export default router