import { UADRepository } from '../repositories/uad.repository.js'
import { Validation } from '../validations/uad.validation.js'

export const registeruad = async (req, res) => {
  const { uadname, alias, titularId } = req.body
  try {
    Validation.uadname(uadname)
    Validation.alias(alias)
    const uadId = await UADRepository.create({ uadname, alias, titularId: titularId || null })
    res.status(201).json({ uadId })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const getUads = async (req, res) => {
  try {
    const unidades = await UADRepository.getAll()
    res.json(unidades)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateUad = async (req, res) => {
  const { id } = req.params
  const { uadname, alias, titularId } = req.body
  try {
    Validation.uadname(uadname)
    Validation.alias(alias)
    await UADRepository.update(id, { uadname, alias, titularId: titularId || null })
    res.json({ message: 'Unidad actualizada correctamente' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
