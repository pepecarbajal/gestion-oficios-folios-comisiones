const modalEvidOverlay = document.getElementById('modalEvidenciasOverlay')
const listaEvidModal = document.getElementById('listaEvidenciasModal')
const iconoTipoEv = tipo => tipo === 'application/pdf'
  ? `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`

function abrirEvidencias(btn) {
  const id = btn.dataset.oficioId
  const archivos = (window.__evidencias && window.__evidencias[id]) || []
  listaEvidModal.innerHTML = archivos.length
    ? archivos.map(a => `<a href="${a.url}" target="_blank" class="archivo-chip">${iconoTipoEv(a.tipo)} ${a.nombre}</a>`).join('')
    : '<p style="color:#9ca3af;font-size:0.85rem;font-style:italic">Sin archivos adjuntos.</p>'
  modalEvidOverlay.classList.add('active')
}

document.getElementById('modalEvidenciasClose').addEventListener('click', () => modalEvidOverlay.classList.remove('active'))
document.getElementById('btnEvidenciasCerrar').addEventListener('click', () => modalEvidOverlay.classList.remove('active'))
modalEvidOverlay.addEventListener('click', e => { if (e.target === modalEvidOverlay) modalEvidOverlay.classList.remove('active') })

function cambiarTab(tab, e) {
  if (e) e.preventDefault()
  const esPend = tab === 'pendientes'
  document.getElementById('tabPendientes').style.display = esPend ? '' : 'none'
  document.getElementById('tabAtendidos').style.display = esPend ? 'none' : ''
  document.getElementById('navPendientes').classList.toggle('active', esPend)
  document.getElementById('navAtendidos').classList.toggle('active', !esPend)
}

const searchPend = document.getElementById('searchPendientes')
const filterEstatusPend = document.getElementById('filterEstatusPend')

function filtrarPendientes() {
  const texto = searchPend.value.toLowerCase()
  const estatus = filterEstatusPend.value
  let visibles = 0
  document.querySelectorAll('.pend-row').forEach(row => {
    const matchTexto = !texto || row.dataset.search.includes(texto)
    const matchEstatus = !estatus || row.dataset.estatus === estatus
    const visible = matchTexto && matchEstatus
    row.style.display = visible ? '' : 'none'
    if (visible) visibles++
  })
  const total = document.querySelectorAll('.pend-row').length
  const info = document.getElementById('paginacionInfoPend')
  if (info) info.textContent = `Mostrando ${visibles} de ${total}`
}

searchPend.addEventListener('input', filtrarPendientes)
filterEstatusPend.addEventListener('change', filtrarPendientes)
const searchAtend = document.getElementById('searchAtendidos')
if (searchAtend) {
  searchAtend.addEventListener('input', () => {
    const texto = searchAtend.value.toLowerCase()
    let visibles = 0
    document.querySelectorAll('.atend-row').forEach(card => {
      const visible = !texto || card.dataset.search.includes(texto)
      card.style.display = visible ? '' : 'none'
      if (visible) visibles++
    })
    const total = document.querySelectorAll('.atend-row').length
    const info = document.getElementById('paginacionInfoAtend')
    if (info) info.textContent = `Mostrando ${visibles} de ${total}`
  })
}

const modalOverlay = document.getElementById('modalRespuestaOverlay')
const inputEvidencias = document.getElementById('inputEvidencias')
const fileDropMulti = document.getElementById('fileDropMulti')
const fileLabelMulti = document.getElementById('fileLabelMulti')
const listaArchivos = document.getElementById('listaArchivos')
let oficioRespId = null
let archivosSeleccionados = []

const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const iconoTipo = tipo => tipo === 'application/pdf'
  ? `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`
  : `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`

function renderListaArchivos() {
  listaArchivos.innerHTML = ''
  archivosSeleccionados.forEach((file, i) => {
    const chip = document.createElement('div')
    chip.className = 'archivo-chip-selected'
    chip.innerHTML = `${iconoTipo(file.type)}<span>${file.name}</span><button class="chip-remove" data-i="${i}">&times;</button>`
    listaArchivos.appendChild(chip)
  })
  listaArchivos.querySelectorAll('.chip-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      archivosSeleccionados.splice(Number(btn.dataset.i), 1)
      renderListaArchivos()
    })
  })
  fileLabelMulti.textContent = archivosSeleccionados.length > 0
    ? `${archivosSeleccionados.length} archivo(s) seleccionado(s)`
    : 'Arrastra archivos aquí o haz clic para seleccionar'
}

function agregarArchivos(nuevos) {
  const errorEl = document.getElementById('modalRespuestaError')
  for (const file of nuevos) {
    if (!tiposPermitidos.includes(file.type)) {
      errorEl.textContent = `Tipo no permitido: ${file.name}. Solo PDF e imágenes.`
      continue
    }
    if (!archivosSeleccionados.find(f => f.name === file.name)) {
      archivosSeleccionados.push(file)
    }
  }
  renderListaArchivos()
}

fileDropMulti.addEventListener('click', () => inputEvidencias.click())
inputEvidencias.addEventListener('change', () => {
  agregarArchivos(Array.from(inputEvidencias.files))
  inputEvidencias.value = ''
})
fileDropMulti.addEventListener('dragover', e => { e.preventDefault(); fileDropMulti.classList.add('drag-over') })
fileDropMulti.addEventListener('dragleave', () => fileDropMulti.classList.remove('drag-over'))
fileDropMulti.addEventListener('drop', e => {
  e.preventDefault()
  fileDropMulti.classList.remove('drag-over')
  agregarArchivos(Array.from(e.dataTransfer.files))
})

const cerrarModal = () => {
  modalOverlay.classList.remove('active')
  oficioRespId = null
  archivosSeleccionados = []
  document.getElementById('inputComentario').value = ''
  document.getElementById('modalRespuestaError').textContent = ''
  document.getElementById('archivosExistentes').style.display = 'none'
  document.getElementById('listaArchivosExistentes').innerHTML = ''
  renderListaArchivos()
}

document.getElementById('modalRespuestaClose').addEventListener('click', cerrarModal)
document.getElementById('btnRespuestaCancelar').addEventListener('click', cerrarModal)
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) cerrarModal() })

document.querySelectorAll('.btn-responder').forEach(btn => {
  btn.addEventListener('click', () => {
    oficioRespId = btn.dataset.id
    const yaRespondio = btn.dataset.ya === 'true'
    document.getElementById('modalRespuestaTitulo').textContent = yaRespondio ? 'Editar Respuesta' : 'Responder Oficio'
    document.getElementById('inputComentario').value = btn.dataset.comentario || ''
    archivosSeleccionados = []
    renderListaArchivos()

    const existentesPanel = document.getElementById('archivosExistentes')
    const existentesList = document.getElementById('listaArchivosExistentes')
    if (yaRespondio) {
      try {
        const arch = JSON.parse(btn.dataset.archivos || '[]')
        if (arch.length > 0) {
          existentesList.innerHTML = arch.map(a =>
            `<a href="${a.url}" target="_blank" class="archivo-chip">${iconoTipo(a.tipo)} ${a.nombre}</a>`
          ).join('')
          existentesPanel.style.display = 'block'
        }
      } catch (_) {}
    }
    modalOverlay.classList.add('active')
  })
})

document.getElementById('btnRespuestaGuardar').addEventListener('click', async () => {
  const comentario = document.getElementById('inputComentario').value.trim()
  const errorEl = document.getElementById('modalRespuestaError')
  if (!comentario && archivosSeleccionados.length === 0) {
    errorEl.textContent = 'Debes agregar un comentario o al menos un archivo.'
    return
  }
  document.getElementById('btnGuardarText').style.display = 'none'
  document.getElementById('btnGuardarLoader').style.display = 'inline-block'
  errorEl.textContent = ''
  try {
    const formData = new FormData()
    formData.append('comentario', comentario)
    archivosSeleccionados.forEach(file => formData.append('archivos', file))
    const res = await fetch(`/oficios/${oficioRespId}/respuesta`, { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { errorEl.textContent = data.error || 'Error al guardar respuesta.'; return }
    cerrarModal()
    window.location.reload()
  } catch {
    errorEl.textContent = 'Error de conexión.'
  } finally {
    document.getElementById('btnGuardarText').style.display = ''
    document.getElementById('btnGuardarLoader').style.display = 'none'
  }
})