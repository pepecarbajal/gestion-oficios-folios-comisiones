import { OficioRepository } from '../repositories/oficio.repository.js'
import { UADRepository } from '../repositories/uad.repository.js'
import { AuditRepository } from '../repositories/audit.repository.js'
import { OficioValidation } from '../validations/oficio.validation.js'

const getIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || null

export const registrarOficio = async (req, res) => {
  try {
    OficioValidation.validateRegistro(req.body, req.file)

    const {
      noOficio, fechaOficio, fechaRecibo, fechaLimite,
      asunto, remitente, cargo, dependencia,
      unidadId
    } = req.body

    let unidadAlias = ''
    if (unidadId && unidadId !== 'TODAS') {
      const unidades = await UADRepository.getAll()
      const unidad = unidades.find(u => u.id === unidadId)
      unidadAlias = unidad?.alias || ''
      if (!unidad) {
        return res.status(400).json({ error: 'La unidad administrativa seleccionada no existe.' })
      }
    } else if (unidadId === 'TODAS') {
      unidadAlias = 'TODAS'
    }

    let archivoBuffer = null
    let archivoMime = null

    if (req.file) {
      archivoBuffer = req.file.buffer
      archivoMime = req.file.mimetype
    }

    const id = await OficioRepository.create({
      noOficio, fechaOficio, fechaRecibo, fechaLimite,
      asunto, remitente, cargo, dependencia,
      unidadId, unidadAlias,
      archivoBuffer, archivoMime
    })

    await AuditRepository.registrar({
      accion: 'OFICIO_REGISTRADO',
      usuarioId: req.user?.id,
      usuarioEmail: null,
      rol: req.user?.role,
      detalle: { oficioId: id, noOficio, unidadId, unidadAlias, asunto },
      ip: getIp(req)
    })

    res.status(201).json({ id })
  } catch (error) {
    const esErrorControlado = [
      'El número de oficio es obligatorio',
      'El asunto es obligatorio',
      'El remitente es obligatorio',
      'La unidad a turnar es obligatoria',
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