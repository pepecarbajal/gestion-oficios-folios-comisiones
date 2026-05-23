import { getIp } from '../utils/ip.js'
import { registrarOficio as createOficio, editarOficio as updateOficio, actualizarEstatusOficio as changeEstatusOficio, guardarRespuestaUAD as saveRespuestaUAD } from '../services/oficio.service.js'

export const registrarOficio = async (req, res, next) => {
  try {
    const id = await createOficio(req.body, req.file, {
      usuarioId: req.user?.id,
      rol: req.user?.role,
      ip: getIp(req)
    })
    res.status(201).json({ id })
  } catch (error) {
    next(error)
  }
}

export const editarOficio = async (req, res, next) => {
  try {
    await updateOficio(req.params.id, req.body, req.file, {
      usuarioId: req.user?.id,
      rol: req.user?.role,
      ip: getIp(req)
    })
    res.json({ message: 'Oficio actualizado correctamente' })
  } catch (error) {
    next(error)
  }
}

export const actualizarEstatusOficio = async (req, res, next) => {
  try {
    await changeEstatusOficio(req.params.id, req.body.estatus, {
      usuarioId: req.user?.id,
      rol: req.user?.role,
      ip: getIp(req)
    })
    res.json({ message: 'Estatus actualizado' })
  } catch (error) {
    next(error)
  }
}

export const guardarRespuestaUAD = async (req, res, next) => {
  try {
    await saveRespuestaUAD(req.params.id, req.uad, req.body.comentario, req.files, {
      usuarioId: req.user?.id,
      rol: req.user?.role,
      ip: getIp(req)
    })
    res.json({ message: 'Respuesta guardada correctamente' })
  } catch (error) {
    next(error)
  }
}
