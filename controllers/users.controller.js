import { UserRepository } from '../repositories/user.repository.js'
import { AuditRepository } from '../repositories/audit.repository.js'
import { getIp } from '../utils/ip.js'

export const getUsuarios = async (req, res, next) => {
  try {
    const usuarios = await UserRepository.getAll()
    res.json(usuarios)
  } catch (error) {
    next(error)
  }
}

export const updateUsuario = async (req, res, next) => {
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
    next(error)
  }
}
