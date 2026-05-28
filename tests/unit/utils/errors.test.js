import { describe, it, expect } from 'vitest'
import { AppError, NotFoundError, ValidationError, AuthError, ForbiddenError } from '../../../utils/errors.js'

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    it('debe crear error con mensaje y status por defecto 400', () => {
      const err = new AppError('Algo salió mal')
      expect(err).toBeInstanceOf(Error)
      expect(err.message).toBe('Algo salió mal')
      expect(err.status).toBe(400)
    })

    it('debe crear error con status personalizado', () => {
      const err = new AppError('No autorizado', 401)
      expect(err.status).toBe(401)
    })
  })

  describe('NotFoundError', () => {
    it('debe tener status 404', () => {
      const err = new NotFoundError()
      expect(err.status).toBe(404)
      expect(err.message).toBe('Recurso no encontrado')
    })

    it('debe aceptar mensaje personalizado', () => {
      const err = new NotFoundError('Oficio no encontrado')
      expect(err.message).toBe('Oficio no encontrado')
    })
  })

  describe('ValidationError', () => {
    it('debe tener status 400', () => {
      const err = new ValidationError('Datos inválidos')
      expect(err.status).toBe(400)
      expect(err.message).toBe('Datos inválidos')
    })
  })

  describe('AuthError', () => {
    it('debe tener status 401', () => {
      const err = new AuthError()
      expect(err.status).toBe(401)
      expect(err.message).toBe('No autorizado')
    })
  })

  describe('ForbiddenError', () => {
    it('debe tener status 403', () => {
      const err = new ForbiddenError()
      expect(err.status).toBe(403)
      expect(err.message).toBe('Acción no permitida')
    })
  })
})
