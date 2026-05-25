export class FolioValidation {
  static validateSolicitud(body) {
    const { destinatario, dependencia, cargo, asunto } = body
    if (!destinatario) throw new Error('El destinatario es obligatorio')
    if (!dependencia) throw new Error('La dependencia es obligatoria')
    if (!cargo) throw new Error('El cargo es obligatorio')
    if (!asunto) throw new Error('El asunto es obligatorio')
  }

  static validateRegistroAOF(body) {
    const { destinatario, dependencia, cargo, asunto, noFolio, unidadIds } = body
    if (!noFolio) throw new Error('El número de folio es obligatorio')
    if (!/^\d{4}$/.test(noFolio)) throw new Error('El folio debe tener exactamente 4 dígitos')
    if (!destinatario) throw new Error('El destinatario es obligatorio')
    if (!dependencia) throw new Error('La dependencia es obligatoria')
    if (!cargo) throw new Error('El cargo es obligatorio')
    if (!asunto) throw new Error('El asunto es obligatorio')
    if (!unidadIds || (Array.isArray(unidadIds) ? unidadIds.length === 0 : !unidadIds)) {
      throw new Error('Debe seleccionar al menos una unidad')
    }
  }

  static validateEntrega(body, file) {
    const { fechaEntrega } = body
    if (!fechaEntrega) throw new Error('La fecha de entrega es obligatoria')
    if (file && file.mimetype !== 'application/pdf') {
      throw new Error('Solo se permiten archivos PDF')
    }
  }
}
