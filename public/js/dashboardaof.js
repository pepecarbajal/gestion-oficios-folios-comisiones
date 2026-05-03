const modalRespOverlay = document.getElementById('modalRespuestasOverlay')
const listaRespModal = document.getElementById('listaRespuestasModal')

const iconoArchivoModal = tipo => tipo === 'application/pdf'
  ? `<span class="archivo-type-badge pdf">PDF</span>`
  : `<span class="archivo-type-badge img">IMG</span>`

function renderCardRespuesta(r) {
  const fecha = new Date(r.fechaAtendido).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})
  const comentario = r.comentario
    ? `<p class="resp-comentario">"${r.comentario}"</p>`
    : ''
  const archivos = (r.archivos || []).length > 0
    ? `<div class="resp-archivos">${(r.archivos).map(a => {
          const typeClass = a.tipo === 'application/pdf' ? 'archivo-chip-pdf' : 'archivo-chip-img';
          return `<a href="javascript:void(0)" onclick="openFileViewer('${a.url}', '${a.nombre}')" class="archivo-chip ${typeClass}">${iconoArchivoModal(a.tipo)} <span>${a.nombre}</span></a>`;
        }).join('')}</div>`
    : ''
  const hasCuerpo = r.comentario || (r.archivos && r.archivos.length > 0)
  return `
    <div class="respuesta-item">
      <div class="respuesta-body">
        <div class="respuesta-header">
          <span class="resp-alias">${r.unidadAlias || '—'}</span>
          <span class="resp-fecha">Atendido: ${fecha}</span>
        </div>
        ${hasCuerpo ? '<div class="respuesta-divider"></div>' : ''}
        ${comentario}
        ${archivos}
      </div>
    </div>`
}

function abrirModalRespuestas(btn) {
  const id = btn.dataset.oficioId
  const respuestas = (window.__respuestas && window.__respuestas[id]) || []
  listaRespModal.innerHTML = respuestas.length
    ? `<div class="modal-respuestas-grid">${respuestas.map(renderCardRespuesta).join('')}</div>`
    : '<p style="color:#9ca3af;font-size:0.85rem;font-style:italic;text-align:center;padding:20px 0">Sin respuestas registradas.</p>'
  modalRespOverlay.classList.add('active')
}

document.getElementById('modalRespuestasClose').addEventListener('click', () => modalRespOverlay.classList.remove('active'))
document.getElementById('btnRespuestasCerrar').addEventListener('click', () => modalRespOverlay.classList.remove('active'))
modalRespOverlay.addEventListener('click', e => { if (e.target === modalRespOverlay) modalRespOverlay.classList.remove('active') })

function cambiarTab(tab, e) {
  if (e) e.preventDefault()
  const esOf = tab === 'oficios'
  document.getElementById('tabOficios').style.display = esOf ? '' : 'none'
  document.getElementById('tabAtendidos').style.display = esOf ? 'none' : ''
  document.getElementById('navOficios').classList.toggle('active', esOf)
  document.getElementById('navAtendidos').classList.toggle('active', !esOf)
}

const searchOf = document.getElementById('searchOficios')
const filterEstatusOf = document.getElementById('filterEstatusOf')
const filterUnidadOf = document.getElementById('filterUnidadOf')

function filtrarOficios() {
  const texto = searchOf.value.toLowerCase()
  const estatus = filterEstatusOf.value
  const unidad = filterUnidadOf.value
  let visibles = 0
  document.querySelectorAll('.of-row').forEach(row => {
    const matchTexto = !texto || row.dataset.search.includes(texto)
    const matchEstatus = !estatus || row.dataset.estatus === estatus
    const matchUnidad = !unidad || row.dataset.unidad === unidad
    const visible = matchTexto && matchEstatus && matchUnidad
    row.style.display = visible ? '' : 'none'
    const respRow = document.getElementById(`resp-${row.dataset.id}`)
    if (respRow && !visible) respRow.style.display = 'none'
    if (visible) visibles++
  })
  const total = document.querySelectorAll('.of-row').length
  const info = document.getElementById('paginacionInfoOf')
  if (info) info.textContent = `Mostrando ${visibles} de ${total}`
}

searchOf.addEventListener('input', filtrarOficios)
filterEstatusOf.addEventListener('change', filtrarOficios)
filterUnidadOf.addEventListener('change', filtrarOficios)

const searchAt = document.getElementById('searchAtendidos')
const filterUnidadAt = document.getElementById('filterUnidadAt')

function filtrarAtendidos() {
  const texto = searchAt ? searchAt.value.toLowerCase() : ''
  const unidad = filterUnidadAt ? filterUnidadAt.value : ''
  let visibles = 0
  document.querySelectorAll('.at-row').forEach(card => {
    const matchTexto = !texto || card.dataset.search.includes(texto)
    const matchUnidad = !unidad || card.dataset.unidad === unidad
    const visible = matchTexto && matchUnidad
    card.style.display = visible ? '' : 'none'
    if (visible) visibles++
  })
  const total = document.querySelectorAll('.at-row').length
  const info = document.getElementById('paginacionInfoAt')
  if (info) info.textContent = `Mostrando ${visibles} de ${total}`
}

if (searchAt) searchAt.addEventListener('input', filtrarAtendidos)
if (filterUnidadAt) filterUnidadAt.addEventListener('change', filtrarAtendidos)

const modalOverlay = document.getElementById('modalOficioOverlay')
const fileDrop = document.getElementById('fileDrop')
const inputArchivo = document.getElementById('inputArchivo')

function updateFileDropUI(file) {
  const children = Array.from(fileDrop.children)
  children.forEach(child => {
    if (child.id !== 'inputArchivo') fileDrop.removeChild(child)
  })

  if (file) {
    fileDrop.classList.add('has-file')
    const container = document.createElement('div')
    container.className = 'file-chip-remove-container'
    
    const chip = document.createElement('div')
    chip.className = 'file-chip-single'
    
    const info = document.createElement('div')
    info.className = 'file-info'
    info.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg> <span>${file.name}</span>`
    
    const removeBtn = document.createElement('button')
    removeBtn.className = 'chip-remove'
    removeBtn.innerHTML = '&times;'
    removeBtn.type = 'button'
    removeBtn.onclick = (e) => {
      e.stopPropagation()
      inputArchivo.value = ''
      updateFileDropUI(null)
    }
    
    chip.appendChild(info)
    chip.appendChild(removeBtn)
    container.appendChild(chip)
    fileDrop.appendChild(container)
  } else {
    fileDrop.classList.remove('has-file')
    const svg = document.createElement('svg')
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('width', '20')
    svg.setAttribute('height', '20')
    svg.setAttribute('viewBox', '0 0 24 24')
    svg.setAttribute('fill', 'none')
    svg.setAttribute('stroke', 'currentColor')
    svg.setAttribute('stroke-width', '1.5')
    svg.setAttribute('stroke-linecap', 'round')
    svg.setAttribute('stroke-linejoin', 'round')
    svg.innerHTML = '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>'
    
    const span = document.createElement('span')
    span.id = 'fileLabel'
    span.textContent = 'Seleccionar archivo PDF'
    
    fileDrop.appendChild(svg)
    fileDrop.appendChild(span)
  }
}

const cerrarModal = () => {
  modalOverlay.classList.remove('active')
  document.getElementById('modalOficioError').textContent = ''
  ;['inputNoOficio','inputFechaOficio','inputFechaRecibo','inputFechaLimite',
    'inputAsunto','inputRemitente','inputCargo','inputDependencia'].forEach(id => {
    document.getElementById(id).value = ''
  })
  document.getElementById('inputUnidadTurnar').value = ''
  updateFileDropUI(null)
}

document.getElementById('btnNuevoOficio').addEventListener('click', () => modalOverlay.classList.add('active'))
document.getElementById('modalOficioClose').addEventListener('click', cerrarModal)
document.getElementById('btnOficioCancelar').addEventListener('click', cerrarModal)
modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) cerrarModal() })

fileDrop.addEventListener('click', () => inputArchivo.click())
inputArchivo.addEventListener('change', () => {
  const file = inputArchivo.files[0]
  if (file) { updateFileDropUI(file) }
})
fileDrop.addEventListener('dragover', e => { e.preventDefault(); fileDrop.classList.add('drag-over') })
fileDrop.addEventListener('dragleave', () => fileDrop.classList.remove('drag-over'))
fileDrop.addEventListener('drop', e => {
  e.preventDefault()
  fileDrop.classList.remove('drag-over')
  const file = e.dataTransfer.files[0]
  if (file && file.type === 'application/pdf') {
    const dt = new DataTransfer(); dt.items.add(file); inputArchivo.files = dt.files
    updateFileDropUI(file)
  }
})

document.getElementById('btnOficioRegistrar').addEventListener('click', async () => {
  const noOficio = document.getElementById('inputNoOficio').value.trim()
  const fechaOficio = document.getElementById('inputFechaOficio').value
  const fechaRecibo = document.getElementById('inputFechaRecibo').value
  const fechaLimite = document.getElementById('inputFechaLimite').value
  const asunto = document.getElementById('inputAsunto').value.trim()
  const remitente = document.getElementById('inputRemitente').value.trim()
  const cargo = document.getElementById('inputCargo').value.trim()
  const dependencia = document.getElementById('inputDependencia').value.trim()
  const unidadSelect = document.getElementById('inputUnidadTurnar')
  const unidadId = unidadSelect.value
  const unidadAlias = unidadSelect.selectedOptions[0]?.dataset.alias || ''
  const archivo = inputArchivo.files[0]
  const errorEl = document.getElementById('modalOficioError')

  if (!noOficio || !fechaOficio || !asunto || !remitente || !unidadId) {
    errorEl.textContent = 'No. oficio, fecha, asunto, remitente y unidad son obligatorios.'
    return
  }

  document.getElementById('btnRegistrarText').style.display = 'none'
  document.getElementById('btnRegistrarLoader').style.display = 'inline-block'
  errorEl.textContent = ''

  try {
    const formData = new FormData()
    formData.append('noOficio', noOficio)
    formData.append('fechaOficio', fechaOficio)
    formData.append('fechaRecibo', fechaRecibo)
    formData.append('fechaLimite', fechaLimite)
    formData.append('asunto', asunto)
    formData.append('remitente', remitente)
    formData.append('cargo', cargo)
    formData.append('dependencia', dependencia)
    formData.append('unidadId', unidadId)
    formData.append('unidadAlias', unidadAlias)
    if (archivo) formData.append('archivo', archivo)

    const res = await fetch('/oficios', { method: 'POST', body: formData })
    if (!res.ok) {
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json()
        errorEl.textContent = data.error || 'Error al registrar oficio.'
      } else {
        const text = await res.text()
        errorEl.textContent = text || 'Error al registrar oficio.'
      }
      return
    }
    cerrarModal()
    window.location.reload()
  } catch {
    errorEl.textContent = 'Error de conexión.'
  } finally {
    document.getElementById('btnRegistrarText').style.display = ''
    document.getElementById('btnRegistrarLoader').style.display = 'none'
  }
})

const modalEstatusOverlay = document.getElementById('modalEstatusOverlay')
let oficioEditandoId = null

const cerrarModalEstatus = () => {
  modalEstatusOverlay.classList.remove('active')
  oficioEditandoId = null
  document.getElementById('modalEstatusError').textContent = ''
}

document.getElementById('modalEstatusClose').addEventListener('click', cerrarModalEstatus)
document.getElementById('btnEstatusCancelar').addEventListener('click', cerrarModalEstatus)
modalEstatusOverlay.addEventListener('click', e => { if (e.target === modalEstatusOverlay) cerrarModalEstatus() })

document.querySelectorAll('.btn-cambiar-estatus').forEach(btn => {
  btn.addEventListener('click', () => {
    oficioEditandoId = btn.dataset.id
    document.getElementById('selectNuevoEstatus').value = btn.dataset.estatus || 'Pendiente'
    modalEstatusOverlay.classList.add('active')
  })
})

document.getElementById('btnEstatusGuardar').addEventListener('click', async () => {
  const estatus = document.getElementById('selectNuevoEstatus').value
  const errorEl = document.getElementById('modalEstatusError')
    try {
      const res = await fetch(`/oficios/${oficioEditandoId}/estatus`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estatus })
      })
      if (!res.ok) {
        const contentType = res.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json()
          errorEl.textContent = data.error || 'Error al cambiar estatus.'
        } else {
          const text = await res.text()
          errorEl.textContent = text || 'Error al cambiar estatus.'
        }
        return
      }
      cerrarModalEstatus()
      window.location.reload()
    } catch {
      errorEl.textContent = 'Error de conexión.'
    }
})