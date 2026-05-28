import { ValidationError } from '../utils/errors.js'

export class FolioValidation {
  static validateSolicitud(body) {
    const { destinatario, dependencia, cargo, asunto } = body
    if (!destinatario) throw new ValidationError('El destinatario es obligatorio')
    if (!dependencia) throw new ValidationError('La dependencia es obligatoria')
    if (!cargo) throw new ValidationError('El cargo es obligatorio')
    if (!asunto) throw new ValidationError('El asunto es obligatorio')
  }

  static validateRegistroAOF(body) {
    const { destinatario, dependencia, cargo, asunto, noFolio, unidadIds } = body
    if (!noFolio) throw new ValidationError('El número de folio es obligatorio')
    if (!/^\d{4}$/.test(noFolio)) throw new ValidationError('El folio debe tener exactamente 4 dígitos')
    if (!destinatario) throw new ValidationError('El destinatario es obligatorio')
    if (!dependencia) throw new ValidationError('La dependencia es obligatoria')
    if (!cargo) throw new ValidationError('El cargo es obligatorio')
    if (!asunto) throw new ValidationError('El asunto es obligatorio')
    if (!unidadIds || (Array.isArray(unidadIds) ? unidadIds.length === 0 : !unidadIds)) {
      throw new ValidationError('Debe seleccionar al menos una unidad')
    }
  }

  static validateEntrega(body, file) {
    const { fechaEntrega } = body
    if (!fechaEntrega) throw new ValidationError('La fecha de entrega es obligatoria')
    if (!file) throw new ValidationError('El archivo PDF es obligatorio')
    if (file.mimetype !== 'application/pdf') {
      throw new ValidationError('Solo se permiten archivos PDF')
    }
  }
}
