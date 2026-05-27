import { UADRepository } from '../../repositories/uad.repository.js'
import { OficioRepository } from '../../repositories/oficio.repository.js'
import { FolioRepository } from '../../repositories/folio.repository.js'

export const getDashboardAOF = async (unidadId, unidadAlias) => {
  const [oficiosRaw, foliosRaw, unidades] = await Promise.all([
    OficioRepository.getAll(),
    FolioRepository.getAll(),
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

  const coresponsableMap = {}
  oficiosRaw.forEach(o => {
    const cooresp = o.cooresponsableIds || []
    const responsables = o.responsableIds || []
    coresponsableMap[o.id] = {
      esResponsable: unidadId ? responsables.includes(unidadId) : false,
      esCoResponsable: unidadId ? cooresp.includes(unidadId) : false,
      aliasResponsable: responsables.map(id => {
        const u = unidades.find(uu => uu.id === id)
        return u ? u.alias : id
      }).join(', ')
    }
  })

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

  const foliosPend = foliosRaw.filter(f => f.estatus === 'Pendiente')
  const foliosAtend = foliosRaw.filter(f => f.estatus !== 'Pendiente')

  let miUnidadPend = []
  let miUnidadAt = []
  let miFolPend = []
  let miFolAtend = []
  if (unidadId) {
    const [miOfRaw, miFolRaw] = await Promise.all([
      OficioRepository.getByUnidad(unidadId),
      FolioRepository.getByUnidad(unidadId)
    ])
    miUnidadPend = miOfRaw
      .filter(o => {
        const yaRespondio = (o.responsableIds || []).includes(unidadId)
          ? (o.respuestas || []).some(r => r.unidadId === unidadId)
          : (o.respuestas || []).length > 0
        return o.estatus === 'Pendiente' && !yaRespondio
      })
      .sort((a, b) => {
        const pa = calcPrioridadAOF(a), pb = calcPrioridadAOF(b)
        if (pa !== pb) return pa - pb
        const la = a.fechaLimite ? new Date(a.fechaLimite) : new Date('9999-12-31')
        const lb = b.fechaLimite ? new Date(b.fechaLimite) : new Date('9999-12-31')
        return la - lb
      })
    miUnidadAt = miOfRaw.filter(o => {
      const yaRespondio = (o.responsableIds || []).includes(unidadId)
        ? (o.respuestas || []).some(r => r.unidadId === unidadId)
        : (o.respuestas || []).length > 0
      return yaRespondio
    })
    miFolPend = miFolRaw.filter(f => f.estatus === 'Pendiente')
    miFolAtend = miFolRaw.filter(f => f.estatus !== 'Pendiente')
  }

  return { oficiosPend, oficiosAt, oficios: oficiosRaw, foliosPend, foliosAtend, folios: foliosRaw, unidades, miUnidadPend, miUnidadAt, miFolPend, miFolAtend, unidadId, unidadAlias, coresponsableMap }
}
