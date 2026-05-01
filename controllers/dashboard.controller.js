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
      return res.render('dashboardadm', { section, usuarios: usuariosMapeados, unidades: unidadesMapeadas })
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

      // Solo UADs sin unidad asignada aún
      const titularesAsignados = new Set(unidades.map(u => u.titularId).filter(Boolean))

      const usuariosMapeados = usuarios
        .filter(u => u.role === 'UAD' && !titularesAsignados.has(u.id))
        .map(u => ({
          id: u.id,
          nombre: u.username,
          correo: u.email,
          rol: u.role
        }))

      return res.render('dashboardadm', { section, unidades: unidadesMapeadas, usuarios: usuariosMapeados })
    }
  } catch (error) {
    console.error('[renderADM]', error)
    res.status(500).send('Error interno del servidor')
  }
}

const renderAOF = async (req, res) => {
  try {
    const [oficios, unidades] = await Promise.all([
      OficioRepository.getAll(),
      UADRepository.getAll()
    ])
    res.render('dashboardaof', { oficios, unidades })
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

    const oficios = await OficioRepository.getByUnidad(unidadId)
    res.render('dashboarduad', { oficios, unidadId, unidadAlias })
  } catch (error) {
    console.error('[renderUAD]', error)
    res.status(500).send('Error interno del servidor')
  }
}