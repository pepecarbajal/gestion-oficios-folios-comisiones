import { describe, it, expect } from 'vitest'
import { OficioValidation } from '../../../validations/oficio.validation.js'

describe('OficioValidation', () => {
  describe('validateRegistro', () => {
    it('debe pasar con datos válidos', () => {
      const body = {
        noOficio: 'OF-2024-001',
        asunto: 'Solicitud de información',
        remitente: 'Juan Pérez',
        unidadIds: ['unidad-1']
      }
      expect(() => OficioValidation.validateRegistro(body, null)).not.toThrow()
    })

    it('debe rechazar si falta noOficio', () => {
      expect(() => OficioValidation.validateRegistro({ asunto: 'x', remitente: 'x', unidadIds: ['x'] }, null))
        .toThrow('El número de oficio es obligatorio')
    })

    it('debe rechazar si falta asunto', () => {
      expect(() => OficioValidation.validateRegistro({ noOficio: 'OF-001', remitente: 'x', unidadIds: ['x'] }, null))
        .toThrow('El asunto es obligatorio')
    })

    it('debe rechazar si falta remitente', () => {
      expect(() => OficioValidation.validateRegistro({ noOficio: 'OF-001', asunto: 'x', unidadIds: ['x'] }, null))
        .toThrow('El remitente es obligatorio')
    })

    it('debe rechazar si no hay unidades', () => {
      expect(() => OficioValidation.validateRegistro({ noOficio: 'OF-001', asunto: 'x', remitente: 'x' }, null))
        .toThrow('Debe seleccionar al menos una unidad')
    })

    it('debe rechazar si unidadIds es array vacío', () => {
      expect(() => OficioValidation.validateRegistro({ noOficio: 'OF-001', asunto: 'x', remitente: 'x', unidadIds: [] }, null))
        .toThrow('Debe seleccionar al menos una unidad')
    })

    it('debe rechazar si hay co-responsables sin responsables (modo != 1)', () => {
      const body = {
        noOficio: 'OF-001',
        asunto: 'Test',
        remitente: 'Juan',
        unidadIds: ['u1'],
        cooresponsableIds: ['u2'],
        responsableIds: []
      }
      expect(() => OficioValidation.validateRegistro(body, null))
        .toThrow('Debe seleccionar al menos una unidad responsable')
    })

    it('debe aceptar co-responsables sin responsables si modo=1', () => {
      const body = {
        noOficio: 'OF-001',
        asunto: 'Test',
        remitente: 'Juan',
        unidadIds: ['u1'],
        cooresponsableIds: ['u2'],
        responsableIds: [],
        modo: '1'
      }
      expect(() => OficioValidation.validateRegistro(body, null)).not.toThrow()
    })

    it('debe rechazar archivo que no sea PDF', () => {
      const body = { noOficio: 'OF-001', asunto: 'x', remitente: 'x', unidadIds: ['u1'] }
      const file = { mimetype: 'image/png' }
      expect(() => OficioValidation.validateRegistro(body, file))
        .toThrow('Solo se permiten archivos PDF')
    })

    it('debe aceptar archivo PDF', () => {
      const body = { noOficio: 'OF-001', asunto: 'x', remitente: 'x', unidadIds: ['u1'] }
      const file = { mimetype: 'application/pdf' }
      expect(() => OficioValidation.validateRegistro(body, file)).not.toThrow()
    })
  })

  describe('validateEdicion', () => {
    it('debe pasar con datos válidos', () => {
      const body = {
        noOficio: 'OF-2024-001',
        asunto: 'Solicitud',
        remitente: 'Juan Pérez',
        unidadIds: ['unidad-1']
      }
      expect(() => OficioValidation.validateEdicion(body, null)).not.toThrow()
    })

    it('debe rechazar estatus inválido', () => {
      const body = {
        noOficio: 'OF-001',
        asunto: 'x',
        remitente: 'x',
        unidadIds: ['u1'],
        estatus: 'Invalido'
      }
      expect(() => OficioValidation.validateEdicion(body, null))
        .toThrow('Estatus inválido')
    })

    it('debe aceptar estatus Pendiente o Atendido', () => {
      const base = { noOficio: 'OF-001', asunto: 'x', remitente: 'x', unidadIds: ['u1'] }
      expect(() => OficioValidation.validateEdicion({ ...base, estatus: 'Pendiente' }, null)).not.toThrow()
      expect(() => OficioValidation.validateEdicion({ ...base, estatus: 'Atendido' }, null)).not.toThrow()
    })
  })

  describe('validateRespuestaArchivos', () => {
    it('debe pasar con archivos válidos', () => {
      const archivos = [
        { mimetype: 'application/pdf', originalname: 'doc.pdf' },
        { mimetype: 'image/jpeg', originalname: 'foto.jpg' },
        { mimetype: 'image/png', originalname: 'img.png' },
        { mimetype: 'image/webp', originalname: 'img.webp' }
      ]
      expect(() => OficioValidation.validateRespuestaArchivos(archivos)).not.toThrow()
    })

    it('debe rechazar tipo no permitido', () => {
      const archivos = [
        { mimetype: 'application/zip', originalname: 'archivo.zip' }
      ]
      expect(() => OficioValidation.validateRespuestaArchivos(archivos))
        .toThrow('Tipo de archivo no permitido: archivo.zip')
    })

    it('debe pasar con array vacío', () => {
      expect(() => OficioValidation.validateRespuestaArchivos([])).not.toThrow()
    })
  })
})
