import { OficioRepository } from '../../repositories/oficio.repository.js'
import { AuditRepository } from '../../repositories/audit.repository.js'
import { OficioValidation } from '../../validations/oficio.validation.js'
import { StorageService } from '../storage.service.js'
import { ValidationError } from '../../utils/errors.js'

export const guardarRespuestaUAD = async (id, unidadCtx, comentario, archivos, auditInfo) => {
  const archivosValidos = archivos || []
  OficioValidation.validateRespuestaArchivos(archivosValidos)

  const oficio = await OficioRepository.getById(id)

  const cooresp = oficio.cooresponsableIds || []
  if (cooresp.includes(unidadCtx.unidadId)) {
    throw new ValidationError('Esta unidad es co-responsable y no puede responder el oficio')
  }

  if (oficio.modo === 1) {
    const vistoPor = oficio.vistoPor || []
    if (!vistoPor.includes(unidadCtx.unidadId)) {
      throw new ValidationError('Debe visualizar el oficio antes de marcar como enterado')
    }
  }

  const archivosGuardados = []
  for (let i = 0; i < archivosValidos.length; i++) {
    const { buffer, mimetype, originalname } = archivosValidos[i]
    const ext = originalname.split('.').pop().toLowerCase()
    const timestamp = Date.now()
    const filePath = StorageService.evidenciaFilePath(
      oficio.noOficio, unidadCtx.unidadAlias, timestamp, i + 1, ext
    )
    const nombreArchivo = filePath.split('/').pop()
    await StorageService.uploadFile(filePath, buffer, mimetype)
    archivosGuardados.push({ filePath, nombre: nombreArchivo, tipo: mimetype })
  }

  const respuestas = oficio.respuestas || []
  const idx = respuestas.findIndex(r => r.unidadId === unidadCtx.unidadId)

  const nuevaRespuesta = {
    unidadId: unidadCtx.unidadId,
    unidadAlias: unidadCtx.unidadAlias,
    comentario: comentario?.trim() || '',
    fechaAtendido: new Date().toISOString(),
    archivos: archivosGuardados
  }

  if (idx >= 0) {
    if (archivosGuardados.length > 0) {
      nuevaRespuesta.archivos = [
        ...(respuestas[idx].archivos || []),
        ...archivosGuardados
      ]
    } else {
      nuevaRespuesta.archivos = respuestas[idx].archivos || []
    }
    respuestas[idx] = nuevaRespuesta
  } else {
    respuestas.push(nuevaRespuesta)
  }

  let nuevoEstatus = oficio.estatus
  const coorespIds = oficio.cooresponsableIds || []
  const idsTurnados = coorespIds.length > 0
    ? (oficio.responsableIds || oficio.unidadIds || (oficio.unidadId ? [oficio.unidadId] : []))
    : (oficio.unidadIds || (oficio.unidadId ? [oficio.unidadId] : []))
  const uadsQueRespondieron = new Set(respuestas.map(r => r.unidadId))
  const todasRespondieron = idsTurnados.every(id => uadsQueRespondieron.has(id))

  if (idsTurnados.length > 0 && todasRespondieron) {
    nuevoEstatus = 'Atendido'
  }

  await OficioRepository.guardarRespuesta(id, { respuestas, estatus: nuevoEstatus })

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

  const oficio = await OficioRepository.getById(id)

  const archivosGuardados = []
  for (let i = 0; i < archivosValidos.length; i++) {
    const { buffer, mimetype, originalname } = archivosValidos[i]
    const ext = originalname.split('.').pop().toLowerCase()
    const timestamp = Date.now()
    const filePath = StorageService.aclaracionFilePath(
      oficio.noOficio, unidadCtx.unidadAlias, timestamp, i + 1, ext
    )
    const nombreArchivo = filePath.split('/').pop()
    await StorageService.uploadFile(filePath, buffer, mimetype)
    archivosGuardados.push({ filePath, nombre: nombreArchivo, tipo: mimetype })
  }

  const respuestas = oficio.respuestas || []
  respuestas.push({
    unidadId: unidadCtx.unidadId,
    unidadAlias: unidadCtx.unidadAlias,
    comentario: comentario?.trim() || '',
    fechaAtendido: new Date().toISOString(),
    archivos: archivosGuardados,
    esAclaracion: true
  })

  await OficioRepository.agregarAclaracion(id, { respuestas })

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
