import { UADRepository } from '../../repositories/uad.repository.js'
import { OficioRepository } from '../../repositories/oficio.repository.js'

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
