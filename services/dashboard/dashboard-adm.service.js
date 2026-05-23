import { UADRepository } from '../../repositories/uad.repository.js'
import { UserRepository } from '../../repositories/user.repository.js'
import { AuditRepository } from '../../repositories/audit.repository.js'

export const getDashboardADM = async (section) => {
  if (section === 'usuarios') {
    const [usuarios, unidades] = await Promise.all([
      UserRepository.getAll(),
      UADRepository.getAll()
    ])

    const titularMap = {}
    unidades.forEach(u => {
      if (u.titularId) titularMap[u.titularId] = u
    })

    const usuariosMapeados = usuarios.map(u => {
      const unidadAsignada = titularMap[u.id]
      return {
        ...u,
        nombre: u.username,
        correo: u.email,
        rol: u.role,
        unidad: unidadAsignada ? unidadAsignada.alias : '—',
        estatus: u.estatus || 'Activo',
        initials: u.username?.slice(0, 2).toUpperCase()
      }
    })

    const unidadesMapeadas = unidades.map(u => ({ ...u, nombre: u.uadname }))

    return { usuarios: usuariosMapeados, unidades: unidadesMapeadas }
  }

  if (section === 'unidades') {
    const [unidades, usuarios] = await Promise.all([
      UADRepository.getAll(),
      UserRepository.getAll()
    ])

    const usuarioMap = {}
    usuarios.forEach(u => { usuarioMap[u.id] = u })

    const unidadesMapeadas = unidades.map(u => ({
      ...u,
      nombre: u.uadname,
      alias: u.alias,
      titular: u.titularId && usuarioMap[u.titularId]
        ? usuarioMap[u.titularId].username
        : '—',
      titularId: u.titularId || ''
    }))

    const titularesAsignados = new Set(unidades.map(u => u.titularId).filter(Boolean))
    const usuariosDisponibles = usuarios
      .filter(u => u.role === 'UAD' && !titularesAsignados.has(u.id))
      .map(u => ({
        id: u.id,
        nombre: u.username,
        correo: u.email,
        rol: u.role
      }))

    return { unidades: unidadesMapeadas, usuarios: usuariosDisponibles }
  }

  if (section === 'auditoria') {
    const [logs, auditUsers] = await Promise.all([
      AuditRepository.getByFilters({ limite: 50 }),
      AuditRepository.getDistinctUsers(500)
    ])
    return { logs, auditUsers }
  }

  return {}
}
