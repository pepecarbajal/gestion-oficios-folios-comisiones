import { UserRepository } from '../repositories/user.repository.js'

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await UserRepository.getAll()
    res.json(usuarios)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

export const updateUsuario = async (req, res) => {
  const { id } = req.params
  const { username, email, role, administrativeUnitId, estatus, password } = req.body

  try {
    await UserRepository.update(id, { username, email, role, administrativeUnitId, estatus, password })
    res.json({ message: 'Usuario actualizado correctamente' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}