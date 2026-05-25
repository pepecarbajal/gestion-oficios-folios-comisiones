import { OficioRepository } from '../../repositories/oficio.repository.js'
import { AuditRepository } from '../../repositories/audit.repository.js'

export const actualizarEstatusOficio = async (id, estatus, auditInfo) => {
  await OficioRepository.updateEstatus(id, estatus)

  await AuditRepository.registrar({
    accion: 'OFICIO_ESTATUS_CAMBIADO',
    usuarioId: auditInfo.usuarioId,
    usuarioEmail: null,
    rol: auditInfo.rol,
    detalle: { oficioId: id, nuevoEstatus: estatus },
    ip: auditInfo.ip
  })

  return id
}
