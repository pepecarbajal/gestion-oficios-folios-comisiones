import { describe, it, expect } from 'vitest'
import { FolioValidation } from '../../../validations/folio.validation.js'

describe('FolioValidation', () => {
  describe('validateSolicitud', () => {
    it('debe pasar con datos válidos', () => {
      const body = {
        destinatario: 'María López',
        dependencia: 'Secretaría de Salud',
        cargo: 'Directora',
        asunto: 'Solicitud de folio'
      }
      expect(() => FolioValidation.validateSolicitud(body)).not.toThrow()
    })

    it('debe rechazar si falta destinatario', () => {
      expect(() => FolioValidation.validateSolicitud({ dependencia: 'x', cargo: 'x', asunto: 'x' }))
        .toThrow('El destinatario es obligatorio')
    })

    it('debe rechazar si falta dependencia', () => {
      expect(() => FolioValidation.validateSolicitud({ destinatario: 'x', cargo: 'x', asunto: 'x' }))
        .toThrow('La dependencia es obligatoria')
    })

    it('debe rechazar si falta cargo', () => {
      expect(() => FolioValidation.validateSolicitud({ destinatario: 'x', dependencia: 'x', asunto: 'x' }))
        .toThrow('El cargo es obligatorio')
    })

    it('debe rechazar si falta asunto', () => {
      expect(() => FolioValidation.validateSolicitud({ destinatario: 'x', dependencia: 'x', cargo: 'x' }))
        .toThrow('El asunto es obligatorio')
    })
  })

  describe('validateRegistroAOF', () => {
    it('debe pasar con datos válidos', () => {
      const body = {
        noFolio: '0123',
        destinatario: 'María López',
        dependencia: 'Secretaría de Salud',
        cargo: 'Directora',
        asunto: 'Folio de prueba',
        unidadIds: ['unidad-1']
      }
      expect(() => FolioValidation.validateRegistroAOF(body)).not.toThrow()
    })

    it('debe rechazar si falta noFolio', () => {
      expect(() => FolioValidation.validateRegistroAOF({ destinatario: 'x', dependencia: 'x', cargo: 'x', asunto: 'x', unidadIds: ['u1'] }))
        .toThrow('El número de folio es obligatorio')
    })

    it('debe rechazar noFolio que no sea 4 dígitos', () => {
      expect(() => FolioValidation.validateRegistroAOF({ noFolio: '123', destinatario: 'x', dependencia: 'x', cargo: 'x', asunto: 'x', unidadIds: ['u1'] }))
        .toThrow('El folio debe tener exactamente 4 dígitos')
    })

    it('debe rechazar noFolio con letras', () => {
      expect(() => FolioValidation.validateRegistroAOF({ noFolio: 'abcd', destinatario: 'x', dependencia: 'x', cargo: 'x', asunto: 'x', unidadIds: ['u1'] }))
        .toThrow('El folio debe tener exactamente 4 dígitos')
    })

    it('debe rechazar si falta destinatario', () => {
      expect(() => FolioValidation.validateRegistroAOF({ noFolio: '0123', dependencia: 'x', cargo: 'x', asunto: 'x', unidadIds: ['u1'] }))
        .toThrow('El destinatario es obligatorio')
    })

    it('debe rechazar si no hay unidades', () => {
      expect(() => FolioValidation.validateRegistroAOF({ noFolio: '0123', destinatario: 'x', dependencia: 'x', cargo: 'x', asunto: 'x' }))
        .toThrow('Debe seleccionar al menos una unidad')
    })
  })

  describe('validateEntrega', () => {
    it('debe pasar con fecha y archivo PDF válidos', () => {
      const body = { fechaEntrega: '2024-03-15' }
      const file = { mimetype: 'application/pdf' }
      expect(() => FolioValidation.validateEntrega(body, file)).not.toThrow()
    })

    it('debe rechazar si falta fecha', () => {
      expect(() => FolioValidation.validateEntrega({}, null))
        .toThrow('La fecha de entrega es obligatoria')
    })

    it('debe rechazar si falta archivo', () => {
      expect(() => FolioValidation.validateEntrega({ fechaEntrega: '2024-03-15' }, null))
        .toThrow('El archivo PDF es obligatorio')
    })

    it('debe rechazar archivo que no sea PDF', () => {
      const file = { mimetype: 'image/png' }
      expect(() => FolioValidation.validateEntrega({ fechaEntrega: '2024-03-15' }, file))
        .toThrow('Solo se permiten archivos PDF')
    })

    it('debe aceptar archivo PDF', () => {
      const file = { mimetype: 'application/pdf' }
      expect(() => FolioValidation.validateEntrega({ fechaEntrega: '2024-03-15' }, file)).not.toThrow()
    })
  })
})
