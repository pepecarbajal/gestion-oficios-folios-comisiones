import { UADRepository } from '../repositories/uad.repository.js'
import { OficioRepository } from '../repositories/oficio.repository.js'
import { UserRepository } from '../repositories/user.repository.js'
import { AuditRepository } from '../repositories/audit.repository.js'

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

export const getDashboardAOF = async () => {
  const [oficiosRaw, unidades] = await Promise.all([
    OficioRepository.getAll(),
    UADRepository.getAll()
  ])

  const ahora = new Date()

  const calcPrioridadAOF = (o) => {
    if (!o.fechaLimite) return 2
    const limite = new Date(o.fechaLimite)
    limite.setHours(23, 59, 59, 999)
    if (limite < ahora) return 0
    const dias = (limite - ahora) / (1000 * 60 * 60 * 24)
    return dias <= 6 ? 1 : 2
  }

  const oficiosPend = oficiosRaw
    .filter(o => {
      const limite = o.fechaLimite ? new Date(o.fechaLimite) : null
      if (limite) limite.setHours(23, 59, 59, 999)
      return o.estatus === 'Pendiente' || (limite && limite < ahora && o.estatus === 'Pendiente')
    })
    .sort((a, b) => {
      const pa = calcPrioridadAOF(a), pb = calcPrioridadAOF(b)
      if (pa !== pb) return pa - pb
      const la = a.fechaLimite ? new Date(a.fechaLimite) : new Date('9999-12-31')
      const lb = b.fechaLimite ? new Date(b.fechaLimite) : new Date('9999-12-31')
      return la - lb
    })

  const oficiosAt = oficiosRaw.filter(o => (o.respuestas || []).length > 0)

  return { oficiosPend, oficiosAt, oficios: oficiosRaw, unidades }
}

export const getDashboardUAD = async (unidadId, unidadAlias) => {
  const oficiosRaw = await OficioRepository.getByUnidad(unidadId)
  const ahora = new Date()

  const calcPrioridad = (o) => {
    if (!o.fechaLimite) return 2
    const limite = new Date(o.fechaLimite)
    limite.setHours(23, 59, 59, 999)
    if (limite < ahora) return 0
    const diasRestantes = (limite - ahora) / (1000 * 60 * 60 * 24)
    return diasRestantes <= 6 ? 1 : 2
  }

  const oficiosPend = oficiosRaw
    .filter(o => {
      const limite = o.fechaLimite ? new Date(o.fechaLimite) : null
      if (limite) limite.setHours(23, 59, 59, 999)
      const respuestas = o.respuestas || []
      const cooresp = o.cooresponsableIds || []
      const esCoResponsable = cooresp.includes(unidadId)
      const esResponsable = (o.responsableIds || []).includes(unidadId)

      let yaRespondio
      if (esCoResponsable) {
        const responsables = o.responsableIds || []
        yaRespondio = responsables.every(id => respuestas.some(r => r.unidadId === id))
      } else {
        yaRespondio = respuestas.some(r => r.unidadId === unidadId)
      }

      return !yaRespondio && (o.estatus === 'Pendiente' || (limite && limite < ahora && o.estatus === 'Pendiente'))
    })
    .sort((a, b) => {
      const pa = calcPrioridad(a), pb = calcPrioridad(b)
      if (pa !== pb) return pa - pb
      const la = a.fechaLimite ? new Date(a.fechaLimite) : new Date('9999-12-31')
      const lb = b.fechaLimite ? new Date(b.fechaLimite) : new Date('9999-12-31')
      return la - lb
    })

  const oficiosAtend = oficiosRaw.filter(o => {
    const respuestas = o.respuestas || []
    const cooresp = o.cooresponsableIds || []
    const esCoResponsable = cooresp.includes(unidadId)

    if (esCoResponsable) {
      const responsables = o.responsableIds || []
      return responsables.every(id => respuestas.some(r => r.unidadId === id))
    }

    return respuestas.some(r => r.unidadId === unidadId)
  })

  const todasUnidades = await UADRepository.getAll()
  const unidadMap = {}
  todasUnidades.forEach(u => { unidadMap[u.id] = u.alias })

  const coresponsableMap = {}
  oficiosRaw.forEach(o => {
    const cooresp = o.cooresponsableIds || []
    const responsables = o.responsableIds || []
    coresponsableMap[o.id] = {
      esResponsable: responsables.includes(unidadId),
      esCoResponsable: cooresp.includes(unidadId),
      aliasResponsable: responsables.map(id => unidadMap[id] || id).join(', ')
    }
  })

  return { oficiosPend, oficiosAtend, oficios: oficiosRaw, unidadId, unidadAlias, coresponsableMap }
}

export const getDashboardData = async (role, unidadId, unidadAlias, section) => {
  switch (role) {
    case 'ADM':
      return { role, data: await getDashboardADM(section), section }
    case 'AOF':
      return { role, data: await getDashboardAOF() }
    case 'UAD':
      return { role, data: await getDashboardUAD(unidadId, unidadAlias), unidadId, unidadAlias }
    default:
      throw new Error('Rol no autorizado')
  }
}
