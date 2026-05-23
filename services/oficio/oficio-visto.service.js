import { OficioRepository } from '../../repositories/oficio.repository.js'
import { AuditRepository } from '../../repositories/audit.repository.js'

export const marcarVisto = async (id, unidadCtx, auditInfo) => {
  await OficioRepository.marcarVisto(id, unidadCtx.unidadId)

  await AuditRepository.registrar({
    accion: 'OFICIO_VISTO',
    usuarioId: auditInfo.usuarioId,
    usuarioEmail: null,
    rol: auditInfo.rol,
    detalle: {
      oficioId: id,
      unidadId: unidadCtx.unidadId,
      unidadAlias: unidadCtx.unidadAlias
    },
    ip: auditInfo.ip
  })

  return id
}
