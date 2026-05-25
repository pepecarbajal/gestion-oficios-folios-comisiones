// ── Logs — colores por usuario ──
const USER_COLORS = {}

function stringToColor (str) {
  if (!str) return '#6b7280'
  if (USER_COLORS[str]) return USER_COLORS[str]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const hue = Math.abs(hash) % 360
  const color = `hsl(${hue}, 55%, 40%)`
  USER_COLORS[str] = color
  return color
}

function assignUserColors () {
  document.querySelectorAll('#auditTable .user-badge').forEach(el => {
    const uid = el.dataset.userId
    if (uid) {
      el.style.backgroundColor = stringToColor(uid)
      el.style.color = '#fff'
    }
  })
}

function renderAuditTable (logs) {
  const tbody = document.querySelector('#auditTable tbody')
  if (!tbody) return
  if (!logs.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No hay registros.</td></tr>'
    return
  }
  tbody.innerHTML = logs.map(log => {
    const isError = log.accion === 'LOGIN_FAIL'
    const ts = new Date(log.timestamp)
    const fecha = ts.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' })
    const hora = ts.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    const uid = log.usuarioId || ''
    const uidDisplay = uid || '—'

    let detalle = '—'
    if (log.accion === 'LOGIN_FAIL' && log.detalle?.razon) detalle = log.detalle.razon
    else if (log.detalle?.noOficio) {
      detalle = log.detalle.noOficio
      if (log.detalle.asunto) detalle += ' - ' + log.detalle.asunto
    } else if (log.accion === 'USUARIO_CREADO' && log.detalle?.nuevoUsuarioEmail) {
      detalle = log.detalle.nuevoUsuarioEmail + ' (' + (log.detalle.nuevoRol || '') + ')'
    } else if (log.accion === 'USUARIO_EDITADO' && log.detalle?.usuarioEditado) {
      detalle = log.detalle.usuarioEditado
    }

    return `<tr class="${isError ? 'row-error' : ''}">
      <td class="fecha-cell">${fecha} ${hora}</td>
      <td>
        <span class="user-badge" data-user-id="${uid}">${uidDisplay}</span>
        <span class="user-email">${log.usuarioEmail || '—'}</span>
      </td>
      <td>${log.rol || '—'}</td>
      <td class="accion-cell">${log.accion}</td>
      <td class="detalle-cell">${detalle}</td>
      <td class="ip-cell">${log.ip || '—'}</td>
    </tr>`
  }).join('')
  assignUserColors()
}

// ── Logs — filtros ──
function initAuditFilters () {
  const filterBar = document.getElementById('auditFilters')
  if (!filterBar) return

  const filtroFecha = document.getElementById('filtroFecha')
  const filtroUsuario = document.getElementById('filtroUsuario')

  filtroFecha.valueAsDate = new Date()

  async function applyFilters () {
    const params = new URLSearchParams()
    if (filtroFecha.value) {
      params.set('fechaDesde', filtroFecha.value)
      params.set('fechaHasta', filtroFecha.value)
    }
    if (filtroUsuario.value) params.set('usuarioId', filtroUsuario.value)
    params.set('limite', '200')

    try {
      const res = await fetch(`/api/auditoria?${params}`)
      const logs = await res.json()
      renderAuditTable(logs)
    } catch {
      console.error('Error al filtrar logs')
    }
  }

  filtroFecha.addEventListener('change', applyFilters)
  filtroUsuario.addEventListener('change', applyFilters)

  applyFilters()
}

// Inicializar logs
window.addEventListener('DOMContentLoaded', () => {
  assignUserColors()
  initAuditFilters()
})

// ── Paginación de Usuarios ──
let currentPage = 1
const pageSize = 10

function updatePagination() {
  const paginationDiv = document.querySelector('.pagination')
  if (!paginationDiv) return

  const table = paginationDiv.closest('.content-card').querySelector('table')
  const rows = Array.from(table.querySelectorAll('tbody tr'))
  if (!rows.length) return

  const totalPages = Math.ceil(rows.length / pageSize)
  if (currentPage < 1) currentPage = 1
  if (currentPage > totalPages) currentPage = totalPages

  const start = (currentPage - 1) * pageSize
  const end = start + pageSize

  rows.forEach((row, index) => {
    row.style.display = (index >= start && index < end) ? '' : 'none'
  })

  const info = paginationDiv.querySelector('span')
  if (info) {
    info.textContent = `Mostrando ${start + 1}-${Math.min(end, rows.length)} de ${rows.length}`
  }

  document.querySelectorAll('.page-btn').forEach(btn => {
    const text = btn.textContent.trim()
    if (text === '<') {
      btn.disabled = currentPage === 1
    } else if (text === '>') {
      btn.disabled = currentPage === totalPages
    } else {
      btn.classList.toggle('active', parseInt(text) === currentPage)
    }
  })
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('page-btn')) {
    const text = e.target.textContent.trim()
    if (text === '<') currentPage--
    else if (text === '>') currentPage++
    else currentPage = parseInt(text)
    updatePagination()
  }
})

// Inicializar paginación al cargar
window.addEventListener('DOMContentLoaded', updatePagination)

// ── Modal nuevo usuario ──
const overlay = document.getElementById('modalOverlay')
const modalError = document.getElementById('modalError')

if (overlay) {
  const cerrarModal = () => { overlay.classList.remove('active'); if (modalError) modalError.textContent = '' }
  
  const btnNuevoUsuario = document.getElementById('btnNuevoUsuario')
  if (btnNuevoUsuario) btnNuevoUsuario.addEventListener('click', () => overlay.classList.add('active'))
  
  const modalClose = document.getElementById('modalClose')
  if (modalClose) modalClose.addEventListener('click', cerrarModal)
  
  const btnCancelar = document.getElementById('btnCancelar')
  if (btnCancelar) btnCancelar.addEventListener('click', cerrarModal)
  
  overlay.addEventListener('click', e => { if (e.target === overlay) cerrarModal() })
  
  const btnAgregar = document.getElementById('btnAgregar')
  if (btnAgregar) {
    btnAgregar.addEventListener('click', async () => {
      const username = document.getElementById('inputNombre').value.trim()
      const email    = document.getElementById('inputCorreo').value.trim()
      const password = document.getElementById('inputPassword').value.trim()
      const role     = document.getElementById('inputRol').value
      const estatus  = document.getElementById('inputEstatus').value
  
      if (!username || !email || !password || !role || !estatus) {
        if (modalError) modalError.textContent = 'Todos los campos son obligatorios.'
        return
      }
      try {
        const res  = await fetch('/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, password, role })
        })
        const data = await res.json()
        if (!res.ok) { if (modalError) modalError.textContent = data.error || 'Error al registrar usuario.'; return }
        cerrarModal()
        window.location.reload()
      } catch { if (modalError) modalError.textContent = 'Error de conexión.' }
    })
  }
}

// ── Modal editar usuario ──
const editOverlay   = document.getElementById('modalEditOverlay')
const modalEditError = document.getElementById('modalEditError')
let usuarioEditandoId = null

if (editOverlay) {
  const cerrarModalEdit = () => {
    editOverlay.classList.remove('active')
    if (modalEditError) modalEditError.textContent = ''
    usuarioEditandoId = null
  }
  
  const modalEditClose = document.getElementById('modalEditClose')
  if (modalEditClose) modalEditClose.addEventListener('click', cerrarModalEdit)
  
  const btnEditCancelar = document.getElementById('btnEditCancelar')
  if (btnEditCancelar) btnEditCancelar.addEventListener('click', cerrarModalEdit)
  
  editOverlay.addEventListener('click', e => { if (e.target === editOverlay) cerrarModalEdit() })
  
  document.querySelectorAll('.btn-editar').forEach(btn => {
    btn.addEventListener('click', () => {
      usuarioEditandoId = btn.dataset.id
      document.getElementById('editNombre').value  = btn.dataset.nombre
      document.getElementById('editCorreo').value  = btn.dataset.correo
      document.getElementById('editRol').value     = btn.dataset.rol
      document.getElementById('editEstatus').value = btn.dataset.estatus
      editOverlay.classList.add('active')
    })
  })
  
  const btnGuardar = document.getElementById('btnGuardar')
  if (btnGuardar) {
    btnGuardar.addEventListener('click', async () => {
      const username = document.getElementById('editNombre').value.trim()
      const email    = document.getElementById('editCorreo').value.trim()
      const role     = document.getElementById('editRol').value
      const estatus  = document.getElementById('editEstatus').value
      const password = document.getElementById('editPassword').value.trim()
  
      if (!username || !email || !role || !estatus) {
        if (modalEditError) modalEditError.textContent = 'Todos los campos son obligatorios.'
        return
      }
      try {
        const res  = await fetch(`/users/${usuarioEditandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email, role, estatus, password })
        })
        const data = await res.json()
        if (!res.ok) { if (modalEditError) modalEditError.textContent = data.error || 'Error al actualizar usuario.'; return }
        cerrarModalEdit()
        window.location.reload()
      } catch { if (modalEditError) modalEditError.textContent = 'Error de conexión.' }
    })
  }
}

// ── Modal nueva UAD ──
const uadOverlay    = document.getElementById('modalUadOverlay')
const modalUadError = document.getElementById('modalUadError')

if (uadOverlay) {
  const cerrarUadModal = () => {
    uadOverlay.classList.remove('active')
    if (modalUadError) modalUadError.textContent = ''
    document.getElementById('inputUadNombre').value   = ''
    document.getElementById('inputUadAlias').value    = ''
    document.getElementById('inputUadTitular').value  = ''
  }
  
  const btnNuevaUnidad = document.getElementById('btnNuevaUnidad')
  if (btnNuevaUnidad) btnNuevaUnidad.addEventListener('click', () => uadOverlay.classList.add('active'))
  
  const modalUadClose = document.getElementById('modalUadClose')
  if (modalUadClose) modalUadClose.addEventListener('click', cerrarUadModal)
  
  const btnUadCancelar = document.getElementById('btnUadCancelar')
  if (btnUadCancelar) btnUadCancelar.addEventListener('click', cerrarUadModal)
  
  uadOverlay.addEventListener('click', e => { if (e.target === uadOverlay) cerrarUadModal() })
  
  const btnUadAgregar = document.getElementById('btnUadAgregar')
  if (btnUadAgregar) {
    btnUadAgregar.addEventListener('click', async () => {
      const uadname   = document.getElementById('inputUadNombre').value.trim()
      const alias     = document.getElementById('inputUadAlias').value.trim()
      const titularId = document.getElementById('inputUadTitular').value || null
  
      if (!uadname || !alias) { if (modalUadError) modalUadError.textContent = 'Nombre y alias son obligatorios.'; return }
  
      try {
        const res  = await fetch('/registeruad', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uadname, alias, titularId })
        })
        const data = await res.json()
        if (!res.ok) { if (modalUadError) modalUadError.textContent = data.error || 'Error al registrar unidad.'; return }
        cerrarUadModal()
        window.location.reload()
      } catch { if (modalUadError) modalUadError.textContent = 'Error de conexión.' }
    })
  }
}

// ── Modal editar UAD ──
const uadEditOverlay    = document.getElementById('modalUadEditOverlay')
const modalUadEditError = document.getElementById('modalUadEditError')
let uadEditandoId = null

if (uadEditOverlay) {
  const cerrarUadEditModal = () => {
    uadEditOverlay.classList.remove('active')
    if (modalUadEditError) modalUadEditError.textContent = ''
    uadEditandoId = null
  }
  
  const modalUadEditClose = document.getElementById('modalUadEditClose')
  if (modalUadEditClose) modalUadEditClose.addEventListener('click', cerrarUadEditModal)
  
  const btnUadEditCancelar = document.getElementById('btnUadEditCancelar')
  if (btnUadEditCancelar) btnUadEditCancelar.addEventListener('click', cerrarUadEditModal)
  
  uadEditOverlay.addEventListener('click', e => { if (e.target === uadEditOverlay) cerrarUadEditModal() })
  
  document.querySelectorAll('.btn-editar-uad').forEach(btn => {
    btn.addEventListener('click', () => {
      uadEditandoId = btn.dataset.id
      document.getElementById('editUadNombre').value = btn.dataset.nombre
      document.getElementById('editUadAlias').value  = btn.dataset.alias
  
      const select = document.getElementById('editUadTitular')
      const titularId = btn.dataset.titular || ''
      const titularNombre = btn.dataset.titularNombre || ''
  
      const prev = select.querySelector('option[data-temp]')
      if (prev) prev.remove()
  
      if (titularId && !select.querySelector('option[value="' + titularId + '"]')) {
        const opt = document.createElement('option')
        opt.value = titularId
        opt.textContent = titularNombre
        opt.dataset.temp = '1'
        select.appendChild(opt)
      }
  
      select.value = titularId
      uadEditOverlay.classList.add('active')
    })
  })
  
  const btnUadGuardar = document.getElementById('btnUadGuardar')
  if (btnUadGuardar) {
    btnUadGuardar.addEventListener('click', async () => {
      const uadname   = document.getElementById('editUadNombre').value.trim()
      const alias     = document.getElementById('editUadAlias').value.trim()
      const titularId = document.getElementById('editUadTitular').value || null
  
      if (!uadname || !alias) { if (modalUadEditError) modalUadEditError.textContent = 'Nombre y alias son obligatorios.'; return }
  
      try {
        const res  = await fetch(`/uads/${uadEditandoId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uadname, alias, titularId })
        })
        const data = await res.json()
        if (!res.ok) { if (modalUadEditError) modalUadEditError.textContent = data.error || 'Error al actualizar unidad.'; return }
        cerrarUadEditModal()
        window.location.reload()
      } catch { if (modalUadEditError) modalUadEditError.textContent = 'Error de conexión.' }
    })
  }
}
