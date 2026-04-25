import { UserRepository } from '../repositories/user.repository.js'
import { UADRepository } from '../repositories/uad.repository.js'

export const dashboard = async (req, res) => {
  const { role } = req.user

  const vistas = {
    ADM: () => renderADM(req, res),
    AOF: () => res.render('dashboardaof'),
    UAD: () => res.render('dashboarduad'),
  }

  const renderVista = vistas[role]
  if (renderVista) {
    renderVista()
  } else {
    res.status(403).render('error', { mensaje: 'Rol no autorizado' })
  }
}

const renderADM = async (req, res) => {
  const section = req.query.section || 'usuarios'

  try {
    if (section === 'usuarios') {
      const [usersRes, uadsRes] = await Promise.all([
        fetch(`http://localhost:${process.env.PORT}/users`, {
          headers: { Cookie: `access_token=${req.cookies.access_token}` }
        }),
        fetch(`http://localhost:${process.env.PORT}/uads`, {
          headers: { Cookie: `access_token=${req.cookies.access_token}` }
        })
      ])

      const usuarios = await usersRes.json()
      const unidades = await uadsRes.json()

      const usuariosMapeados = usuarios.map(u => ({
        ...u,
        nombre: u.username,
        correo: u.email,
        rol: u.role,
        unidad: unidad ? unidad.alias : '—',
        estatus: u.estatus || 'Activo',
        initials: u.username?.slice(0, 2).toUpperCase()
      }))

      const unidadesMapeadas = unidades.map(u => ({ ...u, nombre: u.uadname }))

      return res.render('dashboardadm', { section, usuarios: usuariosMapeados, unidades: unidadesMapeadas })
    }

    if (section === 'unidades') {
      const response = await fetch(`http://localhost:${process.env.PORT}/uads`, {
        headers: { Cookie: `access_token=${req.cookies.access_token}` }
      })
      const unidades = await response.json()
      const unidadesMapeadas = unidades.map(u => ({
        ...u,
        nombre: u.uadname
      }))
      return res.render('dashboardadm', { section, unidades: unidadesMapeadas, usuarios: [] })
    }
  } catch (error) {
    res.status(500).render('error', { mensaje: error.message })
  }
}