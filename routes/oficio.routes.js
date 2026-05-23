import { Router } from 'express'
import { registrarOficio, editarOficio, actualizarEstatusOficio, guardarRespuestaUAD } from '../controllers/oficio.controller.js'
import { authMiddleware, requireAOF, requireUAD } from '../middlewares/auth.middleware.js'
import { csrfProtection } from '../middlewares/security.middleware.js'
import { uploadPDF, uploadEvidencias } from '../middlewares/upload.js'

const router = Router()

router.post('/oficios',
  authMiddleware, requireAOF, csrfProtection,
  uploadPDF.single('archivo'), registrarOficio)

router.put('/oficios/:id',
  authMiddleware, requireAOF, csrfProtection,
  uploadPDF.single('archivo'), editarOficio)

router.put('/oficios/:id/estatus',
  authMiddleware, requireAOF, csrfProtection,
  actualizarEstatusOficio)

router.post('/oficios/:id/respuesta',
  authMiddleware, requireUAD,
  uploadEvidencias.array('archivos', 10),
  csrfProtection,
  guardarRespuestaUAD)

export default router
