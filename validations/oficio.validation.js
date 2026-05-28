import { ValidationError } from '../utils/errors.js'

function parseArrayField (raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) return [raw]
  return []
}

export class OficioValidation {
  static validateRegistro (body, file) {
    const { noOficio, asunto, remitente, unidadIds } = body

    if (!noOficio) throw new ValidationError('El número de oficio es obligatorio')
    if (!asunto) throw new ValidationError('El asunto es obligatorio')
    if (!remitente) throw new ValidationError('El remitente es obligatorio')
    if (!unidadIds || (Array.isArray(unidadIds) ? unidadIds.length === 0 : !unidadIds)) {
      throw new ValidationError('Debe seleccionar al menos una unidad a turnar')
    }

    const modo = body.modo !== undefined ? Number(body.modo) : 0
    const cooresponsableIds = parseArrayField(body.cooresponsableIds)
    const responsableIds = parseArrayField(body.responsableIds)

    if (modo !== 1 && cooresponsableIds.length > 0 && responsableIds.length === 0) {
      throw new ValidationError('Debe seleccionar al menos una unidad responsable')
    }

    if (file && file.mimetype !== 'application/pdf') {
      throw new ValidationError('Solo se permiten archivos PDF.')
    }
  }

  static validateEdicion (body, file) {
    const { noOficio, asunto, remitente, unidadIds, estatus } = body

    if (!noOficio) throw new ValidationError('El número de oficio es obligatorio')
    if (!asunto) throw new ValidationError('El asunto es obligatorio')
    if (!remitente) throw new ValidationError('El remitente es obligatorio')
    if (!unidadIds || (Array.isArray(unidadIds) ? unidadIds.length === 0 : !unidadIds)) {
      throw new ValidationError('Debe seleccionar al menos una unidad a turnar')
    }

    const modo = body.modo !== undefined ? Number(body.modo) : 0
    const cooresponsableIds = parseArrayField(body.cooresponsableIds)
    const responsableIds = parseArrayField(body.responsableIds)

    if (modo !== 1 && cooresponsableIds.length > 0 && responsableIds.length === 0) {
      throw new ValidationError('Debe seleccionar al menos una unidad responsable')
    }

    if (estatus && !['Pendiente', 'Atendido'].includes(estatus)) {
      throw new ValidationError('Estatus inválido')
    }

    if (file && file.mimetype !== 'application/pdf') {
      throw new ValidationError('Solo se permiten archivos PDF.')
    }
  }

  static validateRespuestaArchivos (archivos) {
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    for (const file of archivos) {
      if (!tiposPermitidos.includes(file.mimetype)) {
        throw new ValidationError(`Tipo de archivo no permitido: ${file.originalname}`)
      }
    }
  }
}