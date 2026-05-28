import express from 'express'
import cookieParser from 'cookie-parser'
import { securityHeaders, csrfInit, csrfProtection } from '../../middlewares/security.middleware.js'
import { errorHandler } from '../../middlewares/error-handler.js'
import { uploadPDF, uploadEvidencias } from '../../middlewares/upload.js'
import {
  registrarOficio, editarOficio, actualizarEstatusOficio,
  guardarRespuestaUAD, agregarAclaracionUAD, marcarVisto
} from '../../controllers/oficio.controller.js'
import {
  solicitarFolio, registrarFolio, getNextFolio,
  registrarEntrega, cancelarFolio
} from '../../controllers/folio.controller.js'
import { dashboard } from '../../controllers/dashboard.controller.js'

export function createTestApp({ user, mockAuth = true } = {}) {
  const app = express()

  app.set('view engine', 'ejs')
  app.set('views', './views')
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))
  app.use(cookieParser())
  app.use(securityHeaders)
  app.use(csrfInit)

  if (mockAuth) {
    app.use((req, res, next) => {
      req.user = user || {
        id: 'test-user',
        role: 'UAD',
        email: 'test@example.com',
        unidadId: 'test-unidad',
        unidadAlias: 'Test Unidad'
      }
      req.uad = {
        unidadId: req.user.unidadId,
        unidadAlias: req.user.unidadAlias || ''
      }
      next()
    })
  }

  return app
}

export function wireOficioRoutes(app) {
  app.post('/oficios', csrfProtection, uploadPDF.single('archivo'), registrarOficio)
  app.put('/oficios/:id', csrfProtection, uploadPDF.single('archivo'), editarOficio)
  app.put('/oficios/:id/estatus', csrfProtection, actualizarEstatusOficio)
  app.post('/oficios/:id/respuesta', csrfProtection, uploadEvidencias.array('archivos', 10), guardarRespuestaUAD)
  app.post('/oficios/:id/aclaracion', csrfProtection, uploadEvidencias.array('archivos', 10), agregarAclaracionUAD)
  app.post('/oficios/:id/visto', csrfProtection, marcarVisto)
  app.use(errorHandler)
  return app
}

export function wireFolioRoutes(app) {
  app.get('/folios/next', getNextFolio)
  app.post('/folios/aof', csrfProtection, registrarFolio)
  app.post('/folios/uad', csrfProtection, solicitarFolio)
  app.put('/folios/:id/entrega', csrfProtection, uploadPDF.single('archivo'), registrarEntrega)
  app.put('/folios/:id/cancelar', csrfProtection, cancelarFolio)
  app.use(errorHandler)
  return app
}

export function wireDashboardRoutes(app) {
  app.get('/dashboard', dashboard)
  app.use(errorHandler)
  return app
}

export async function buildFullTestApp({ user, routes = ['oficio', 'folio'] } = {}) {
  const app = createTestApp({ user })
  for (const route of routes) {
    if (route === 'oficio') wireOficioRoutes(app)
    if (route === 'folio') wireFolioRoutes(app)
    if (route === 'dashboard') wireDashboardRoutes(app)
  }
  return app
}

export { csrfProtection, uploadPDF, uploadEvidencias }
