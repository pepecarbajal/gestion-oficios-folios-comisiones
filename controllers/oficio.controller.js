import { OficioRepository } from '../repositories/oficio.repository.js'
import { UADRepository } from '../repositories/uad.repository.js'
import { AuditRepository } from '../repositories/audit.repository.js'
import { OficioValidation } from '../validations/oficio.validation.js'

const getIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || null

function parseUnidadIds (raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) return [raw]
  return []
}

function buildUnidadAlias (unidadIds, unidades) {
  return unidadIds
    .map(id => {
      const u = unidades.find(u => u.id === id)
      return u ? u.alias : id
    })
    .join(', ')
}

export const registrarOficio = async (req, res) => {
  try {
    OficioValidation.validateRegistro(req.body, req.file)

    const {
      noOficio, fechaOficio, fechaRecibo, fechaLimite,
      asunto, remitente, cargo, dependencia,
      unidadIds: rawUnidadIds, tipoArchivo, modo,
      responsableIds: rawResponsableIds, cooresponsableIds: rawCooresponsableIds
    } = req.body

    const unidadIds = parseUnidadIds(rawUnidadIds)
    if (unidadIds.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos una unidad a turnar.' })
    }

    const unidades = await UADRepository.getAll()
    const unidadAlias = buildUnidadAlias(unidadIds, unidades)

    const idsInvalidos = unidadIds.filter(id => !unidades.find(u => u.id === id))
    if (idsInvalidos.length > 0) {
      return res.status(400).json({ error: `Las siguientes unidades no existen: ${idsInvalidos.join(', ')}` })
    }

    const responsableIds = parseUnidadIds(rawResponsableIds)
    const cooresponsableIds = parseUnidadIds(rawCooresponsableIds)

    let archivoBuffer = null
    let archivoMime = null

    if (req.file) {
      archivoBuffer = req.file.buffer
      archivoMime = req.file.mimetype
    }

    const id = await OficioRepository.create({
      noOficio, fechaOficio, fechaRecibo, fechaLimite,
      asunto, remitente, cargo, dependencia,
      unidadIds, unidadAlias,
      archivoBuffer, archivoMime,
      tipoArchivo: tipoArchivo === '1' ? 1 : 0,
      modo: modo === '1' ? 1 : 0,
      responsableIds: modo === '1' ? unidadIds : responsableIds,
      cooresponsableIds: modo === '1' ? [] : cooresponsableIds
    })

    await AuditRepository.registrar({
      accion: 'OFICIO_REGISTRADO',
      usuarioId: req.user?.id,
      usuarioEmail: null,
      rol: req.user?.role,
      detalle: { oficioId: id, noOficio, unidadIds, unidadAlias, asunto, tipoArchivo, modo, responsableIds, cooresponsableIds },
      ip: getIp(req)
    })

    res.status(201).json({ id })
  } catch (error) {
    const esErrorControlado = [
      'El número de oficio es obligatorio',
      'El asunto es obligatorio',
      'El remitente es obligatorio',
      'Debe seleccionar al menos una unidad a turnar',
      'ya está registrado'
    ].some(msg => error.message?.includes(msg))

    if (esErrorControlado) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('[registrarOficio]', error)
      res.status(500).json({ error: 'Error interno al registrar el oficio.' })
    }
  }
}

export const editarOficio = async (req, res) => {
  const { id } = req.params
  try {
    OficioValidation.validateEdicion(req.body, req.file)

    const {
      noOficio, fechaOficio, fechaRecibo, fechaLimite,
      asunto, remitente, cargo, dependencia,
      unidadIds: rawUnidadIds, estatus, tipoArchivo, modo,
      responsableIds: rawResponsableIds, cooresponsableIds: rawCooresponsableIds
    } = req.body

    const unidadIds = parseUnidadIds(rawUnidadIds)
    if (unidadIds.length === 0) {
      return res.status(400).json({ error: 'Debe seleccionar al menos una unidad a turnar.' })
    }

    const unidades = await UADRepository.getAll()
    const unidadAlias = buildUnidadAlias(unidadIds, unidades)

    const idsInvalidos = unidadIds.filter(id => !unidades.find(u => u.id === id))
    if (idsInvalidos.length > 0) {
      return res.status(400).json({ error: `Las siguientes unidades no existen: ${idsInvalidos.join(', ')}` })
    }

    const responsableIds = parseUnidadIds(rawResponsableIds)
    const cooresponsableIds = parseUnidadIds(rawCooresponsableIds)

    const modoFinal = modo !== undefined ? (modo === '1' ? 1 : 0) : undefined

    let archivoBuffer = null
    let archivoMime = null

    if (req.file) {
      archivoBuffer = req.file.buffer
      archivoMime = req.file.mimetype
    }

    await OficioRepository.update(id, {
      noOficio, fechaOficio, fechaRecibo, fechaLimite,
      asunto, remitente, cargo, dependencia,
      unidadIds, unidadAlias, estatus,
      archivoBuffer, archivoMime,
      tipoArchivo: tipoArchivo !== undefined ? (tipoArchivo === '1' ? 1 : 0) : undefined,
      modo: modoFinal,
      responsableIds: modoFinal === 1 ? unidadIds : responsableIds,
      cooresponsableIds: modoFinal === 1 ? [] : cooresponsableIds
    })

    await AuditRepository.registrar({
      accion: 'OFICIO_EDITADO',
      usuarioId: req.user?.id,
      usuarioEmail: null,
      rol: req.user?.role,
      detalle: { oficioId: id, noOficio, unidadIds, unidadAlias, asunto, estatus, tipoArchivo, modo, responsableIds, cooresponsableIds },
      ip: getIp(req)
    })

    res.json({ message: 'Oficio actualizado correctamente' })
  } catch (error) {
    const esErrorControlado = [
      'El número de oficio es obligatorio',
      'El asunto es obligatorio',
      'El remitente es obligatorio',
      'Debe seleccionar al menos una unidad a turnar',
      'ya está registrado',
      'Estatus inválido',
      'Oficio no encontrado'
    ].some(msg => error.message?.includes(msg))

    if (esErrorControlado) {
      res.status(400).json({ error: error.message })
    } else {
      console.error('[editarOficio]', error)
      res.status(500).json({ error: 'Error interno al editar el oficio.' })
    }
  }
}

export const actualizarEstatusOficio = async (req, res) => {
  const { id } = req.params
  const { estatus } = req.body
  try {
    await OficioRepository.updateEstatus(id, estatus)

    await AuditRepository.registrar({
      accion: 'OFICIO_ESTATUS_CAMBIADO',
      usuarioId: req.user?.id,
      usuarioEmail: null,
      rol: req.user?.role,
      detalle: { oficioId: id, nuevoEstatus: estatus },
      ip: getIp(req)
    })

    res.json({ message: 'Estatus actualizado' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const guardarRespuestaUAD = async (req, res) => {
  const { id } = req.params
  const { comentario } = req.body
  const { unidadId, unidadAlias } = req.uad

  try {
    const archivos = req.files || []
    OficioValidation.validateRespuestaArchivos(archivos)

    await OficioRepository.guardarRespuesta(id, {
      unidadId,
      unidadAlias,
      comentario,
      archivos
    })

    await AuditRepository.registrar({
      accion: 'RESPUESTA_UAD_GUARDADA',
      usuarioId: req.user?.id,
      usuarioEmail: null,
      rol: req.user?.role,
      detalle: {
        oficioId: id,
        unidadId,
        unidadAlias,
        totalArchivos: archivos.length,
        tieneComentario: !!(comentario?.trim())
      },
      ip: getIp(req)
    })

    res.json({ message: 'Respuesta guardada correctamente' })
  } catch (error) {
    console.error('[guardarRespuestaUAD]', error)
    res.status(400).json({ error: error.message })
  }
}