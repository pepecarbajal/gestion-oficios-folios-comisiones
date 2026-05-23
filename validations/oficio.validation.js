function parseArrayField (raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) return [raw]
  return []
}

export class OficioValidation {
  static validateRegistro (body, file) {
    const { noOficio, asunto, remitente, unidadIds } = body

    if (!noOficio) throw new Error('El número de oficio es obligatorio')
    if (!asunto) throw new Error('El asunto es obligatorio')
    if (!remitente) throw new Error('El remitente es obligatorio')
    if (!unidadIds || (Array.isArray(unidadIds) ? unidadIds.length === 0 : !unidadIds)) {
      throw new Error('Debe seleccionar al menos una unidad a turnar')
    }

    const modo = body.modo !== undefined ? Number(body.modo) : 0
    const cooresponsableIds = parseArrayField(body.cooresponsableIds)
    const responsableIds = parseArrayField(body.responsableIds)

    if (modo !== 1 && cooresponsableIds.length > 0 && responsableIds.length === 0) {
      throw new Error('Debe seleccionar al menos una unidad responsable')
    }

    if (file && file.mimetype !== 'application/pdf') {
      throw new Error('Solo se permiten archivos PDF.')
    }
  }

  static validateEdicion (body, file) {
    const { noOficio, asunto, remitente, unidadIds, estatus } = body

    if (!noOficio) throw new Error('El número de oficio es obligatorio')
    if (!asunto) throw new Error('El asunto es obligatorio')
    if (!remitente) throw new Error('El remitente es obligatorio')
    if (!unidadIds || (Array.isArray(unidadIds) ? unidadIds.length === 0 : !unidadIds)) {
      throw new Error('Debe seleccionar al menos una unidad a turnar')
    }

    const modo = body.modo !== undefined ? Number(body.modo) : 0
    const cooresponsableIds = parseArrayField(body.cooresponsableIds)
    const responsableIds = parseArrayField(body.responsableIds)

    if (modo !== 1 && cooresponsableIds.length > 0 && responsableIds.length === 0) {
      throw new Error('Debe seleccionar al menos una unidad responsable')
    }

    if (estatus && !['Pendiente', 'Atendido'].includes(estatus)) {
      throw new Error('Estatus inválido')
    }

    if (file && file.mimetype !== 'application/pdf') {
      throw new Error('Solo se permiten archivos PDF.')
    }
  }

  static validateRespuestaArchivos (archivos) {
    const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    for (const file of archivos) {
      if (!tiposPermitidos.includes(file.mimetype)) {
        throw new Error(`Tipo de archivo no permitido: ${file.originalname}`)
      }
    }
  }
}