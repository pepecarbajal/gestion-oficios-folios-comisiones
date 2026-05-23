import { registerUad as createUad, getUads as listUads, updateUad as patchUad } from '../services/uad.service.js'

export const registeruad = async (req, res, next) => {
  try {
    const { uadname, alias, titularId } = req.body
    const uadId = await createUad({ uadname, alias, titularId })
    res.status(201).json({ uadId })
  } catch (error) {
    next(error)
  }
}

export const getUads = async (req, res, next) => {
  try {
    const unidades = await listUads()
    res.json(unidades)
  } catch (error) {
    next(error)
  }
}

export const updateUad = async (req, res, next) => {
  try {
    const { id } = req.params
    const { uadname, alias, titularId } = req.body
    await patchUad(id, { uadname, alias, titularId })
    res.json({ message: 'Unidad actualizada correctamente' })
  } catch (error) {
    next(error)
  }
}
