export function parseUnidadIds (raw) {
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string' && raw) return [raw]
  return []
}

export function buildUnidadAlias (unidadIds, unidades) {
  return unidadIds
    .map(id => {
      const u = unidades.find(u => u.id === id)
      return u ? u.alias : id
    })
    .join(', ')
}
