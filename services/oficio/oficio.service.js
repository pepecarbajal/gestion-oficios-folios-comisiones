import { OficioRepository } from '../../repositories/oficio.repository.js'
import { UADRepository } from '../../repositories/uad.repository.js'
import { AuditRepository } from '../../repositories/audit.repository.js'
import { OficioValidation } from '../../validations/oficio.validation.js'
import { StorageService } from '../storage.service.js'
import { parseUnidadIds, buildUnidadAlias } from '../../utils/helpers.js'
import { ValidationError } from '../../utils/errors.js'

export const registrarOficio = async (datos, archivo, auditInfo) => {
  OficioValidation.validateRegistro(datos, archivo)

  const unidadIds = parseUnidadIds(datos.unidadIds)
  if (unidadIds.length === 0) {
    throw new ValidationError('Debe seleccionar al menos una unidad a turnar.')
  }

  const unidades = await UADRepository.getAll()
  const unidadAlias = buildUnidadAlias(unidadIds, unidades)

  const idsInvalidos = unidadIds.filter(id => !unidades.find(u => u.id === id))
  if (idsInvalidos.length > 0) {
    throw new ValidationError(`Las siguientes unidades no existen: ${idsInvalidos.join(', ')}`)
  }

  const responsableIds = parseUnidadIds(datos.responsableIds)
  const cooresponsableIds = parseUnidadIds(datos.cooresponsableIds)

  let archivoPath = null
  if (archivo && archivo.mimetype === 'application/pdf') {
    archivoPath = StorageService.oficioFilePath(datos.noOficio)
    await StorageService.uploadFile(archivoPath, archivo.buffer, archivo.mimetype)
  }

  const id = await OficioRepository.create({
    noOficio: datos.noOficio,
    fechaOficio: datos.fechaOficio,
    fechaRecibo: datos.fechaRecibo,
    fechaLimite: datos.fechaLimite,
    asunto: datos.asunto,
    remitente: datos.remitente,
    cargo: datos.cargo,
    dependencia: datos.dependencia,
    unidadIds,
    unidadAlias,
    archivoPath,
    tipoArchivo: datos.tipoArchivo === '1' ? 1 : 0,
    modo: datos.modo === '1' ? 1 : 0,
    responsableIds: datos.modo === '1' ? unidadIds : responsableIds,
    cooresponsableIds: datos.modo === '1' ? [] : cooresponsableIds
  })

  await AuditRepository.registrar({
    accion: 'OFICIO_REGISTRADO',
    usuarioId: auditInfo.usuarioId,
    usuarioEmail: null,
    rol: auditInfo.rol,
    detalle: { oficioId: id, noOficio: datos.noOficio, unidadIds, unidadAlias, asunto: datos.asunto, tipoArchivo: datos.tipoArchivo, modo: datos.modo, responsableIds, cooresponsableIds },
    ip: auditInfo.ip
  })

  return id
}

export const editarOficio = async (id, datos, archivo, auditInfo) => {
  OficioValidation.validateEdicion(datos, archivo)

  const unidadIds = parseUnidadIds(datos.unidadIds)
  if (unidadIds.length === 0) {
    throw new ValidationError('Debe seleccionar al menos una unidad a turnar.')
  }

  const unidades = await UADRepository.getAll()
  const unidadAlias = buildUnidadAlias(unidadIds, unidades)

  const idsInvalidos = unidadIds.filter(id => !unidades.find(u => u.id === id))
  if (idsInvalidos.length > 0) {
    throw new ValidationError(`Las siguientes unidades no existen: ${idsInvalidos.join(', ')}`)
  }

  const responsableIds = parseUnidadIds(datos.responsableIds)
  const cooresponsableIds = parseUnidadIds(datos.cooresponsableIds)
  const modoFinal = datos.modo !== undefined ? (datos.modo === '1' ? 1 : 0) : undefined

  const actual = await OficioRepository.getById(id)
  let archivoPath = actual.archivoPath

  if (archivo && archivo.mimetype === 'application/pdf') {
    if (actual.archivoPath) {
      await StorageService.deleteFile(actual.archivoPath)
    }
    archivoPath = StorageService.oficioFilePath(datos.noOficio)
    await StorageService.uploadFile(archivoPath, archivo.buffer, archivo.mimetype)
  } else if (!archivo && datos.noOficio !== actual.noOficio && actual.archivoPath) {
    const newPath = StorageService.oficioFilePath(datos.noOficio)
    archivoPath = await StorageService.renameFile(actual.archivoPath, newPath)
  }

  await OficioRepository.update(id, {
    noOficio: datos.noOficio,
    fechaOficio: datos.fechaOficio,
    fechaRecibo: datos.fechaRecibo,
    fechaLimite: datos.fechaLimite,
    asunto: datos.asunto,
    remitente: datos.remitente,
    cargo: datos.cargo,
    dependencia: datos.dependencia,
    unidadIds,
    unidadAlias,
    estatus: datos.estatus,
    archivoPath,
    tipoArchivo: datos.tipoArchivo !== undefined ? (datos.tipoArchivo === '1' ? 1 : 0) : undefined,
    modo: modoFinal,
    responsableIds: modoFinal === 1 ? unidadIds : responsableIds,
    cooresponsableIds: modoFinal === 1 ? [] : cooresponsableIds
  })

  await AuditRepository.registrar({
    accion: 'OFICIO_EDITADO',
    usuarioId: auditInfo.usuarioId,
    usuarioEmail: null,
    rol: auditInfo.rol,
    detalle: { oficioId: id, noOficio: datos.noOficio, unidadIds, unidadAlias, asunto: datos.asunto, estatus: datos.estatus, tipoArchivo: datos.tipoArchivo, modo: datos.modo, responsableIds, cooresponsableIds },
    ip: auditInfo.ip
  })

  return id
}
