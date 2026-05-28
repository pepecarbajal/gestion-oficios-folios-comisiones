import { getIp } from '../utils/ip.js'
import {
  solicitarFolioUAD, registrarFolioAOF, registrarEntregaFolio,
  cancelarFolioService, getNextFolioNumber
} from '../services/folio/folio.service.js'

export const solicitarFolio = async (req, res, next) => {
  try {
    const result = await solicitarFolioUAD(req.body, req.uad, {
      usuarioId: req.user?.id,
      rol: req.user?.role,
      ip: getIp(req)
    })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const registrarFolio = async (req, res, next) => {
  try {
    const result = await registrarFolioAOF(req.body, {
      usuarioId: req.user?.id,
      rol: req.user?.role,
      ip: getIp(req)
    })
    res.status(201).json(result)
  } catch (error) {
    next(error)
  }
}

export const getNextFolio = async (req, res, next) => {
  try {
    const noFolio = await getNextFolioNumber()
    res.json({ noFolio })
  } catch (error) {
    next(error)
  }
}

export const registrarEntrega = async (req, res, next) => {
  try {
    await registrarEntregaFolio(req.params.id, req.body, req.file, {
      usuarioId: req.user?.id,
      rol: req.user?.role,
      ip: getIp(req)
    })
    res.json({ message: 'Entrega registrada correctamente' })
  } catch (error) {
    next(error)
  }
}

export const cancelarFolio = async (req, res, next) => {
  try {
    await cancelarFolioService(req.params.id, {
      usuarioId: req.user?.id,
      rol: req.user?.role,
      ip: getIp(req)
    })
    res.json({ message: 'Folio cancelado correctamente' })
  } catch (error) {
    next(error)
  }
}
