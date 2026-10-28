// Convierte las entradas de auditoría en datos listos para mostrar.
// Se usa tanto en la vista (EJS) como en /api/auditoria, para que la
// tabla se vea igual al cargar la página y al filtrar.

export const ACCION_LABELS = {
  LOGIN_OK: 'Inicio de sesión',
  LOGIN_FAIL: 'Inicio de sesión fallido',
  LOGOUT: 'Cierre de sesión',
  USUARIO_CREADO: 'Usuario creado',
  USUARIO_EDITADO: 'Usuario editado',
  OFICIO_REGISTRADO: 'Oficio registrado',
  OFICIO_EDITADO: 'Oficio editado',
  OFICIO_ESTATUS_CAMBIADO: 'Estatus de oficio cambiado',
  OFICIO_VISTO: 'Oficio visto (UAD)',
  OFICIO_VISTO_AOF: 'Oficio visto (AOF)',
  RESPUESTA_UAD_GUARDADA: 'Respuesta registrada',
  ACLARACION_UAD_AGREGADA: 'Nota aclaratoria agregada',
  FOLIO_SOLICITADO: 'Folio solicitado',
  FOLIO_REGISTRADO: 'Folio registrado',
  FOLIO_ENTREGADO: 'Folio entregado',
  FOLIO_CANCELADO: 'Folio cancelado'
}

const RAZONES_LOGIN = {
  usuario_no_encontrado: 'Usuario no encontrado',
  password_incorrecto: 'Contraseña incorrecta',
  cuenta_inactiva: 'Cuenta inactiva'
}

const unir = partes => partes.filter(Boolean).join(' · ') || '—'
const archivos = n => (n ? `${n} archivo${n === 1 ? '' : 's'}` : '')
const conAsunto = (no, asunto) => (no ? (asunto ? `${no} - ${asunto}` : no) : (asunto || ''))

const nombreUsuario = (id, usuariosMap) => {
  const u = id ? usuariosMap[id] : null
  return u ? (u.username || u.email || id) : null
}

function detalleTexto (log, usuariosMap) {
  const d = log.detalle || {}
  switch (log.accion) {
    case 'LOGIN_FAIL':
      return RAZONES_LOGIN[d.razon] || d.razon || '—'
    case 'USUARIO_CREADO':
      return unir([d.nuevoUsuarioEmail, d.nuevoRol && `(${d.nuevoRol})`])
    case 'USUARIO_EDITADO':
      return unir([
        nombreUsuario(d.usuarioEditadoId, usuariosMap) || d.usuarioEditado || d.usuarioEditadoId,
        d.nuevoRol && `rol ${d.nuevoRol}`,
        d.nuevoEstatus && `estatus ${d.nuevoEstatus}`,
        d.cambioPassword && 'cambió contraseña'
      ])
    case 'OFICIO_REGISTRADO':
    case 'OFICIO_EDITADO':
      return unir([conAsunto(d.noOficio, d.asunto)])
    case 'OFICIO_ESTATUS_CAMBIADO': {
      const estatus = d.nuevoEstatus || d.estatusNuevo
      return unir([d.noOficio, estatus && `→ ${estatus}`])
    }
    case 'OFICIO_VISTO':
      return unir([d.noOficio, d.unidadAlias])
    case 'OFICIO_VISTO_AOF':
      return unir([d.noOficio])
    case 'RESPUESTA_UAD_GUARDADA':
    case 'ACLARACION_UAD_AGREGADA':
      return unir([d.noOficio, d.unidadAlias, archivos(d.totalArchivos), d.tieneComentario && 'con comentario'])
    case 'FOLIO_SOLICITADO':
    case 'FOLIO_REGISTRADO':
      return unir([conAsunto(d.noFolio, d.asunto), d.destinatario && `para ${d.destinatario}`])
    case 'FOLIO_ENTREGADO':
      return unir([d.noFolio, d.fechaEntrega && `entregado ${d.fechaEntrega}`])
    case 'FOLIO_CANCELADO':
      return unir([d.noFolio])
    default:
      return unir([d.noOficio, d.noFolio, d.asunto])
  }
}

export const mapaUsuarios = usuarios =>
  Object.fromEntries((usuarios || []).map(u => [u.id, { username: u.username, email: u.email, role: u.role }]))

export const formatAuditLogs = (logs, usuariosMap = {}) =>
  logs.map(log => {
    const u = log.usuarioId ? usuariosMap[log.usuarioId] : null
    return {
      id: log.id,
      timestamp: log.timestamp,
      usuarioId: log.usuarioId || null,
      usuarioNombre: u?.username || null,
      usuarioEmail: log.usuarioEmail || u?.email || null,
      rol: log.rol || u?.role || null,
      accion: log.accion,
      accionLabel: ACCION_LABELS[log.accion] || log.accion,
      detalleTexto: detalleTexto(log, usuariosMap),
      ip: log.ip || null,
      esError: log.accion === 'LOGIN_FAIL'
    }
  })

// Lista para el filtro de usuarios (sale de la colección de usuarios,
// no de leer cientos de logs).
export const usuariosParaFiltro = usuarios =>
  (usuarios || [])
    .map(u => ({ id: u.id, nombre: u.username || u.email || u.id, email: u.email || '—', rol: u.role || '—' }))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
