const modalEvidOverlay = document.getElementById('modalEvidenciasOverlay')
const listaEvidModal = document.getElementById('listaEvidenciasModal')
const iconoTipoEv = tipo => tipo === 'application/pdf'
  ? `<span class="archivo-type-badge pdf">PDF</span>`
  : `<span class="archivo-type-badge img">IMG</span>`

function abrirEvidencias(id, comentario = '', archivos = []) {
  let content = '';
  if (comentario) {
    content += `<p class="resp-comentario">"${comentario}"</p>`;
  }
  
  if (archivos && archivos.length > 0) {
    content += archivos.map(a => {
      const typeClass = a.tipo === 'application/pdf' ? 'archivo-chip-pdf' : 'archivo-chip-img';
      return `<a href="javascript:void(0)" onclick="openFileViewer('${a.url}', '${a.nombre}')" class="archivo-chip ${typeClass}">${iconoTipoEv(a.tipo)} <span>${a.nombre}</span></a>`;
    }).join('');
  } else if (!comentario) {
    content = '<p style="color:#9ca3af;font-size:0.85rem;font-style:italic">Sin archivos adjuntos.</p>';
  }
  
  listaEvidModal.innerHTML = content;
  modalEvidOverlay.classList.add('active');
}

document.getElementById('modalEvidenciasClose').addEventListener('click', () => modalEvidOverlay.classList.remove('active'))
document.getElementById('btnEvidenciasCerrar').addEventListener('click', () => modalEvidOverlay.classList.remove('active'))
modalEvidOverlay.addEventListener('click', e => { if (e.target === modalEvidOverlay) modalEvidOverlay.classList.remove('active') })

function abrirModalResponder(oficioId, comentario = '', archivos = '[]', yaRespondio = 'false') {
  oficioRespId = oficioId;
  const isAlreadyAnswered = yaRespondio === 'true';
  document.getElementById('modalRespuestaTitulo').textContent = isAlreadyAnswered ? 'Editar Respuesta' : 'Responder Oficio';
  document.getElementById('inputComentario').value = comentario;
  archivosSeleccionados = [];
  renderListaArchivos();

  const existentesPanel = document.getElementById('archivosExistentes');
  const existentesList = document.getElementById('listaArchivosExistentes');
  if (isAlreadyAnswered) {
    try {
      const arch = JSON.parse(archivos);
      if (arch.length > 0) {
        existentesList.innerHTML = arch.map(a => {
          const typeClass = a.tipo === 'application/pdf' ? 'archivo-chip-pdf' : 'archivo-chip-img';
          return `<a href="javascript:void(0)" onclick="openFileViewer('${a.url}', '${a.nombre}')" class="archivo-chip ${typeClass}">${iconoTipo(a.tipo)} <span>${a.nombre}</span></a>`;
        }).join('');
        existentesPanel.style.display = 'block';
      }
    } catch (_) {}
  }
  modalOverlay.classList.add('active');
}

function cambiarTab(tab, e) {
  if (e) e.preventDefault()
  const esPend = tab === 'pendientes'
  document.getElementById('tabPendientes').style.display = esPend ? '' : 'none'
  document.getElementById('tabAtendidos').style.display = esPend ? 'none' : ''
  document.getElementById('navPendientes').classList.toggle('active', esPend)
  document.getElementById('navAtendidos').classList.toggle('active', !esPend)
}

// ── ACTION DROPDOWN LOGIC ──
let currentActionMenu = null;

function toggleActionMenu(e, id) {
  e.stopPropagation();
  
  if (currentActionMenu) {
    currentActionMenu.remove();
    currentActionMenu = null;
  }

  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  
  const menu = document.createElement('div');
  menu.className = 'action-dropdown active';
  menu.style.top = `${rect.bottom + window.scrollY}px`;
  menu.style.left = `${rect.left + window.scrollX - 100}px`;

  const dataEl = document.getElementById(`oficio-data-${id}`);
  const data = dataEl ? JSON.parse(dataEl.textContent) : {};

  const actions = [];
  if (data.archivoUrl) {
    actions.push({
      label: 'Ver oficio',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      action: () => openFileViewer(data.archivoUrl, `Oficio ${data.noOficio}`)
    });
  }

  // Logic for "Register/Edit/View Response"
  const row = document.querySelector(`.oficio-row[data-id="${id}"]`);
  const isAtendido = row && row.classList.contains('atend-row');
  const yaRespondio = row && row.dataset.ya === 'true';

  if (isAtendido) {
    actions.push({
      label: 'Ver respuesta',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      action: () => {
        const comentario = row.dataset.comentario || '';
        const archivos = JSON.parse(row.dataset.archivos || '[]');
        abrirEvidencias(id, comentario, archivos);
      }
    });
  } else {
    actions.push({
      label: yaRespondio ? 'Editar respuesta' : 'Registrar respuesta',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      action: () => {
        const rowEl = document.querySelector(`.oficio-row[data-id="${id}"]`);
        if (rowEl) {
          const comentario = rowEl.dataset.comentario || '';
          const archivos = rowEl.dataset.archivos || '[]';
          const yaResp = rowEl.dataset.ya === 'true';
          abrirModalResponder(id, comentario, archivos, yaResp.toString());
        }
      }
    });
  }


  menu.innerHTML = actions.map((a, index) => `
    <button class="dropdown-item" data-index="${index}">
      ${a.icon} <span>${a.label}</span>
    </button>
  `).join('');

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-item');
    if (item) {
      const index = item.dataset.index;
      actions[index].action();
      menu.remove();
      currentActionMenu = null;
    }
  });

  document.body.appendChild(menu);
  currentActionMenu = menu;
}

document.addEventListener('click', () => {
  if (currentActionMenu) {
    currentActionMenu.remove();
    currentActionMenu = null;
  }
});

// ── PAGINATION ──
const PAGE_SIZE = 10;
let pagePend = 1;
let pageAtend = 1;

function renderPagination(total, page, containerId, infoId, onPageChange) {
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  const container = document.getElementById(containerId);
  const info = document.getElementById(infoId);
  if (!container) return;

  const start = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const end = Math.min(page * PAGE_SIZE, total);
  if (info) {
    info.textContent = total > 0
      ? `Mostrando ${start}-${end} de ${total}`
      : 'Mostrando 0 de 0';
  }

  let html = `<button class="page-btn" data-page="prev" ${page <= 1 ? 'disabled' : ''}>&laquo;</button>`;

  let pageStart = Math.max(1, page - 3);
  let pageEnd = Math.min(totalPages, page + 3);
  if (pageStart > 1) {
    html += `<button class="page-btn" data-page="1">1</button>`;
    if (pageStart > 2) html += `<span class="page-ellipsis">...</span>`;
  }
  for (let i = pageStart; i <= pageEnd; i++) {
    html += `<button class="page-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  if (pageEnd < totalPages) {
    if (pageEnd < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
    html += `<button class="page-btn" data-page="${totalPages}">${totalPages}</button>`;
  }

  html += `<button class="page-btn" data-page="next" ${page >= totalPages ? 'disabled' : ''}>&raquo;</button>`;

  container.innerHTML = html;

  container.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      let newPage = page;
      if (btn.dataset.page === 'prev') newPage = page - 1;
      else if (btn.dataset.page === 'next') newPage = page + 1;
      else newPage = parseInt(btn.dataset.page);
      if (newPage >= 1 && newPage <= totalPages) {
        onPageChange(newPage);
      }
    });
  });
}

const searchPend = document.getElementById('searchPendientes')
const filterEstatusPend = document.getElementById('filterEstatusPend')

function filtrarPendientes(resetPage = true) {
  if (resetPage) pagePend = 1;

  const texto = searchPend.value.toLowerCase();
  const estatus = filterEstatusPend.value;

  const allRows = Array.from(document.querySelectorAll('.pend-row'));
  const filtered = allRows.filter(row => {
    const matchTexto = !texto || row.dataset.search.includes(texto);
    const matchEstatus = !estatus || row.dataset.estatus === estatus;
    return matchTexto && matchEstatus;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (pagePend > totalPages) pagePend = totalPages;
  const start = (pagePend - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  allRows.forEach(row => { row.style.display = 'none'; });
  filtered.slice(start, end).forEach(row => { row.style.display = ''; });

  renderPagination(total, pagePend, 'pageControlsPend', 'paginacionInfoPend', (np) => {
    pagePend = np;
    filtrarPendientes(false);
  });
}

searchPend.addEventListener('input', () => filtrarPendientes(true));
filterEstatusPend.addEventListener('change', () => filtrarPendientes(true));
function filtrarAtendidos(resetPage = true) {
  if (resetPage) pageAtend = 1;

  const texto = searchAtend ? searchAtend.value.toLowerCase() : '';

  const allRows = Array.from(document.querySelectorAll('.atend-row'));
  const filtered = allRows.filter(row => {
    return !texto || row.dataset.search.includes(texto);
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (pageAtend > totalPages) pageAtend = totalPages;
  const start = (pageAtend - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  allRows.forEach(row => { row.style.display = 'none'; });
  filtered.slice(start, end).forEach(row => { row.style.display = ''; });

  renderPagination(total, pageAtend, 'pageControlsAtend', 'paginacionInfoAtend', (np) => {
    pageAtend = np;
    filtrarAtendidos(false);
  });
}

const searchAtend = document.getElementById('searchAtendidos')
if (searchAtend) {
  searchAtend.addEventListener('input', () => filtrarAtendidos(true));
}

filtrarPendientes(false);
filtrarAtendidos(false);

const modalOverlay = document.getElementById('modalRespuestaOverlay')
const inputEvidencias = document.getElementById('inputEvidencias')
const fileDropMulti = document.getElementById('fileDropMulti')
const fileLabelMulti = document.getElementById('fileLabelMulti')
const listaArchivos = document.getElementById('listaArchivos')
let oficioRespId = null
let archivosSeleccionados = []

const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
const iconoTipo = tipo => tipo === 'application/pdf'
  ? `<span class="archivo-type-badge pdf">PDF</span>`
  : `<span class="archivo-type-badge img">IMG</span>`

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
              existentesList.innerHTML = arch.map(a => {
                const typeClass = a.tipo === 'application/pdf' ? 'archivo-chip-pdf' : 'archivo-chip-img';
                return `<a href="javascript:void(0)" onclick="openFileViewer('${a.url}', '${a.nombre}')" class="archivo-chip ${typeClass}">${iconoTipo(a.tipo)} <span>${a.nombre}</span></a>`;
              }).join('')
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