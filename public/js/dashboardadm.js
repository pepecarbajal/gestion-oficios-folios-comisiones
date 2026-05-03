// ── Modal nuevo usuario ──
const overlay = document.getElementById('modalOverlay')
const modalError = document.getElementById('modalError')

const cerrarModal = () => { overlay.classList.remove('active'); modalError.textContent = '' }

document.getElementById('btnNuevoUsuario').addEventListener('click', () => overlay.classList.add('active'))
document.getElementById('modalClose').addEventListener('click', cerrarModal)
document.getElementById('btnCancelar').addEventListener('click', cerrarModal)
overlay.addEventListener('click', e => { if (e.target === overlay) cerrarModal() })

document.getElementById('btnAgregar').addEventListener('click', async () => {
  const username = document.getElementById('inputNombre').value.trim()
  const email    = document.getElementById('inputCorreo').value.trim()
  const password = document.getElementById('inputPassword').value.trim()
  const role     = document.getElementById('inputRol').value
  const estatus  = document.getElementById('inputEstatus').value

  if (!username || !email || !password || !role || !estatus) {
    modalError.textContent = 'Todos los campos son obligatorios.'
    return
  }
  try {
    const res  = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, role })
    })
    const data = await res.json()
    if (!res.ok) { modalError.textContent = data.error || 'Error al registrar usuario.'; return }
    cerrarModal()
    window.location.reload()
  } catch { modalError.textContent = 'Error de conexión.' }
})

// ── Modal editar usuario ──
const editOverlay   = document.getElementById('modalEditOverlay')
const modalEditError = document.getElementById('modalEditError')
let usuarioEditandoId = null

const cerrarModalEdit = () => {
  editOverlay.classList.remove('active')
  modalEditError.textContent = ''
  usuarioEditandoId = null
}

document.getElementById('modalEditClose').addEventListener('click', cerrarModalEdit)
document.getElementById('btnEditCancelar').addEventListener('click', cerrarModalEdit)
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

document.getElementById('btnGuardar').addEventListener('click', async () => {
  const username = document.getElementById('editNombre').value.trim()
  const email    = document.getElementById('editCorreo').value.trim()
  const role     = document.getElementById('editRol').value
  const estatus  = document.getElementById('editEstatus').value
  const password = document.getElementById('editPassword').value.trim()

  if (!username || !email || !role || !estatus) {
    modalEditError.textContent = 'Todos los campos son obligatorios.'
    return
  }
  try {
    const res  = await fetch(`/users/${usuarioEditandoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, role, estatus, password })
    })
    const data = await res.json()
    if (!res.ok) { modalEditError.textContent = data.error || 'Error al actualizar usuario.'; return }
    cerrarModalEdit()
    window.location.reload()
  } catch { modalEditError.textContent = 'Error de conexión.' }
})

// ── Modal nueva UAD ──
const uadOverlay    = document.getElementById('modalUadOverlay')
const modalUadError = document.getElementById('modalUadError')

const cerrarUadModal = () => {
  uadOverlay.classList.remove('active')
  modalUadError.textContent = ''
  document.getElementById('inputUadNombre').value   = ''
  document.getElementById('inputUadAlias').value    = ''
  document.getElementById('inputUadTitular').value  = ''
}

document.getElementById('btnNuevaUnidad').addEventListener('click', () => uadOverlay.classList.add('active'))
document.getElementById('modalUadClose').addEventListener('click', cerrarUadModal)
document.getElementById('btnUadCancelar').addEventListener('click', cerrarUadModal)
uadOverlay.addEventListener('click', e => { if (e.target === uadOverlay) cerrarUadModal() })

document.getElementById('btnUadAgregar').addEventListener('click', async () => {
  const uadname   = document.getElementById('inputUadNombre').value.trim()
  const alias     = document.getElementById('inputUadAlias').value.trim()
  const titularId = document.getElementById('inputUadTitular').value || null

  if (!uadname || !alias) { modalUadError.textContent = 'Nombre y alias son obligatorios.'; return }

  try {
    const res  = await fetch('/registeruad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uadname, alias, titularId })
    })
    const data = await res.json()
    if (!res.ok) { modalUadError.textContent = data.error || 'Error al registrar unidad.'; return }
    cerrarUadModal()
    window.location.reload()
  } catch { modalUadError.textContent = 'Error de conexión.' }
})

// ── Modal editar UAD ──
const uadEditOverlay    = document.getElementById('modalUadEditOverlay')
const modalUadEditError = document.getElementById('modalUadEditError')
let uadEditandoId = null

const cerrarUadEditModal = () => {
  uadEditOverlay.classList.remove('active')
  modalUadEditError.textContent = ''
  uadEditandoId = null
}

document.getElementById('modalUadEditClose').addEventListener('click', cerrarUadEditModal)
document.getElementById('btnUadEditCancelar').addEventListener('click', cerrarUadEditModal)
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

document.getElementById('btnUadGuardar').addEventListener('click', async () => {
  const uadname   = document.getElementById('editUadNombre').value.trim()
  const alias     = document.getElementById('editUadAlias').value.trim()
  const titularId = document.getElementById('editUadTitular').value || null

  if (!uadname || !alias) { modalUadEditError.textContent = 'Nombre y alias son obligatorios.'; return }

  try {
    const res  = await fetch(`/uads/${uadEditandoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uadname, alias, titularId })
    })
    const data = await res.json()
    if (!res.ok) { modalUadEditError.textContent = data.error || 'Error al actualizar unidad.'; return }
    cerrarUadEditModal()
    window.location.reload()
  } catch { modalUadEditError.textContent = 'Error de conexión.' }
})