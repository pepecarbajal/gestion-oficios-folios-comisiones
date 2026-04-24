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
