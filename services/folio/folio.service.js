import { FolioRepository } from '../../repositories/folio.repository.js'
import { UADRepository } from '../../repositories/uad.repository.js'
import { AuditRepository } from '../../repositories/audit.repository.js'
import { FolioValidation } from '../../validations/folio.validation.js'
import { StorageService } from '../storage.service.js'
import { parseUnidadIds, buildUnidadAlias } from '../../utils/helpers.js'
import { ValidationError } from '../../utils/errors.js'

export const getNextFolioNumber = async () => {
  return FolioRepository.getNextNoFolio()
}

export const solicitarFolioUAD = async (datos, uad, auditInfo) => {
  FolioValidation.validateSolicitud(datos)

  const unidadIds = [uad.unidadId]
  const unidadAlias = uad.unidadAlias

  const noFolio = await FolioRepository.getNextNoFolio()

  const id = await FolioRepository.create({
    noFolio,
    destinatario: datos.destinatario,
    dependencia: datos.dependencia,
    cargo: datos.cargo,
    asunto: datos.asunto,
    unidadIds,
    unidadAlias,
    creadoPor: 'UAD',
    creadoPorId: auditInfo.usuarioId
  })

  await AuditRepository.registrar({
    accion: 'FOLIO_SOLICITADO',
    usuarioId: auditInfo.usuarioId,
    usuarioEmail: null,
    rol: auditInfo.rol,
    detalle: { folioId: id, noFolio, destinatario: datos.destinatario, unidadIds, asunto: datos.asunto },
    ip: auditInfo.ip
  })

  return { id, noFolio }
}

export const registrarFolioAOF = async (datos, auditInfo) => {
  FolioValidation.validateRegistroAOF(datos)

  const unidadIds = parseUnidadIds(datos.unidadIds)
  if (unidadIds.length === 0) {
    throw new ValidationError('Debe seleccionar al menos una unidad')
  }

  const unidades = await UADRepository.getAll()
  const unidadAlias = buildUnidadAlias(unidadIds, unidades)

  const idsInvalidos = unidadIds.filter(id => !unidades.find(u => u.id === id))
  if (idsInvalidos.length > 0) {
    throw new ValidationError(`Las siguientes unidades no existen: ${idsInvalidos.join(', ')}`)
  }

  const noFolio = datos.noFolio.trim()

  const id = await FolioRepository.create({
    noFolio,
    destinatario: datos.destinatario,
    dependencia: datos.dependencia,
    cargo: datos.cargo,
    asunto: datos.asunto,
    unidadIds,
    unidadAlias,
    creadoPor: 'AOF',
    creadoPorId: auditInfo.usuarioId
  })

  await AuditRepository.registrar({
    accion: 'FOLIO_REGISTRADO',
    usuarioId: auditInfo.usuarioId,
    usuarioEmail: null,
    rol: auditInfo.rol,
    detalle: { folioId: id, noFolio, destinatario: datos.destinatario, unidadIds, asunto: datos.asunto },
    ip: auditInfo.ip
  })

  return { id, noFolio }
}

export const registrarEntregaFolio = async (id, datos, archivo, auditInfo) => {
  FolioValidation.validateEntrega(datos, archivo)

  const folio = await FolioRepository.getById(id)

  if (folio.estatus === 'Atendido') {
    throw new ValidationError('Este folio ya fue atendido')
  }
  if (folio.estatus === 'Cancelado') {
    throw new ValidationError('Este folio fue cancelado')
  }

  let archivoPath = null
  if (archivo && archivo.mimetype === 'application/pdf') {
    archivoPath = StorageService.folioFilePath(folio.noFolio)
    await StorageService.uploadFile(archivoPath, archivo.buffer, archivo.mimetype)
  }

  await FolioRepository.registrarEntrega(id, {
    estatus: 'Atendido',
    fechaEntrega: datos.fechaEntrega,
    comentario: datos.comentario || '',
    archivoPath
  })

  await AuditRepository.registrar({
    accion: 'FOLIO_ENTREGADO',
    usuarioId: auditInfo.usuarioId,
    usuarioEmail: null,
    rol: auditInfo.rol,
    detalle: { folioId: id, fechaEntrega: datos.fechaEntrega },
    ip: auditInfo.ip
  })

  return id
}

export const cancelarFolioService = async (id, auditInfo) => {
  const folio = await FolioRepository.getById(id)

  if (folio.estatus !== 'Pendiente') {
    throw new ValidationError('Solo se pueden cancelar folios pendientes')
  }

  await FolioRepository.cancelar(id)

  await AuditRepository.registrar({
    accion: 'FOLIO_CANCELADO',
    usuarioId: auditInfo.usuarioId,
    usuarioEmail: null,
    rol: auditInfo.rol,
    detalle: { folioId: id },
    ip: auditInfo.ip
  })

  return id
}
