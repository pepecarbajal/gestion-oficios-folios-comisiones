import { UADRepository } from '../../repositories/uad.repository.js'
import { OficioRepository } from '../../repositories/oficio.repository.js'
import { FolioRepository } from '../../repositories/folio.repository.js'

export const getDashboardUAD = async (unidadId, unidadAlias) => {
  const [oficiosRaw, foliosRaw] = await Promise.all([
    OficioRepository.getByUnidad(unidadId),
    FolioRepository.getByUnidad(unidadId)
  ])
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

  const oficiosAtend = oficiosRaw
    .filter(o => {
      const respuestas = o.respuestas || []
      const cooresp = o.cooresponsableIds || []
      const esCoResponsable = cooresp.includes(unidadId)

      if (esCoResponsable) {
        const responsables = o.responsableIds || []
        return responsables.every(id => respuestas.some(r => r.unidadId === id))
      }

      return respuestas.some(r => r.unidadId === unidadId)
    })
    .sort((a, b) => {
      const getLatest = (resp, uid) => (resp || [])
        .filter(r => r.unidadId === uid)
        .reduce((max, r) => {
          const d = new Date(r.fechaAtendido)
          return d > max ? d : max
        }, new Date(0))
      return getLatest(b.respuestas, unidadId) - getLatest(a.respuestas, unidadId)
    })

  const todasUnidades = await UADRepository.getAll()
  const unidadMap = {}
  todasUnidades.forEach(u => { unidadMap[u.id] = u.alias })

  const foliosPend = foliosRaw.filter(f => f.estatus === 'Pendiente')
  const foliosAtend = foliosRaw
    .filter(f => f.estatus !== 'Pendiente')
    .sort((a, b) => {
      if (!a.fechaEntrega) return 1
      if (!b.fechaEntrega) return -1
      return new Date(b.fechaEntrega) - new Date(a.fechaEntrega)
    })

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

  return { oficiosPend, oficiosAtend, oficios: oficiosRaw, foliosPend, foliosAtend, folios: foliosRaw, unidadId, unidadAlias, coresponsableMap }
}
