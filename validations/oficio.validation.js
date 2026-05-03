export class OficioValidation {
  static validateRegistro (body, file) {
    const { noOficio, asunto, remitente, unidadId } = body

    if (!noOficio) throw new Error('El número de oficio es obligatorio')
    if (!asunto) throw new Error('El asunto es obligatorio')
    if (!remitente) throw new Error('El remitente es obligatorio')
    if (!unidadId) throw new Error('La unidad a turnar es obligatoria')

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
