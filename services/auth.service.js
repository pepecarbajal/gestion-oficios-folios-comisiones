import { UserRepository } from '../repositories/user.repository.js'
import { UADRepository } from '../repositories/uad.repository.js'
import { AuditRepository } from '../repositories/audit.repository.js'

export const registerUser = async ({ username, email, password, role, auditInfo }) => {
  const userId = await UserRepository.create({ username, email, password, role })

  await AuditRepository.registrar({
    accion: 'USUARIO_CREADO',
    usuarioId: auditInfo.userId,
    usuarioEmail: auditInfo.email,
    rol: auditInfo.role,
    detalle: { nuevoUsuarioEmail: email, nuevoRol: role },
    ip: auditInfo.ip
  })

  return userId
}

export const authenticateUser = async ({ email, password, ip }) => {
  const user = await UserRepository.login({ email, password })

  let unidadId = null
  let unidadAlias = ''

  if (user.role === 'UAD') {
    try {
      const unidad = await UADRepository.getByTitularId(user._id)
      if (unidad) {
        unidadId = unidad.id
        unidadAlias = unidad.alias || ''
      }
    } catch (_) {}
  }

  await AuditRepository.registrar({
    accion: 'LOGIN_OK',
    usuarioId: user._id,
    usuarioEmail: email,
    rol: user.role,
    detalle: {},
    ip
  })

  return { user, unidadId, unidadAlias }
}

export const logFailedLogin = async ({ email, ip, reason }) => {
  await AuditRepository.registrar({
    accion: 'LOGIN_FAIL',
    usuarioId: null,
    usuarioEmail: email,
    rol: null,
    detalle: { razon: reason },
    ip
  })
}

export const logLogout = async ({ userId, role, ip }) => {
  await AuditRepository.registrar({
    accion: 'LOGOUT',
    usuarioId: userId,
    usuarioEmail: null,
    rol: role,
    detalle: {},
    ip
  })
}
