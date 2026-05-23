import { getDashboardADM } from './dashboard-adm.service.js'
import { getDashboardAOF } from './dashboard-aof.service.js'
import { getDashboardUAD } from './dashboard-uad.service.js'

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
