import jwt from 'jsonwebtoken'
import { SECRET_JWT_KEY } from '../config.js'
import { UADRepository } from '../repositories/uad.repository.js'

export const registeruad = async (req, res) => {
  const { uadname, alias } = req.body
  try {
    const uadId = await UADRepository.create({ uadname, alias })
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
  const { uadname, alias } = req.body
  try {
    await UADRepository.update(id, { uadname, alias })
    res.json({ message: 'Unidad actualizada correctamente' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
