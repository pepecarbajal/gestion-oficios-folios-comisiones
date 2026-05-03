import { UADRepository } from '../repositories/uad.repository.js'
import { OficioRepository } from '../repositories/oficio.repository.js'
import { UserRepository } from '../repositories/user.repository.js'

export const dashboard = async (req, res) => {
  const { role } = req.user

  const vistas = {
    ADM: () => renderADM(req, res),
    AOF: () => renderAOF(req, res),
    UAD: () => renderUAD(req, res)
  }

  const renderVista = vistas[role]
  if (renderVista) {
    renderVista()
  } else {
    res.status(403).send('Rol no autorizado')
  }
}

const renderADM = async (req, res) => {
  const section = req.query.section || 'usuarios'

  try {
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
      return res.render('dashboardadm', {
        title: 'Dashboard Administrador',
        styles: ['/styles-dashboardadm.css'],
        section,
        usuarios: usuariosMapeados,
        unidades: unidadesMapeadas
      })
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

      const usuariosMapeados = usuarios
        .filter(u => u.role === 'UAD' && !titularesAsignados.has(u.id))
        .map(u => ({
          id: u.id,
          nombre: u.username,
          correo: u.email,
          rol: u.role
        }))

      return res.render('dashboardadm', {
        title: 'Dashboard Administrador',
        styles: ['/styles-dashboardadm.css'],
        section,
        unidades: unidadesMapeadas,
        usuarios: usuariosMapeados
      })
    }
  } catch (error) {
    console.error('[renderADM]', error)
    res.status(500).send('Error interno del servidor')
  }
}

const renderAOF = async (req, res) => {
  try {
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

    const oficiosAt = oficiosRaw.filter(o => o.estatus === 'Atendido' && (o.respuestas || []).length > 0)

    res.render('dashboardaof', {
      title: 'Asistente de Oficios',
      styles: ['/styles-dashboardaof.css'],
      oficiosPend,
      oficiosAt,
      oficios: oficiosRaw,
      unidades
    })
  } catch (error) {
    console.error('[renderAOF]', error)
    res.status(500).send('Error interno del servidor')
  }
}

const renderUAD = async (req, res) => {
  try {
    const unidadId = req.user.unidadId
    const unidadAlias = req.user.unidadAlias || ''

    if (!unidadId) {
      return res.status(403).send('Tu usuario no tiene una unidad administrativa asignada.')
    }

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
        return o.estatus === 'Pendiente' || (limite && limite < ahora && o.estatus === 'Pendiente')
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
      return respuestas.some(r => r.unidadId === unidadId)
    })

    res.render('dashboarduad', {
      title: 'Unidad Administrativa',
      styles: ['/styles-dashboarduad.css'],
      oficiosPend,
      oficiosAtend,
      oficios: oficiosRaw,
      unidadId,
      unidadAlias
    })
  } catch (error) {
    console.error('[renderUAD]', error)
    res.status(500).send('Error interno del servidor')
  }
}