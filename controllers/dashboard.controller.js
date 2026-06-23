import { getDashboardData } from '../services/dashboard/dashboard.service.js'

export const dashboard = async (req, res, next) => {
  const { role, unidadId, unidadAlias } = req.user
  const section = req.query.section || 'usuarios'

  try {
    const result = await getDashboardData(role, unidadId, unidadAlias, section)

    switch (role) {
      case 'ADM':
        return res.render('dashboardadm', {
          title: 'Dashboard Administrador',
          styles: ['/css/dashboardadm.css'],
          section: result.section,
          ...result.data
        })
      case 'AOF':
        return res.render('dashboardaof', {
          title: 'Asistente de Oficios',
          styles: ['/css/dashboardaof.css'],
          userId: req.user.id,
          unidadId: result.unidadId || null,
          unidadAlias: result.unidadAlias || null,
          ...result.data
        })
      case 'UAD':
        return res.render('dashboarduad', {
          title: 'Unidad Administrativa',
          styles: ['/css/dashboarduad.css'],
          ...result.data
        })
      default:
        res.status(403).send('Rol no autorizado')
    }
  } catch (error) {
    next(error)
  }
}
