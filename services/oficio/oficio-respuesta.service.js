import { OficioRepository } from '../../repositories/oficio.repository.js'
import { AuditRepository } from '../../repositories/audit.repository.js'
import { OficioValidation } from '../../validations/oficio.validation.js'

export const guardarRespuestaUAD = async (id, unidadCtx, comentario, archivos, auditInfo) => {
  const archivosValidos = archivos || []
  OficioValidation.validateRespuestaArchivos(archivosValidos)

  await OficioRepository.guardarRespuesta(id, {
    unidadId: unidadCtx.unidadId,
    unidadAlias: unidadCtx.unidadAlias,
    comentario,
    archivos: archivosValidos
  })

  await AuditRepository.registrar({
    accion: 'RESPUESTA_UAD_GUARDADA',
    usuarioId: auditInfo.usuarioId,
    usuarioEmail: null,
    rol: auditInfo.rol,
    detalle: {
      oficioId: id,
      unidadId: unidadCtx.unidadId,
      unidadAlias: unidadCtx.unidadAlias,
      totalArchivos: archivosValidos.length,
      tieneComentario: !!(comentario?.trim())
    },
    ip: auditInfo.ip
  })

  return id
}

export const agregarAclaracionUAD = async (id, unidadCtx, comentario, archivos, auditInfo) => {
  const archivosValidos = archivos || []
  OficioValidation.validateRespuestaArchivos(archivosValidos)

  await OficioRepository.agregarAclaracion(id, {
    unidadId: unidadCtx.unidadId,
    unidadAlias: unidadCtx.unidadAlias,
    comentario,
    archivos: archivosValidos
  })

  await AuditRepository.registrar({
    accion: 'ACLARACION_UAD_AGREGADA',
    usuarioId: auditInfo.usuarioId,
    usuarioEmail: null,
    rol: auditInfo.rol,
    detalle: {
      oficioId: id,
      unidadId: unidadCtx.unidadId,
      unidadAlias: unidadCtx.unidadAlias,
      totalArchivos: archivosValidos.length,
      tieneComentario: !!(comentario?.trim())
    },
    ip: auditInfo.ip
  })

  return id
}
