// Obtiene la IP real del cliente.
//
// En Render el tráfico pasa por Cloudflare, que siempre escribe la IP real
// en CF-Connecting-IP (el cliente no la puede falsificar). Si no viene,
// se usa X-Forwarded-For, pero NO el primer valor (ese lo puede inventar
// el cliente): Render agrega su propio proxy al final, así que la IP real
// es la penúltima. Sin proxy (local), se usa la conexión directa.
const limpiar = ip => (ip || '').trim().replace(/^::ffff:/, '') || null

export const getIp = (req) => {
  const cf = req.headers?.['cf-connecting-ip']
  if (cf) return limpiar(cf)

  const xff = req.headers?.['x-forwarded-for']
  if (xff) {
    const ips = xff.split(',').map(s => s.trim()).filter(Boolean)
    if (ips.length) return limpiar(ips.length >= 2 ? ips[ips.length - 2] : ips[0])
  }

  return limpiar(req.socket?.remoteAddress)
}
