import { FolioRepository } from '../../repositories/folio.repository.js'
import { UADRepository } from '../../repositories/uad.repository.js'
import { AuditRepository } from '../../repositories/audit.repository.js'
import { FolioValidation } from '../../validations/folio.validation.js'
import { ValidationError } from '../../utils/errors.js'

function parseUnidadIds(raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) return [raw]
  return []
}

function buildUnidadAlias(unidadIds, unidades) {
  return unidadIds
    .map(id => {
      const u = unidades.find(u => u.id === id)
      return u ? u.alias : id
    })
    .join(', ')
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

  let archivoBuffer = null
  let archivoMime = null
  if (archivo) {
    archivoBuffer = archivo.buffer
    archivoMime = archivo.mimetype
  }

  await FolioRepository.registrarEntrega(id, {
    fechaEntrega: datos.fechaEntrega,
    comentario: datos.comentario || '',
    archivoBuffer,
    archivoMime
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
