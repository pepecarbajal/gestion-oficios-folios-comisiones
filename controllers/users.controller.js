import { UserRepository } from '../repositories/user.repository.js'
import { AuditRepository } from '../repositories/audit.repository.js'

const getIp = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket?.remoteAddress || null

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
  const { username, email, role, estatus, password } = req.body

  try {
    await UserRepository.update(id, { username, email, role, estatus, password })

    await AuditRepository.registrar({
      accion: 'USUARIO_EDITADO',
      usuarioId: req.user?.id,
      usuarioEmail: null,
      rol: req.user?.role,
      detalle: {
        usuarioEditadoId: id,
        nuevoRol: role,
        nuevoEstatus: estatus,
        cambioPassword: !!(password && password.trim() !== '')
      },
      ip: getIp(req)
    })

    res.json({ message: 'Usuario actualizado correctamente' })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}