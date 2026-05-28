import { OficioRepository } from '../../repositories/oficio.repository.js'
import { AuditRepository } from '../../repositories/audit.repository.js'
import { ValidationError } from '../../utils/errors.js'

export const actualizarEstatusOficio = async (id, estatus, auditInfo) => {
  if (!['Pendiente', 'Atendido'].includes(estatus)) {
    throw new ValidationError('Estatus inválido')
  }

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
