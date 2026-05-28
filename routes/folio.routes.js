import { Router } from 'express'
import { solicitarFolio, registrarFolio, getNextFolio, registrarEntrega, cancelarFolio } from '../controllers/folio.controller.js'
import { authMiddleware, requireAOF, requireUAD, requireUADorAOF } from '../middlewares/auth.middleware.js'
import { csrfProtection } from '../middlewares/security.middleware.js'
import { uploadPDF } from '../middlewares/upload.js'

const router = Router()

router.get('/folios/next',
  authMiddleware, requireAOF,
  getNextFolio)

router.post('/folios/aof',
  authMiddleware, requireAOF, csrfProtection,
  registrarFolio)

router.post('/folios/uad',
  authMiddleware, requireUADorAOF, csrfProtection,
  solicitarFolio)

router.put('/folios/:id/entrega',
  authMiddleware, requireUADorAOF, csrfProtection,
  uploadPDF.single('archivo'), registrarEntrega)

router.put('/folios/:id/cancelar',
  authMiddleware, csrfProtection,
  cancelarFolio)

export default router
