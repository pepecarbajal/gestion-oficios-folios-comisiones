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

// ── TAB / SIDEBAR ──
function cambiarTab(tab, e) {
  if (e) e.preventDefault()
  const tabMap = {
    'oficios-pendientes': { panel: 'tabOfPendientes', nav: 'navOfPendientes' },
    'oficios-atendidos': { panel: 'tabOfAtendidos', nav: 'navOfAtendidos' },
    'folios-pendientes': { panel: 'tabFolPendientes', nav: 'navFolPendientes' },
    'folios-atendidos': { panel: 'tabFolAtendidos', nav: 'navFolAtendidos' }
  }
  const allPanels = ['tabOfPendientes', 'tabOfAtendidos', 'tabFolPendientes', 'tabFolAtendidos']
  const allNavs = ['navOfPendientes', 'navOfAtendidos', 'navFolPendientes', 'navFolAtendidos']

  allPanels.forEach(pid => { document.getElementById(pid).style.display = 'none' })
  allNavs.forEach(nid => { document.getElementById(nid).classList.remove('active') })

  const target = tabMap[tab]
  if (target) {
    document.getElementById(target.panel).style.display = ''
    document.getElementById(target.nav).classList.add('active')
  }

  sessionStorage.setItem('uadActiveTab', tab)
}

let marcarEnteradoGuardando = false
async function marcarEnterado(oficioId) {
  if (marcarEnteradoGuardando) return
  marcarEnteradoGuardando = true
  try {
    const formData = new FormData()
    formData.append('comentario', '')
    const res = await fetch(`/oficios/${oficioId}/respuesta`, { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Error al marcar como enterado'); marcarEnteradoGuardando = false; return }
    window.location.reload()
  } catch {
    alert('Error de conexión.')
    marcarEnteradoGuardando = false
  }
}

// ── ACTION DROPDOWN LOGIC (OFICIOS) ──
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
      action: () => {
        fetch(`/oficios/${id}/visto`, { method: 'POST', headers: { 'CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content } }).catch(() => {})
        openFileViewer(data.archivoUrl, `Oficio ${data.noOficio}`)
      }
    });
  }

  const row = document.querySelector(`.oficio-row[data-id="${id}"]`);
  const isAtendido = row && row.classList.contains('atend-row');
  const yaRespondio = row && row.dataset.ya === 'true';
  const esConocimiento = data.modo === 1;
  const esCoResponsable = row && row.dataset.ecooresponsable === 'true';

  if (esCoResponsable) {
  menu.innerHTML = actions.length
    ? actions.map((a, index) => `
      <button class="dropdown-item" data-index="${index}">
        ${a.icon} <span>${a.label}</span>
      </button>
    `).join('')
    : '<div class="dropdown-item" style="cursor:default;color:#9ca3af;font-style:italic">Sin acciones disponibles</div>';

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-item');
    if (item && item.dataset.index !== undefined) {
      const index = item.dataset.index;
      actions[index].action();
      menu.remove();
      currentActionMenu = null;
    }
  });

    document.body.appendChild(menu);
    currentActionMenu = menu;
    return;
  }

  if (esConocimiento) {
    if (yaRespondio) {
      actions.push({
        label: 'Ver enterado',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
        action: () => {
          const comentario = row.dataset.comentario || '';
          const archivos = JSON.parse(row.dataset.archivos || '[]');
          abrirEvidencias(id, comentario, archivos);
        }
      });
    } else {
      actions.push({
        label: 'Enterado',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
        action: () => marcarEnterado(id)
      });
    }
  } else if (isAtendido) {
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

// ── FOLIO ACTION DROPDOWN ──
function toggleFolioActionMenu(e, id) {
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

  const dataEl = document.getElementById(`folio-data-${id}`);
  const data = dataEl ? JSON.parse(dataEl.textContent) : {};
  const row = document.querySelector(`.folio-row[data-id="${id}"]`);
  const estatus = row && row.dataset.estatus;
  const isAtendido = estatus === 'Atendido';
  const isCancelado = estatus === 'Cancelado';

  const actions = [];

  if ((isAtendido || isCancelado) && data.archivoUrl) {
    actions.push({
      label: 'Ver Oficio',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      action: () => openFileViewer(data.archivoUrl, `Folio ${data.noFolio}`)
    });
  }

  if (estatus === 'Pendiente') {
    actions.push({
      label: 'Registrar entrega',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      action: () => abrirModalEntrega(id)
    });
    actions.push({
      label: 'Cancelar folio',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      action: () => cancelarFolioUAD(id)
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

// ── PAGINATION ──
const PAGE_SIZE = 10;
let pageOfPend = 1;
let pageOfAtend = 1;
let pageFolPend = 1;
let pageFolAtend = 1;

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

// ── FILTERS: OFICIOS PENDIENTES ──
const searchPend = document.getElementById('searchPendientes')
const filterEstatusPend = document.getElementById('filterEstatusPend')

function filtrarPendientes(resetPage = true) {
  if (resetPage) pageOfPend = 1;

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
  if (pageOfPend > totalPages) pageOfPend = totalPages;
  const start = (pageOfPend - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  allRows.forEach(row => { row.style.display = 'none'; });
  filtered.slice(start, end).forEach(row => { row.style.display = ''; });

  renderPagination(total, pageOfPend, 'pageControlsPend', 'paginacionInfoPend', (np) => {
    pageOfPend = np;
    filtrarPendientes(false);
  });
}

if (searchPend) searchPend.addEventListener('input', () => filtrarPendientes(true));
if (filterEstatusPend) filterEstatusPend.addEventListener('change', () => filtrarPendientes(true));

// ── FILTERS: OFICIOS ATENDIDOS ──
const searchAtend = document.getElementById('searchAtendidos')
function filtrarAtendidos(resetPage = true) {
  if (resetPage) pageOfAtend = 1;

  const texto = searchAtend ? searchAtend.value.toLowerCase() : '';

  const allRows = Array.from(document.querySelectorAll('.atend-row'));
  const filtered = allRows.filter(row => {
    return !texto || row.dataset.search.includes(texto);
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (pageOfAtend > totalPages) pageOfAtend = totalPages;
  const start = (pageOfAtend - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  allRows.forEach(row => { row.style.display = 'none'; });
  filtered.slice(start, end).forEach(row => { row.style.display = ''; });

  renderPagination(total, pageOfAtend, 'pageControlsAtend', 'paginacionInfoAtend', (np) => {
    pageOfAtend = np;
    filtrarAtendidos(false);
  });
}

if (searchAtend) searchAtend.addEventListener('input', () => filtrarAtendidos(true));

// ── FILTERS: FOLIOS PENDIENTES ──
const searchFolPend = document.getElementById('searchFolPend')

function filtrarFolPend(resetPage = true) {
  if (resetPage) pageFolPend = 1;
  const texto = searchFolPend ? searchFolPend.value.toLowerCase() : '';
  const allRows = Array.from(document.querySelectorAll('.fol-pend-row'));
  const filtered = allRows.filter(row => !texto || row.dataset.search.includes(texto));
  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (pageFolPend > totalPages) pageFolPend = totalPages;
  const start = (pageFolPend - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  allRows.forEach(row => { row.style.display = 'none'; });
  filtered.slice(start, end).forEach(row => { row.style.display = ''; });
  renderPagination(total, pageFolPend, 'pageControlsFolPend', 'paginacionInfoFolPend', (np) => {
    pageFolPend = np;
    filtrarFolPend(false);
  });
}

if (searchFolPend) searchFolPend.addEventListener('input', () => filtrarFolPend(true));

// ── FILTERS: FOLIOS ATENDIDOS ──
const searchFolAtend = document.getElementById('searchFolAtend')

function filtrarFolAtend(resetPage = true) {
  if (resetPage) pageFolAtend = 1;
  const texto = searchFolAtend ? searchFolAtend.value.toLowerCase() : '';
  const allRows = Array.from(document.querySelectorAll('.fol-atend-row'));
  const filtered = allRows.filter(row => !texto || row.dataset.search.includes(texto));
  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (pageFolAtend > totalPages) pageFolAtend = totalPages;
  const start = (pageFolAtend - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  allRows.forEach(row => { row.style.display = 'none'; });
  filtered.slice(start, end).forEach(row => { row.style.display = ''; });
  renderPagination(total, pageFolAtend, 'pageControlsFolAtend', 'paginacionInfoFolAtend', (np) => {
    pageFolAtend = np;
    filtrarFolAtend(false);
  });
}

if (searchFolAtend) searchFolAtend.addEventListener('input', () => filtrarFolAtend(true));

// ── CANCELAR FOLIO ──
let cancelarFolioUADGuardando = false
async function cancelarFolioUAD(id) {
  if (cancelarFolioUADGuardando) return
  cancelarFolioUADGuardando = true
  if (!confirm('¿Estás seguro de cancelar este folio? Esta acción no se puede deshacer.')) { cancelarFolioUADGuardando = false; return; }
  try {
    const res = await fetch(`/folios/${id}/cancelar`, { method: 'PUT' })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Error al cancelar folio.'); cancelarFolioUADGuardando = false; return }
    window.location.reload()
  } catch {
    alert('Error de conexión.')
    cancelarFolioUADGuardando = false
  }
}

// ── INIT ──
filtrarPendientes(false);
filtrarAtendidos(false);
filtrarFolPend(false);
filtrarFolAtend(false);

const savedTabUAD = sessionStorage.getItem('uadActiveTab')
if (savedTabUAD) cambiarTab(savedTabUAD, null)

// ── MODAL RESPUESTA (oficios) ──
const modalOverlay = document.getElementById('modalRespuestaOverlay')
const inputEvidencias = document.getElementById('inputEvidencias')
const fileDropMulti = document.getElementById('fileDropMulti')
const fileLabelMulti = document.getElementById('fileLabelMulti')
const listaArchivos = document.getElementById('listaArchivos')
let oficioRespId = null
let archivosSeleccionados = []
let respuestaGuardando = false

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
  if (respuestaGuardando) return
  respuestaGuardando = true
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
    respuestaGuardando = false
  }
})

// ── MODAL SOLICITAR FOLIO ──
const modalSolicitarFolioOverlay = document.getElementById('modalSolicitarFolioOverlay')
let folioSolicitarGuardando = false

function abrirModalSolicitarFolio() {
  document.getElementById('inputFolDestinatario').value = ''
  document.getElementById('inputFolDependencia').value = ''
  document.getElementById('inputFolCargo').value = ''
  document.getElementById('inputFolAsunto').value = ''
  document.getElementById('modalSolicitarFolioError').textContent = ''
  modalSolicitarFolioOverlay.classList.add('active')
}

function cerrarModalSolicitarFolio() {
  modalSolicitarFolioOverlay.classList.remove('active')
  folioSolicitarGuardando = false
}

document.getElementById('modalSolicitarFolioClose').addEventListener('click', cerrarModalSolicitarFolio)
document.getElementById('btnSolicitarFolioCancelar').addEventListener('click', cerrarModalSolicitarFolio)
modalSolicitarFolioOverlay.addEventListener('click', e => { if (e.target === modalSolicitarFolioOverlay) cerrarModalSolicitarFolio() })

document.getElementById('btnSolicitarFolioGuardar').addEventListener('click', async () => {
  if (folioSolicitarGuardando) return
  folioSolicitarGuardando = true

  const destinatario = document.getElementById('inputFolDestinatario').value.trim()
  const dependencia = document.getElementById('inputFolDependencia').value.trim()
  const cargo = document.getElementById('inputFolCargo').value.trim()
  const asunto = document.getElementById('inputFolAsunto').value.trim()
  const errorEl = document.getElementById('modalSolicitarFolioError')

  if (!destinatario || !dependencia || !cargo || !asunto) {
    errorEl.textContent = 'Todos los campos son obligatorios.'
    folioSolicitarGuardando = false
    return
  }

  document.getElementById('btnSolicitarFolioText').style.display = 'none'
  document.getElementById('btnSolicitarFolioLoader').style.display = 'inline-block'
  errorEl.textContent = ''

  try {
    const res = await fetch('/folios/uad', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinatario, dependencia, cargo, asunto })
    })
    const data = await res.json()
    if (!res.ok) { errorEl.textContent = data.error || 'Error al solicitar folio.'; return }
    cerrarModalSolicitarFolio()
    window.location.reload()
  } catch {
    errorEl.textContent = 'Error de conexión.'
  } finally {
    document.getElementById('btnSolicitarFolioText').style.display = ''
    document.getElementById('btnSolicitarFolioLoader').style.display = 'none'
    folioSolicitarGuardando = false
  }
})

// ── MODAL REGISTRAR ENTREGA ──
const modalEntregaOverlay = document.getElementById('modalEntregaOverlay')
let entregaFolioId = null
let entregaArchivo = null
let entregaGuardando = false

function abrirModalEntrega(folioId) {
  entregaFolioId = folioId
  entregaArchivo = null
  document.getElementById('inputFechaEntrega').value = new Date().toISOString().split('T')[0]
  document.getElementById('inputEntregaComentario').value = ''
  document.getElementById('modalEntregaError').textContent = ''
  document.getElementById('fileLabelEntrega').textContent = 'Arrastra el PDF aquí o haz clic para seleccionar'
  document.getElementById('listaArchivosEntrega').innerHTML = ''
  modalEntregaOverlay.classList.add('active')
}

function cerrarModalEntrega() {
  modalEntregaOverlay.classList.remove('active')
  entregaFolioId = null
  entregaArchivo = null
  entregaGuardando = false
}

document.getElementById('modalEntregaClose').addEventListener('click', cerrarModalEntrega)
document.getElementById('btnEntregaCancelar').addEventListener('click', cerrarModalEntrega)
modalEntregaOverlay.addEventListener('click', e => { if (e.target === modalEntregaOverlay) cerrarModalEntrega() })

const fileDropEntrega = document.getElementById('fileDropEntrega')
const inputEntregaPDF = document.getElementById('inputEntregaPDF')
const fileLabelEntrega = document.getElementById('fileLabelEntrega')

fileDropEntrega.addEventListener('click', () => inputEntregaPDF.click())
inputEntregaPDF.addEventListener('change', () => {
  if (inputEntregaPDF.files.length > 0) {
    const file = inputEntregaPDF.files[0]
    if (file.type !== 'application/pdf') {
      document.getElementById('modalEntregaError').textContent = 'Solo se permiten archivos PDF.'
      return
    }
    entregaArchivo = file
    fileLabelEntrega.textContent = file.name
    fileDropEntrega.classList.add('drag-over')
    document.getElementById('listaArchivosEntrega').innerHTML =
      `<div class="archivo-chip-selected"><span class="archivo-type-badge pdf">PDF</span><span>${file.name}</span><button class="chip-remove" onclick="eliminarEntregaPDF()">&times;</button></div>`
  }
})
fileDropEntrega.addEventListener('dragover', e => { e.preventDefault(); fileDropEntrega.classList.add('drag-over') })
fileDropEntrega.addEventListener('dragleave', () => fileDropEntrega.classList.remove('drag-over'))
fileDropEntrega.addEventListener('drop', e => {
  e.preventDefault()
  fileDropEntrega.classList.remove('drag-over')
  if (e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0]
    if (file.type !== 'application/pdf') {
      document.getElementById('modalEntregaError').textContent = 'Solo se permiten archivos PDF.'
      return
    }
    entregaArchivo = file
    fileLabelEntrega.textContent = file.name
    fileDropEntrega.classList.add('drag-over')
    inputEntregaPDF.files = e.dataTransfer.files
    document.getElementById('listaArchivosEntrega').innerHTML =
      `<div class="archivo-chip-selected"><span class="archivo-type-badge pdf">PDF</span><span>${file.name}</span><button class="chip-remove" onclick="eliminarEntregaPDF()">&times;</button></div>`
  }
})

function eliminarEntregaPDF() {
  entregaArchivo = null
  inputEntregaPDF.value = ''
  fileLabelEntrega.textContent = 'Arrastra el PDF aquí o haz clic para seleccionar'
  fileDropEntrega.classList.remove('drag-over')
  document.getElementById('listaArchivosEntrega').innerHTML = ''
}

document.getElementById('btnEntregaGuardar').addEventListener('click', async () => {
  if (entregaGuardando) return
  entregaGuardando = true

  const fechaEntrega = document.getElementById('inputFechaEntrega').value
  const comentario = document.getElementById('inputEntregaComentario').value.trim()
  const errorEl = document.getElementById('modalEntregaError')

  if (!fechaEntrega) {
    errorEl.textContent = 'La fecha de entrega es obligatoria.'
    entregaGuardando = false
    return
  }

  document.getElementById('btnEntregaText').style.display = 'none'
  document.getElementById('btnEntregaLoader').style.display = 'inline-block'
  errorEl.textContent = ''

  try {
    const formData = new FormData()
    formData.append('fechaEntrega', fechaEntrega)
    formData.append('comentario', comentario)
    if (entregaArchivo) formData.append('archivo', entregaArchivo)
    const res = await fetch(`/folios/${entregaFolioId}/entrega`, { method: 'PUT', body: formData })
    const data = await res.json()
    if (!res.ok) { errorEl.textContent = data.error || 'Error al registrar entrega.'; return }
    cerrarModalEntrega()
    window.location.reload()
  } catch {
    errorEl.textContent = 'Error de conexión.'
  } finally {
    document.getElementById('btnEntregaText').style.display = ''
    document.getElementById('btnEntregaLoader').style.display = 'none'
    entregaGuardando = false
  }
})
