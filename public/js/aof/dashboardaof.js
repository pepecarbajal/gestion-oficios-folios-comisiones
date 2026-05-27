let oficioRegistrarGuardando = false

const modalRespOverlay = document.getElementById('modalRespuestasOverlay')
const listaRespModal = document.getElementById('listaRespuestasModal')

const iconoArchivoModal = tipo => tipo === 'application/pdf'
  ? `<span class="archivo-type-badge pdf">PDF</span>`
  : `<span class="archivo-type-badge img">IMG</span>`

function renderCardRespuesta(r) {
  const esAclaracion = r.esAclaracion === true
  const fecha = new Date(r.fechaAtendido).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'})
  const comentario = r.comentario
    ? `<p class="resp-comentario${esAclaracion ? ' aclaracion-text' : ''}">"${r.comentario}"</p>`
    : ''
  const archivos = (r.archivos || []).length > 0
    ? `<div class="resp-archivos">${(r.archivos).map(a => {
          const typeClass = a.tipo === 'application/pdf' ? 'archivo-chip-pdf' : 'archivo-chip-img';
          return `<a href="javascript:void(0)" onclick="openFileViewer('${a.url}', '${a.nombre}')" class="archivo-chip ${typeClass}">${iconoArchivoModal(a.tipo)} <span>${a.nombre}</span></a>`;
        }).join('')}</div>`
    : ''
  const hasCuerpo = r.comentario || (r.archivos && r.archivos.length > 0)
  const itemClass = esAclaracion ? 'respuesta-item aclaracion-item' : 'respuesta-item'
  const aliasHtml = esAclaracion
    ? `<span class="resp-alias aclaracion-label">Nota aclaratoria</span>`
    : `<span class="resp-alias">${r.unidadAlias || '—'}</span>`
  return `
    <div class="${itemClass}">
      <div class="respuesta-body">
        <div class="respuesta-header">
          ${aliasHtml}
          <span class="resp-fecha">${fecha}</span>
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
    ? `${respuestas.map(renderCardRespuesta).join('')}`
    : '<p style="color:#9ca3af;font-size:0.85rem;font-style:italic;text-align:center;padding:20px 0">Sin respuestas registradas.</p>'
  modalRespOverlay.classList.add('active')
}

document.getElementById('modalRespuestasClose').addEventListener('click', () => modalRespOverlay.classList.remove('active'))
document.getElementById('btnRespuestasCerrar').addEventListener('click', () => modalRespOverlay.classList.remove('active'))
modalRespOverlay.addEventListener('click', e => { if (e.target === modalRespOverlay) modalRespOverlay.classList.remove('active') })

// ── TAB / SIDEBAR ──
function cambiarTab(tab, e) {
  if (e) e.preventDefault()
  const tabMap = {
    'oficios-pendientes': { panel: 'tabOfPendientesAof', nav: 'navOfPendientesAof', section: 'OficiosAof' },
    'oficios-atendidos': { panel: 'tabOfAtendidosAof', nav: 'navOfAtendidosAof', section: 'OficiosAof' },
    'folios-pendientes': { panel: 'tabFolPendientesAof', nav: 'navFolPendientesAof', section: 'FoliosAof' },
    'folios-atendidos': { panel: 'tabFolAtendidosAof', nav: 'navFolAtendidosAof', section: 'FoliosAof' },
    'mi-pendientes': { panel: 'tabMiPendientesAof', nav: 'navMiPendientesAof', section: 'MiUnidad' },
    'mi-atendidos': { panel: 'tabMiAtendidosAof', nav: 'navMiAtendidosAof', section: 'MiUnidad' },
    'mi-fol-pendientes': { panel: 'tabMiFolPendientesAof', nav: 'navMiFolPendientesAof', section: 'MiUnidad' },
    'mi-fol-atendidos': { panel: 'tabMiFolAtendidosAof', nav: 'navMiFolAtendidosAof', section: 'MiUnidad' }
  }

  const allPanelIds = ['tabOfPendientesAof', 'tabOfAtendidosAof', 'tabFolPendientesAof', 'tabFolAtendidosAof', 'tabMiPendientesAof', 'tabMiAtendidosAof', 'tabMiFolPendientesAof', 'tabMiFolAtendidosAof']
  const allNavIds = ['navOfPendientesAof', 'navOfAtendidosAof', 'navFolPendientesAof', 'navFolAtendidosAof', 'navMiPendientesAof', 'navMiAtendidosAof', 'navMiFolPendientesAof', 'navMiFolAtendidosAof']

  allPanelIds.forEach(pid => { const el = document.getElementById(pid); if (el) el.style.display = 'none' })
  allNavIds.forEach(nid => { const el = document.getElementById(nid); if (el) el.classList.remove('active') })

  const target = tabMap[tab]
  if (target) {
    const panel = document.getElementById(target.panel)
    const nav = document.getElementById(target.nav)
    if (panel) panel.style.display = ''
    if (nav) nav.classList.add('active')
  }

  sessionStorage.setItem('aofActiveTab', tab)
}

// ── ACTION DROPDOWN LOGIC ──
let currentActionMenu = null;

function toggleActionMenu(e, id) {
  e.stopPropagation();
  
  // Close existing menu
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

  // Actions based on data
  const actions = [];
  if (data.archivoUrl) {
    actions.push({
      label: 'Ver oficio',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      action: () => openFileViewer(data.archivoUrl, `Oficio ${data.noOficio}`)
    });
  }

  // Check if it has responses (use window.__respuestas if available)
  const respuestas = (window.__respuestas && window.__respuestas[id]) || [];
  if (respuestas.length > 0) {
    actions.push({
      label: 'Ver respuestas',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      action: () => {
        const btnFake = document.createElement('button');
        btnFake.dataset.oficioId = id;
        abrirModalRespuestas(btnFake);
      }
    });
  }

  actions.push({
    label: 'Editar',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    action: () => abrirModalEditar(data)
  });

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
let pageOf = 1;
let pageAt = 1;

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

const searchOf = document.getElementById('searchOficios')
const filterEstatusOf = document.getElementById('filterEstatusOf')
const filterUnidadOf = document.getElementById('filterUnidadOf')

function filtrarOficios(resetPage = true) {
  if (resetPage) pageOf = 1;

  const texto = searchOf.value.toLowerCase();
  const estatus = filterEstatusOf.value;
  const unidad = filterUnidadOf.value;

  const allRows = Array.from(document.querySelectorAll('.of-row'));
  const filtered = allRows.filter(row => {
    const matchTexto = !texto || row.dataset.search.includes(texto);
    const matchEstatus = !estatus || row.dataset.estatus === estatus;
    const matchUnidad = !unidad || (row.dataset.unidad || '').includes(unidad);
    return matchTexto && matchEstatus && matchUnidad;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (pageOf > totalPages) pageOf = totalPages;
  const start = (pageOf - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  allRows.forEach(row => { row.style.display = 'none'; });
  filtered.slice(start, end).forEach(row => { row.style.display = ''; });

  document.querySelectorAll('.respuestas-row').forEach(r => { r.style.display = 'none'; });

  renderPagination(total, pageOf, 'pageControlsOf', 'paginacionInfoOf', (np) => {
    pageOf = np;
    filtrarOficios(false);
  });
}

searchOf.addEventListener('input', () => filtrarOficios(true));
filterEstatusOf.addEventListener('change', () => filtrarOficios(true));
filterUnidadOf.addEventListener('change', () => filtrarOficios(true));

const searchAt = document.getElementById('searchAtendidos')
const filterUnidadAt = document.getElementById('filterUnidadAt')

function filtrarAtendidos(resetPage = true) {
  if (resetPage) pageAt = 1;

  const texto = searchAt ? searchAt.value.toLowerCase() : '';
  const unidad = filterUnidadAt ? filterUnidadAt.value : '';

  const allRows = Array.from(document.querySelectorAll('.at-row'));
  const filtered = allRows.filter(row => {
    const matchTexto = !texto || row.dataset.search.includes(texto);
    const matchUnidad = !unidad || (row.dataset.unidad || '').includes(unidad);
    return matchTexto && matchUnidad;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (pageAt > totalPages) pageAt = totalPages;
  const start = (pageAt - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;

  allRows.forEach(row => { row.style.display = 'none'; });
  filtered.slice(start, end).forEach(row => { row.style.display = ''; });

  renderPagination(total, pageAt, 'pageControlsAt', 'paginacionInfoAt', (np) => {
    pageAt = np;
    filtrarAtendidos(false);
  });
}

if (searchAt) searchAt.addEventListener('input', () => filtrarAtendidos(true));
if (filterUnidadAt) filterUnidadAt.addEventListener('change', () => filtrarAtendidos(true));

filtrarOficios(false);
filtrarAtendidos(false);

// ── FOLIO PAGINATION ──
let pageFolPendAof = 1;
let pageFolAtendAof = 1;

function filtrarFolPendAof(resetPage = true) {
  if (resetPage) pageFolPendAof = 1;
  const searchEl = document.getElementById('searchFolPendAof')
  const texto = searchEl ? searchEl.value.toLowerCase() : '';
  const allRows = Array.from(document.querySelectorAll('.fol-pend-row-aof'));
  const filtered = allRows.filter(row => !texto || row.dataset.search.includes(texto));
  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (pageFolPendAof > totalPages) pageFolPendAof = totalPages;
  const start = (pageFolPendAof - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  allRows.forEach(row => { row.style.display = 'none'; });
  filtered.slice(start, end).forEach(row => { row.style.display = ''; });
  renderPagination(total, pageFolPendAof, 'pageControlsFolPendAof', 'paginacionInfoFolPendAof', (np) => {
    pageFolPendAof = np;
    filtrarFolPendAof(false);
  });
}

function filtrarFolAtendAof(resetPage = true) {
  if (resetPage) pageFolAtendAof = 1;
  const searchEl = document.getElementById('searchFolAtendAof')
  const texto = searchEl ? searchEl.value.toLowerCase() : '';
  const allRows = Array.from(document.querySelectorAll('.fol-atend-row-aof'));
  const filtered = allRows.filter(row => !texto || row.dataset.search.includes(texto));
  const total = filtered.length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;
  if (pageFolAtendAof > totalPages) pageFolAtendAof = totalPages;
  const start = (pageFolAtendAof - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  allRows.forEach(row => { row.style.display = 'none'; });
  filtered.slice(start, end).forEach(row => { row.style.display = ''; });
  renderPagination(total, pageFolAtendAof, 'pageControlsFolAtendAof', 'paginacionInfoFolAtendAof', (np) => {
    pageFolAtendAof = np;
    filtrarFolAtendAof(false);
  });
}

document.getElementById('searchFolPendAof')?.addEventListener('input', () => filtrarFolPendAof(true));
document.getElementById('searchFolAtendAof')?.addEventListener('input', () => filtrarFolAtendAof(true));

filtrarFolPendAof(false);
filtrarFolAtendAof(false);

// ── CANCELAR FOLIO ──
let cancelarFolioAOFGuardando = false
async function cancelarFolioAOF(id) {
  if (cancelarFolioAOFGuardando) return
  cancelarFolioAOFGuardando = true
  if (!confirm('¿Estás seguro de cancelar este folio? Esta acción no se puede deshacer.')) { cancelarFolioAOFGuardando = false; return; }
  try {
    const res = await fetch(`/folios/${id}/cancelar`, { method: 'PUT' })
    const data = await res.json()
    if (!res.ok) { alert(data.error || 'Error al cancelar folio.'); cancelarFolioAOFGuardando = false; return }
    window.location.reload()
  } catch {
    alert('Error de conexión.')
    cancelarFolioAOFGuardando = false
  }
}

const savedTabAOF = sessionStorage.getItem('aofActiveTab')
if (savedTabAOF) cambiarTab(savedTabAOF, null)

// ── FOLIO ACTION DROPDOWN (AOF) ──
function toggleFolioActionMenuAof(e, id) {
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

  const dataEl = document.getElementById(`folio-data-aof-${id}`);
  const data = dataEl ? JSON.parse(dataEl.textContent) : {};
  const row = document.querySelector(`.folio-row-aof[data-id="${id}"]`);
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
      label: 'Cancelar folio',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      action: () => cancelarFolioAOF(id)
    });
  }

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
}

// ── MODAL REGISTRAR FOLIO (AOF) ──
const modalRegFolioAof = document.getElementById('modalRegistrarFolioAofOverlay')
let _folioAofUnidadIds = []
let _folioAofSelectorTempIds = []
let folioAofGuardando = false

function abrirModalRegistrarFolioAof() {
  document.getElementById('inputFolAofNoFolio').value = ''
  document.getElementById('inputFolAofDestinatario').value = ''
  document.getElementById('inputFolAofDependencia').value = ''
  document.getElementById('inputFolAofCargo').value = ''
  document.getElementById('inputFolAofAsunto').value = ''
  document.getElementById('modalRegistrarFolioAofError').textContent = ''
  _folioAofUnidadIds = []
  document.getElementById('btnFolAofUnidadText').textContent = 'Seleccionar unidades'
  modalRegFolioAof.classList.add('active')

  fetch('/folios/next').then(r => r.json()).then(data => {
    if (data.noFolio) document.getElementById('inputFolAofNoFolio').value = data.noFolio
  }).catch(() => {})
}

function cerrarModalRegistrarFolioAof() {
  modalRegFolioAof.classList.remove('active')
  _folioAofUnidadIds = []
  _folioAofSelectorTempIds = []
  folioAofGuardando = false
}

document.getElementById('modalRegistrarFolioAofClose').addEventListener('click', cerrarModalRegistrarFolioAof)
document.getElementById('btnRegistrarFolioAofCancelar').addEventListener('click', cerrarModalRegistrarFolioAof)
modalRegFolioAof.addEventListener('click', e => { if (e.target === modalRegFolioAof) cerrarModalRegistrarFolioAof() })

// Folio AOF unit selector (reuses same modal but with different data)
function abrirSelectorUnidadesFolios() {
  _folioAofSelectorTempIds = [..._folioAofUnidadIds]
  // Render the same selector list
  const list = document.getElementById('selectorList')
  if (!list.children.length) {
    // If selector items don't exist yet (first time), they should have been rendered server-side
  }
  refreshSelectorSelectionFolios()
  document.getElementById('searchUnidadesSelector').value = ''
  renderSelectorItems()
  document.getElementById('modalSelectorUnidades').classList.add('active')
  // Override the aplicar function temporarily
  const originalAplicar = document.getElementById('btnSelectorAplicar').onclick
  document.getElementById('btnSelectorAplicar').onclick = () => {
    _folioAofUnidadIds = [..._folioAofSelectorTempIds]
    const count = _folioAofUnidadIds.length
    const btnText = document.getElementById('btnFolAofUnidadText')
    if (count === 0) {
      btnText.textContent = 'Seleccionar unidades'
    } else if (count === 1) {
      const item = document.querySelector(`#selectorList [data-value="${_folioAofUnidadIds[0]}"]`)
      const alias = item ? item.dataset.alias || item.querySelector('.selector-item-text')?.textContent?.trim() : _folioAofUnidadIds[0]
      btnText.textContent = `1 unidad: ${alias}`
    } else {
      btnText.textContent = `${count} unidades`
    }
    document.getElementById('modalSelectorUnidades').classList.remove('active')
    document.getElementById('btnSelectorAplicar').onclick = aplicarSelectorUnidades // restore
  }
}

function refreshSelectorSelectionFolios() {
  const todasItem = document.querySelector('#selectorList [data-value="__TODAS__"]')
  const items = document.querySelectorAll('#selectorList .selector-item:not([data-value="__TODAS__"])')
  const tempSet = new Set(_folioAofSelectorTempIds)
  const allSelected = Array.from(items).every(item => tempSet.has(item.dataset.value))
  if (todasItem) todasItem.classList.toggle('selected', allSelected)
  items.forEach(item => item.classList.toggle('selected', tempSet.has(item.dataset.value)))
}

// Intercept selector list clicks for folio context
document.getElementById('selectorList').addEventListener('click', e => {
  // If folio selector is open, use its state
  if (modalRegFolioAof.classList.contains('active')) {
    const item = e.target.closest('.selector-item')
    if (!item) return
    const value = item.dataset.value
    if (value === '__TODAS__') {
      const items = document.querySelectorAll('#selectorList .selector-item:not([data-value="__TODAS__"])')
      const currentlyAll = _folioAofSelectorTempIds.length === items.length
      _folioAofSelectorTempIds = currentlyAll ? [] : Array.from(items).map(it => it.dataset.value)
    } else {
      const idx = _folioAofSelectorTempIds.indexOf(value)
      if (idx >= 0) _folioAofSelectorTempIds.splice(idx, 1)
      else _folioAofSelectorTempIds.push(value)
    }
    refreshSelectorSelectionFolios()
    return
  }
  // Otherwise use the original toggle (the one registered earlier still handles it via capture)
})

document.getElementById('btnRegistrarFolioAofGuardar').addEventListener('click', async () => {
  if (folioAofGuardando) return
  folioAofGuardando = true

  const noFolio = document.getElementById('inputFolAofNoFolio').value.trim()
  const destinatario = document.getElementById('inputFolAofDestinatario').value.trim()
  const dependencia = document.getElementById('inputFolAofDependencia').value.trim()
  const cargo = document.getElementById('inputFolAofCargo').value.trim()
  const asunto = document.getElementById('inputFolAofAsunto').value.trim()
  const errorEl = document.getElementById('modalRegistrarFolioAofError')

  if (!noFolio || !destinatario || !dependencia || !cargo || !asunto) {
    errorEl.textContent = 'Todos los campos son obligatorios.'
    folioAofGuardando = false
    return
  }
  if (!/^\d{4}$/.test(noFolio)) {
    errorEl.textContent = 'El número de folio debe tener exactamente 4 dígitos.'
    folioAofGuardando = false
    return
  }
  if (_folioAofUnidadIds.length === 0) {
    errorEl.textContent = 'Debe seleccionar al menos una unidad.'
    folioAofGuardando = false
    return
  }

  document.getElementById('btnRegistrarFolioAofText').style.display = 'none'
  document.getElementById('btnRegistrarFolioAofLoader').style.display = 'inline-block'
  errorEl.textContent = ''

  try {
    const res = await fetch('/folios/aof', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ noFolio, destinatario, dependencia, cargo, asunto, unidadIds: _folioAofUnidadIds })
    })
    const data = await res.json()
    if (!res.ok) { errorEl.textContent = data.error || 'Error al registrar folio.'; return }
    cerrarModalRegistrarFolioAof()
    window.location.reload()
  } catch {
    errorEl.textContent = 'Error de conexión.'
  } finally {
    document.getElementById('btnRegistrarFolioAofText').style.display = ''
    document.getElementById('btnRegistrarFolioAofLoader').style.display = 'none'
    folioAofGuardando = false
  }
})

// ── FILE DROP NUEVO OFICIO ──
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

// ── SELECTOR MODAL DE UNIDADES ──
// Each context (create/edit) has its own snapshot of selected IDs
let _unidadesSeleccionadas = []
let _cooresponsablesSeleccionadas = []
let _selectorContext = null // 'create-resp' | 'create-cooresp' | 'edit-resp' | 'edit-cooresp'
let _selectorTempIds = []

function updateUnidadesButton (context) {
  const isCreate = context.startsWith('create')
  const isResp = context.endsWith('-resp')
  const textId = isCreate
    ? (isResp ? 'btnUnidadesText' : 'btnCoorespText')
    : (isResp ? 'btnEditUnidadesText' : 'btnEditCoorespText')
  const countId = isCreate
    ? (isResp ? 'btnUnidadesCount' : 'btnCoorespCount')
    : (isResp ? 'btnEditUnidadesCount' : 'btnEditCoorespCount')
  const ids = isCreate
    ? (isResp ? _unidadesSeleccionadas : _cooresponsablesSeleccionadas)
    : (isResp ? _unidadesSeleccionadas : _cooresponsablesSeleccionadas)
  const textEl = document.getElementById(textId)
  const countEl = document.getElementById(countId)
  if (!textEl) return

  if (ids.length === 0) {
    textEl.textContent = isResp ? 'Seleccionar unidades' : 'Seleccionar co-responsables'
    if (countEl) { countEl.textContent = ''; countEl.style.display = 'none' }
  } else {
    const aliases = ids.map(id => {
      const item = document.querySelector(`#selectorList [data-value="${id}"]`)
      return item ? item.dataset.alias || item.querySelector('.selector-item-text')?.textContent?.trim() : id
    })
    if (ids.length === 1) {
      textEl.textContent = `1 unidad: ${aliases[0]}`
    } else {
      textEl.textContent = `${ids.length} unidades`
    }
    if (countEl) { countEl.textContent = ids.length; countEl.style.display = '' }
  }
}

function renderSelectorItems () {
  const query = (document.getElementById('searchUnidadesSelector').value || '').toLowerCase().trim()
  const items = document.querySelectorAll('#selectorList .selector-item')
  let visibleCount = 0
  const emptyEl = document.getElementById('selectorEmpty')

  items.forEach(item => {
    if (item.dataset.value === '__TODAS__') {
      item.style.display = ''
      visibleCount++
      return
    }
    const search = (item.dataset.search || '').toLowerCase()
    const match = !query || search.includes(query)
    item.style.display = match ? '' : 'none'
    if (match) visibleCount++
  })

  emptyEl.style.display = visibleCount === 0 ? '' : 'none'
}

function refreshSelectorSelection () {
  const todasItem = document.querySelector('#selectorList [data-value="__TODAS__"]')
  const items = document.querySelectorAll('#selectorList .selector-item:not([data-value="__TODAS__"])')
  const tempSet = new Set(_selectorTempIds)

  // Check "TODAS" if all selected, else uncheck
  const allSelected = Array.from(items).every(item => tempSet.has(item.dataset.value))
  if (todasItem) {
    todasItem.classList.toggle('selected', allSelected)
  }

  items.forEach(item => {
    item.classList.toggle('selected', tempSet.has(item.dataset.value))
  })
}

function toggleSelectorItem (value) {
  if (value === '__TODAS__') {
    const items = document.querySelectorAll('#selectorList .selector-item:not([data-value="__TODAS__"])')
    const todasItem = document.querySelector('#selectorList [data-value="__TODAS__"]')
    const currentlyAll = todasItem && todasItem.classList.contains('selected')
    if (currentlyAll) {
      _selectorTempIds = []
    } else {
      _selectorTempIds = Array.from(items).map(item => item.dataset.value)
    }
    refreshSelectorSelection()
    return
  }

  const idx = _selectorTempIds.indexOf(value)
  if (idx >= 0) {
    _selectorTempIds.splice(idx, 1)
  } else {
    _selectorTempIds.push(value)
  }
  refreshSelectorSelection()
}

function abrirSelectorUnidades (context) {
  _selectorContext = context
  const isCreate = context.startsWith('create')
  const isResp = context.endsWith('-resp')
  _selectorTempIds = [...(isCreate
    ? (isResp ? _unidadesSeleccionadas : _cooresponsablesSeleccionadas)
    : (isResp ? _unidadesSeleccionadas : _cooresponsablesSeleccionadas))]
  refreshSelectorSelection()
  document.getElementById('searchUnidadesSelector').value = ''
  renderSelectorItems()
  document.getElementById('modalSelectorUnidades').classList.add('active')
}

function cerrarSelectorUnidades (cancel) {
  document.getElementById('modalSelectorUnidades').classList.remove('active')
  _selectorContext = null
  if (cancel) _selectorTempIds = []
}

function aplicarSelectorUnidades () {
  const isResp = _selectorContext.endsWith('-resp')
  if (isResp) {
    _unidadesSeleccionadas = [..._selectorTempIds]
  } else {
    _cooresponsablesSeleccionadas = [..._selectorTempIds]
  }
  updateUnidadesButton(_selectorContext)
  cerrarSelectorUnidades(false)
}

// ── Eventos del modal selector ──
document.getElementById('modalSelectorClose').addEventListener('click', () => cerrarSelectorUnidades(true))
document.getElementById('btnSelectorCancelar').addEventListener('click', () => cerrarSelectorUnidades(true))
document.getElementById('btnSelectorAplicar').addEventListener('click', aplicarSelectorUnidades)
document.getElementById('modalSelectorUnidades').addEventListener('click', e => {
  if (e.target === e.currentTarget) cerrarSelectorUnidades(true)
})

document.getElementById('searchUnidadesSelector').addEventListener('input', renderSelectorItems)

document.getElementById('selectorList').addEventListener('click', e => {
  if (modalRegFolioAof.classList.contains('active')) return
  const item = e.target.closest('.selector-item')
  if (!item) return
  toggleSelectorItem(item.dataset.value)
})

// ── Botones que abren el selector ──
document.getElementById('btnSelectUnidades').addEventListener('click', () => abrirSelectorUnidades('create-resp'))
document.getElementById('btnEditSelectUnidades').addEventListener('click', () => abrirSelectorUnidades('edit-resp'))
document.getElementById('btnSelectCooresponsables').addEventListener('click', () => abrirSelectorUnidades('create-cooresp'))
document.getElementById('btnEditSelectCooresponsables').addEventListener('click', () => abrirSelectorUnidades('edit-cooresp'))

const cerrarModal = () => {
  modalOverlay.classList.remove('active')
  document.getElementById('modalOficioError').textContent = ''
  ;['inputNoOficio','inputFechaOficio','inputFechaRecibo','inputFechaLimite',
    'inputAsunto','inputRemitente','inputCargo','inputDependencia'].forEach(id => {
    document.getElementById(id).value = ''
  })
  _unidadesSeleccionadas = []
  _cooresponsablesSeleccionadas = []
  updateUnidadesButton('create-resp')
  updateUnidadesButton('create-cooresp')
  const chk = document.getElementById('inputEsCorreo')
  if (chk) chk.checked = false
  const chkModo = document.getElementById('inputEsConocimiento')
  if (chkModo) chkModo.checked = false
  toggleCoorespRow()
  updateFileDropUI(null)
}

function toggleCoorespRow () {
  const isConocimiento = document.getElementById('inputEsConocimiento')?.checked
  const regRow = document.getElementById('rowCooresponsablesReg')
  const editRow = document.getElementById('rowCooresponsablesEdit')
  if (regRow) regRow.style.display = isConocimiento ? 'none' : ''
  if (editRow) editRow.style.display = isConocimiento ? 'none' : ''
}

document.getElementById('inputEsConocimiento')?.addEventListener('change', toggleCoorespRow)

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
  if (oficioRegistrarGuardando) return
  oficioRegistrarGuardando = true
  const noOficio = document.getElementById('inputNoOficio').value.trim()
  const fechaOficio = document.getElementById('inputFechaOficio').value
  const fechaRecibo = document.getElementById('inputFechaRecibo').value
  const fechaLimite = document.getElementById('inputFechaLimite').value
  const asunto = document.getElementById('inputAsunto').value.trim()
  const remitente = document.getElementById('inputRemitente').value.trim()
  const cargo = document.getElementById('inputCargo').value.trim()
  const dependencia = document.getElementById('inputDependencia').value.trim()
  const unidadIds = _unidadesSeleccionadas
  const unidadAlias = unidadIds.map(id => {
    const item = document.querySelector(`#selectorList [data-value="${id}"]`)
    return item ? item.dataset.alias : id
  }).join(', ')
  const archivo = inputArchivo.files[0]
  const esCorreo = document.getElementById('inputEsCorreo')?.checked ? '1' : '0'
  const esConocimiento = document.getElementById('inputEsConocimiento')?.checked ? '1' : '0'
  const errorEl = document.getElementById('modalOficioError')

  if (!noOficio || !fechaOficio || !asunto || !remitente || unidadIds.length === 0) {
    errorEl.textContent = 'No. oficio, fecha, asunto, remitente y unidad son obligatorios.'
    return
  }

  document.getElementById('btnRegistrarText').style.display = 'none'
  document.getElementById('btnRegistrarLoader').style.display = 'inline-block'
  errorEl.textContent = ''

  try {
    const responsableIds = _unidadesSeleccionadas
    const cooresponsableIds = esConocimiento === '1' ? [] : _cooresponsablesSeleccionadas
    const allUnitIds = [...new Set([...responsableIds, ...cooresponsableIds])]
    const allUnitAlias = allUnitIds.map(id => {
      const item = document.querySelector(`#selectorList [data-value="${id}"]`)
      return item ? item.dataset.alias : id
    }).join(', ')

    const formData = new FormData()
    formData.append('noOficio', noOficio)
    formData.append('fechaOficio', fechaOficio)
    formData.append('fechaRecibo', fechaRecibo)
    formData.append('fechaLimite', fechaLimite)
    formData.append('asunto', asunto)
    formData.append('remitente', remitente)
    formData.append('cargo', cargo)
    formData.append('dependencia', dependencia)
    allUnitIds.forEach(id => formData.append('unidadIds', id))
    formData.append('unidadAlias', allUnitAlias)
    responsableIds.forEach(id => formData.append('responsableIds', id))
    cooresponsableIds.forEach(id => formData.append('cooresponsableIds', id))
    formData.append('tipoArchivo', esCorreo)
    formData.append('modo', esConocimiento)
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
    oficioRegistrarGuardando = false
  }
})

// ── FILE DROP EDITAR OFICIO ──
const modalEditarOverlay = document.getElementById('modalEditarOverlay')
const editFileDrop       = document.getElementById('editFileDrop')
const editArchivo        = document.getElementById('editArchivo')
let _oficioEditandoId    = null
let editarGuardando      = false

function updateEditFileDropUI(file) {
  const children = Array.from(editFileDrop.children)
  children.forEach(child => {
    if (child.id !== 'editArchivo') editFileDrop.removeChild(child)
  })

  if (file) {
    editFileDrop.classList.add('has-file')
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
      editArchivo.value = ''
      updateEditFileDropUI(null)
    }

    chip.appendChild(info)
    chip.appendChild(removeBtn)
    container.appendChild(chip)
    editFileDrop.appendChild(container)
  } else {
    editFileDrop.classList.remove('has-file')
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
    span.textContent = 'Seleccionar archivo PDF'

    editFileDrop.appendChild(svg)
    editFileDrop.appendChild(span)
  }
}

function abrirModalEditar(oficio) {
  _oficioEditandoId = oficio.id

  document.getElementById('editNoOficio').value     = oficio.noOficio    || ''
  document.getElementById('editFechaOficio').value  = oficio.fechaOficio || ''
  document.getElementById('editFechaRecibo').value  = oficio.fechaRecibo || ''
  document.getElementById('editFechaLimite').value  = oficio.fechaLimite || ''
  document.getElementById('editAsunto').value       = oficio.asunto      || ''
  document.getElementById('editRemitente').value    = oficio.remitente   || ''
  document.getElementById('editCargo').value        = oficio.cargo       || ''
  document.getElementById('editDependencia').value  = oficio.dependencia || ''
  _unidadesSeleccionadas = [...(oficio.responsableIds || oficio.unidadIds || [])]
  _cooresponsablesSeleccionadas = [...(oficio.cooresponsableIds || [])]
  updateUnidadesButton('edit-resp')
  updateUnidadesButton('edit-cooresp')
  document.getElementById('editEstatus').value      = oficio.estatus     || 'Pendiente'

  const editChk = document.getElementById('editEsCorreo')
  if (editChk) editChk.checked = oficio.tipoArchivo === 1
  const editChkModo = document.getElementById('editEsConocimiento')
  if (editChkModo) editChkModo.checked = oficio.modo === 1
  toggleCoorespRow()

  const avisoArchivo = document.getElementById('editArchivoActual')
  avisoArchivo.style.display = oficio.tieneArchivo ? 'block' : 'none'

  editArchivo.value = ''
  updateEditFileDropUI(null)
  document.getElementById('modalEditarError').textContent = ''
  modalEditarOverlay.classList.add('active')
}

const cerrarModalEditar = () => {
  modalEditarOverlay.classList.remove('active')
  _oficioEditandoId = null
  _unidadesSeleccionadas = []
  _cooresponsablesSeleccionadas = []
  updateUnidadesButton('edit-resp')
  updateUnidadesButton('edit-cooresp')
  document.getElementById('modalEditarError').textContent = ''
  const chkEditModo = document.getElementById('editEsConocimiento')
  if (chkEditModo) chkEditModo.checked = false
  toggleCoorespRow()
  editArchivo.value = ''
  updateEditFileDropUI(null)
}

document.getElementById('modalEditarClose').addEventListener('click', cerrarModalEditar)
document.getElementById('btnEditarCancelar').addEventListener('click', cerrarModalEditar)
modalEditarOverlay.addEventListener('click', e => { if (e.target === modalEditarOverlay) cerrarModalEditar() })

editFileDrop.addEventListener('click', () => editArchivo.click())
editArchivo.addEventListener('change', () => {
  const file = editArchivo.files[0]
  if (file) updateEditFileDropUI(file)
})
editFileDrop.addEventListener('dragover', e => { e.preventDefault(); editFileDrop.classList.add('drag-over') })
editFileDrop.addEventListener('dragleave', () => editFileDrop.classList.remove('drag-over'))
editFileDrop.addEventListener('drop', e => {
  e.preventDefault()
  editFileDrop.classList.remove('drag-over')
  const file = e.dataTransfer.files[0]
  if (file && file.type === 'application/pdf') {
    const dt = new DataTransfer(); dt.items.add(file); editArchivo.files = dt.files
    updateEditFileDropUI(file)
  }
})

document.addEventListener('click', e => {
  const btn = e.target.closest('.btn-editar-oficio')
  if (!btn) return
  const id = btn.dataset.id
  if (!id) return
  const scriptEl = document.getElementById(`oficio-data-${id}`)
  if (!scriptEl) return
  try {
    const oficio = JSON.parse(scriptEl.textContent)
    abrirModalEditar(oficio)
  } catch {
    console.error('No se pudo parsear oficio-data-' + id)
  }
})

document.getElementById('btnEditarGuardar').addEventListener('click', async () => {
  const errorEl     = document.getElementById('modalEditarError')
  const noOficio    = document.getElementById('editNoOficio').value.trim()
  const asunto      = document.getElementById('editAsunto').value.trim()
  const remitente   = document.getElementById('editRemitente').value.trim()
  const unidadIds   = _unidadesSeleccionadas
  const unidadAlias = unidadIds.map(id => {
    const item = document.querySelector(`#selectorList [data-value="${id}"]`)
    return item ? item.dataset.alias : id
  }).join(', ')
  const esCorreo    = document.getElementById('editEsCorreo')?.checked ? '1' : '0'
  const esConocimiento = document.getElementById('editEsConocimiento')?.checked ? '1' : '0'

  if (editarGuardando) return
  editarGuardando = true

  if (!noOficio || !asunto || !remitente || unidadIds.length === 0) {
    errorEl.textContent = 'No. oficio, asunto, remitente y unidad son obligatorios.'
    editarGuardando = false
    return
  }

  document.getElementById('btnEditarText').style.display   = 'none'
  document.getElementById('btnEditarLoader').style.display = 'inline-block'
  errorEl.textContent = ''

  try {
    const responsableIds = _unidadesSeleccionadas
    const cooresponsableIds = esConocimiento === '1' ? [] : _cooresponsablesSeleccionadas
    const allUnitIds = [...new Set([...responsableIds, ...cooresponsableIds])]
    const allUnitAlias = allUnitIds.map(id => {
      const item = document.querySelector(`#selectorList [data-value="${id}"]`)
      return item ? item.dataset.alias : id
    }).join(', ')

    const formData = new FormData()
    formData.append('noOficio',    noOficio)
    formData.append('fechaOficio', document.getElementById('editFechaOficio').value)
    formData.append('fechaRecibo', document.getElementById('editFechaRecibo').value)
    formData.append('fechaLimite', document.getElementById('editFechaLimite').value)
    formData.append('asunto',      asunto)
    formData.append('remitente',   remitente)
    formData.append('cargo',       document.getElementById('editCargo').value.trim())
    formData.append('dependencia', document.getElementById('editDependencia').value.trim())
    allUnitIds.forEach(id => formData.append('unidadIds', id))
    formData.append('unidadAlias', allUnitAlias)
    responsableIds.forEach(id => formData.append('responsableIds', id))
    cooresponsableIds.forEach(id => formData.append('cooresponsableIds', id))
    formData.append('estatus',     document.getElementById('editEstatus').value)
    formData.append('tipoArchivo', esCorreo)
    formData.append('modo', esConocimiento)
    if (editArchivo.files[0]) formData.append('archivo', editArchivo.files[0])

    const res = await fetch(`/oficios/${_oficioEditandoId}`, { method: 'PUT', body: formData })
    if (!res.ok) {
      const contentType = res.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json()
        errorEl.textContent = data.error || 'Error al guardar cambios.'
      } else {
        errorEl.textContent = await res.text() || 'Error al guardar cambios.'
      }
      return
    }
    cerrarModalEditar()
    window.location.reload()
  } catch {
    errorEl.textContent = 'Error de conexión.'
  } finally {
    document.getElementById('btnEditarText').style.display   = ''
    document.getElementById('btnEditarLoader').style.display = 'none'
    editarGuardando = false
  }
})

// ── MI UNIDAD ACTION DROPDOWN ──
const iconoTipoMiA = tipo => tipo === 'application/pdf'
  ? `<span class="archivo-type-badge pdf">PDF</span>`
  : `<span class="archivo-type-badge img">IMG</span>`

function renderMiRespuestaCard(r, esAclaracion = false) {
  const fecha = r.fechaAtendido ? new Date(r.fechaAtendido).toLocaleDateString('es-MX', {day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit'}) : ''
  let html = `<div class="respuesta-item${esAclaracion ? ' aclaracion-item' : ''}">`
  html += `<div class="respuesta-body">`
  html += `<div class="respuesta-header">`
  if (esAclaracion) {
    html += `<span class="resp-alias aclaracion-label">Nota aclaratoria</span>`
  } else {
    html += `<span class="resp-alias">${r.unidadAlias || '—'}</span>`
  }
  if (fecha) html += `<span class="resp-fecha">${fecha}</span>`
  html += `</div>`
  if (r.comentario) {
    html += `<p class="resp-comentario${esAclaracion ? ' aclaracion-text' : ''}">"${r.comentario}"</p>`
  }
  if (r.archivos && r.archivos.length > 0) {
    html += `<div class="resp-archivos">`
    html += r.archivos.map(a => {
      const typeClass = a.tipo === 'application/pdf' ? 'archivo-chip-pdf' : 'archivo-chip-img'
      return `<a href="javascript:void(0)" onclick="openFileViewer('${a.url}', '${a.nombre}')" class="archivo-chip ${typeClass}">${iconoTipoMiA(a.tipo)} <span>${a.nombre}</span></a>`
    }).join('')
    html += `</div>`
  }
  html += `</div></div>`
  return html
}

let marcarEnteradoGuardando = false

function abrirEvidenciasMi(id) {
  const todasResp = (window.__respuestasMi && window.__respuestasMi[id]) || []
  const lista = document.getElementById('listaEvidenciasMiModal')
  const overlay = document.getElementById('modalEvidenciasMiOverlay')
  if (!lista || !overlay) return

  let content = ''
  const originales = todasResp.filter(r => !r.esAclaracion)
  const aclaraciones = todasResp.filter(r => r.esAclaracion)
  originales.forEach(r => { content += renderMiRespuestaCard(r, false) })
  aclaraciones.forEach(r => { content += renderMiRespuestaCard(r, true) })
  if (!content) content = '<p style="color:#9ca3af;font-size:0.85rem;font-style:italic">Sin información.</p>'
  lista.innerHTML = content
  overlay.classList.add('active')
}

document.getElementById('modalEvidenciasMiClose')?.addEventListener('click', () => document.getElementById('modalEvidenciasMiOverlay')?.classList.remove('active'))
document.getElementById('btnEvidenciasMiCerrar')?.addEventListener('click', () => document.getElementById('modalEvidenciasMiOverlay')?.classList.remove('active'))
document.getElementById('modalEvidenciasMiOverlay')?.addEventListener('click', e => { if (e.target === e.currentTarget) e.target.classList.remove('active') })

function toggleActionMenuMi(e, id) {
  e.stopPropagation()
  if (currentActionMenu) {
    currentActionMenu.remove()
    currentActionMenu = null
  }

  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const menu = document.createElement('div')
  menu.className = 'action-dropdown active'
  menu.style.top = `${rect.bottom + window.scrollY}px`
  menu.style.left = `${rect.left + window.scrollX - 100}px`

  const dataEl = document.getElementById(`oficio-data-mi-${id}`)
  const data = dataEl ? JSON.parse(dataEl.textContent) : {}
  const row = document.querySelector(`.mi-pend-row[data-id="${id}"], .mi-atend-row[data-id="${id}"]`)
  const isAtendido = row && row.classList.contains('mi-atend-row')
  const yaRespondio = row && row.dataset.ya === 'true'
  const esConocimiento = data.modo === 1
  const esCoResponsable = row && row.dataset.ecooresponsable === 'true'

  const actions = []
  if (data.archivoUrl) {
    actions.push({
      label: 'Ver oficio',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
      action: () => {
        fetch(`/oficios/${id}/visto`, { method: 'POST', headers: { 'CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content } }).catch(() => {})
        openFileViewer(data.archivoUrl, `Oficio ${data.noOficio}`)
      }
    })
  }

  if (esCoResponsable) {
    menu.innerHTML = actions.length
      ? actions.map((a, index) => `<button class="dropdown-item" data-index="${index}">${a.icon} <span>${a.label}</span></button>`).join('')
      : '<div class="dropdown-item" style="cursor:default;color:#9ca3af;font-style:italic">Sin acciones disponibles</div>'
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item')
      if (item && item.dataset.index !== undefined) {
        actions[item.dataset.index].action()
        menu.remove()
        currentActionMenu = null
      }
    })
    document.body.appendChild(menu)
    currentActionMenu = menu
    return
  }

  if (esConocimiento) {
    if (yaRespondio) {
      actions.push({
        label: 'Ver enterado',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
        action: () => abrirEvidenciasMi(id)
      })
    } else {
      actions.push({
        label: 'Enterado',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
        action: () => {
          if (marcarEnteradoGuardando) return
          marcarEnteradoGuardando = true
          const formData = new FormData()
          formData.append('comentario', '')
          fetch(`/oficios/${id}/respuesta`, { method: 'POST', body: formData })
            .then(r => r.json())
            .then(d => { if (!d.error) window.location.reload(); else alert(d.error) })
            .catch(() => alert('Error de conexión.'))
            .finally(() => { marcarEnteradoGuardando = false })
        }
      })
    }
  } else if (isAtendido) {
    actions.push({
      label: 'Ver respuesta',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      action: () => abrirEvidenciasMi(id)
    })
    if (!esCoResponsable) {
      actions.push({
        label: 'Agregar aclaración',
        icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
        action: () => abrirModalAclaracionMi(id)
      })
    }
  } else {
    actions.push({
      label: yaRespondio ? 'Editar respuesta' : 'Registrar respuesta',
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
      action: () => {
        const rowEl = document.querySelector(`.mi-pend-row[data-id="${id}"]`)
        if (rowEl) {
          abrirModalResponderMi(id, rowEl.dataset.comentario || '', rowEl.dataset.archivos || '[]', rowEl.dataset.ya === 'true')
        }
      }
    })
  }

  menu.innerHTML = actions.map((a, index) => `
    <button class="dropdown-item" data-index="${index}">
      ${a.icon} <span>${a.label}</span>
    </button>
  `).join('')

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('.dropdown-item')
    if (item) {
      actions[item.dataset.index].action()
      menu.remove()
      currentActionMenu = null
    }
  })

  document.body.appendChild(menu)
  currentActionMenu = menu
}

// ── MODAL RESPONDER (MI UNIDAD) ──
let miRespId = null
let miRespArchivos = []
let miResponderGuardando = false

const modalMiRespOverlay = document.getElementById('modalMiResponderOverlay')
if (modalMiRespOverlay) {
  const inputMiEv = document.getElementById('inputMiEvidencias')
  const dropMi = document.getElementById('fileDropMiResponder')
  const labelMi = document.getElementById('fileLabelMiResponder')
  const listaMi = document.getElementById('listaArchivosMiResponder')
  const tiposMi = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const iconoTipoMi = tipo => tipo === 'application/pdf'
    ? `<span class="archivo-type-badge pdf">PDF</span>`
    : `<span class="archivo-type-badge img">IMG</span>`

  function renderListaMiResp() {
    listaMi.innerHTML = ''
    miRespArchivos.forEach((file, i) => {
      const chip = document.createElement('div')
      chip.className = 'archivo-chip-selected'
      chip.innerHTML = `${iconoTipoMi(file.type)}<span>${file.name}</span><button class="chip-remove" data-i="${i}">&times;</button>`
      listaMi.appendChild(chip)
    })
    listaMi.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        miRespArchivos.splice(Number(btn.dataset.i), 1)
        renderListaMiResp()
      })
    })
    labelMi.textContent = miRespArchivos.length > 0
      ? `${miRespArchivos.length} archivo(s) seleccionado(s)`
      : 'Arrastra archivos aquí o haz clic para seleccionar'
  }

  function agregarArchivosMi(nuevos) {
    const errorEl = document.getElementById('modalMiResponderError')
    for (const file of nuevos) {
      if (!tiposMi.includes(file.type)) {
        errorEl.textContent = `Tipo no permitido: ${file.name}. Solo PDF e imágenes.`
        continue
      }
      if (!miRespArchivos.find(f => f.name === file.name)) {
        miRespArchivos.push(file)
      }
    }
    renderListaMiResp()
  }

  function abrirModalResponderMi(id, comentario = '', archivosJson = '[]', yaRespondio = false) {
    miRespId = id
    modalMiRespOverlay.style.display = ''
    document.getElementById('modalMiRespTitulo').textContent = yaRespondio ? 'Editar Respuesta' : 'Responder Oficio'
    document.getElementById('inputMiResponderComentario').value = comentario
    miRespArchivos = []
    renderListaMiResp()

    const existentesPanel = document.getElementById('archivosExistentesMi')
    const existentesList = document.getElementById('listaArchivosExistentesMi')
    if (yaRespondio && existentesPanel && existentesList) {
      try {
        const arch = JSON.parse(archivosJson)
        if (arch.length > 0) {
          existentesList.innerHTML = arch.map(a => {
            const typeClass = a.tipo === 'application/pdf' ? 'archivo-chip-pdf' : 'archivo-chip-img'
            return `<a href="javascript:void(0)" onclick="openFileViewer('${a.url}', '${a.nombre}')" class="archivo-chip ${typeClass}">${iconoTipoMi(a.tipo)} <span>${a.nombre}</span></a>`
          }).join('')
          existentesPanel.style.display = 'block'
        } else {
          existentesPanel.style.display = 'none'
        }
      } catch (_) {
        existentesPanel.style.display = 'none'
      }
    } else if (existentesPanel) {
      existentesPanel.style.display = 'none'
    }
    document.getElementById('modalMiResponderError').textContent = ''
    modalMiRespOverlay.classList.add('active')
  }

  dropMi.addEventListener('click', () => inputMiEv.click())
  inputMiEv.addEventListener('change', () => {
    agregarArchivosMi(Array.from(inputMiEv.files))
    inputMiEv.value = ''
  })
  dropMi.addEventListener('dragover', e => { e.preventDefault(); dropMi.classList.add('drag-over') })
  dropMi.addEventListener('dragleave', () => dropMi.classList.remove('drag-over'))
  dropMi.addEventListener('drop', e => {
    e.preventDefault()
    dropMi.classList.remove('drag-over')
    agregarArchivosMi(Array.from(e.dataTransfer.files))
  })

  function cerrarMiResponder() {
    modalMiRespOverlay.classList.remove('active')
    modalMiRespOverlay.style.display = 'none'
    miRespId = null
    miRespArchivos = []
    const p = document.getElementById('archivosExistentesMi')
    if (p) p.style.display = 'none'
  }

  document.getElementById('modalMiResponderClose').addEventListener('click', cerrarMiResponder)
  document.getElementById('btnMiResponderCancelar').addEventListener('click', cerrarMiResponder)
  modalMiRespOverlay.addEventListener('click', e => { if (e.target === modalMiRespOverlay) cerrarMiResponder() })

  document.getElementById('btnMiResponderGuardar').addEventListener('click', async () => {
    const comentario = document.getElementById('inputMiResponderComentario').value.trim()
    const errorEl = document.getElementById('modalMiResponderError')
    if (!comentario && miRespArchivos.length === 0) {
      errorEl.textContent = 'Debes agregar un comentario o al menos un archivo.'
      return
    }
    if (miResponderGuardando) return
    miResponderGuardando = true
    document.getElementById('btnMiResponderText').style.display = 'none'
    document.getElementById('btnMiResponderLoader').style.display = 'inline-block'
    errorEl.textContent = ''
    try {
      const formData = new FormData()
      formData.append('comentario', comentario)
      miRespArchivos.forEach(file => formData.append('archivos', file))
      const res = await fetch(`/oficios/${miRespId}/respuesta`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { errorEl.textContent = data.error || 'Error al guardar respuesta.'; return }
      cerrarMiResponder()
      window.location.reload()
    } catch {
      errorEl.textContent = 'Error de conexión.'
    } finally {
      document.getElementById('btnMiResponderText').style.display = ''
      document.getElementById('btnMiResponderLoader').style.display = 'none'
      miResponderGuardando = false
    }
  })
}

// ── MODAL ACLARACION MI UNIDAD ──
let aclaracionMiOficioId = null
let aclaracionMiArchivos = []
let aclaracionMiGuardando = false

const modalAclaracionMiOverlay = document.getElementById('modalAclaracionMiOverlay')
if (modalAclaracionMiOverlay) {
  const inputAclMiArchivos = document.getElementById('inputAclaracionMiArchivos')
  const dropAclMi = document.getElementById('fileDropAclaracionMi')
  const labelAclMi = document.getElementById('fileLabelAclaracionMi')
  const listaAclMi = document.getElementById('listaArchivosAclaracionMi')
  const tiposAclMi = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const iconoTipoAclMi = tipo => tipo === 'application/pdf'
    ? `<span class="archivo-type-badge pdf">PDF</span>`
    : `<span class="archivo-type-badge img">IMG</span>`

  function renderListaAclaracionMi() {
    listaAclMi.innerHTML = ''
    aclaracionMiArchivos.forEach((file, i) => {
      const chip = document.createElement('div')
      chip.className = 'archivo-chip-selected'
      chip.innerHTML = `${iconoTipoAclMi(file.type)}<span>${file.name}</span><button class="chip-remove" data-i="${i}">&times;</button>`
      listaAclMi.appendChild(chip)
    })
    listaAclMi.querySelectorAll('.chip-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        aclaracionMiArchivos.splice(Number(btn.dataset.i), 1)
        renderListaAclaracionMi()
      })
    })
    labelAclMi.textContent = aclaracionMiArchivos.length > 0
      ? `${aclaracionMiArchivos.length} archivo(s) seleccionado(s)`
      : 'Arrastra archivos aquí o haz clic para seleccionar'
  }

  function agregarArchivosAclaracionMi(nuevos) {
    const errorEl = document.getElementById('modalAclaracionMiError')
    for (const file of nuevos) {
      if (!tiposAclMi.includes(file.type)) {
        errorEl.textContent = `Tipo no permitido: ${file.name}. Solo PDF e imágenes.`
        continue
      }
      if (!aclaracionMiArchivos.find(f => f.name === file.name)) {
        aclaracionMiArchivos.push(file)
      }
    }
    renderListaAclaracionMi()
  }

  function abrirModalAclaracionMi(oficioId) {
    aclaracionMiOficioId = oficioId
    aclaracionMiArchivos = []
    document.getElementById('inputAclaracionMiComentario').value = ''
    document.getElementById('modalAclaracionMiError').textContent = ''
    renderListaAclaracionMi()
    modalAclaracionMiOverlay.classList.add('active')
  }

  function cerrarModalAclaracionMi() {
    modalAclaracionMiOverlay.classList.remove('active')
    aclaracionMiOficioId = null
    aclaracionMiArchivos = []
    aclaracionMiGuardando = false
  }

  dropAclMi.addEventListener('click', () => inputAclMiArchivos.click())
  inputAclMiArchivos.addEventListener('change', () => {
    agregarArchivosAclaracionMi(Array.from(inputAclMiArchivos.files))
    inputAclMiArchivos.value = ''
  })
  dropAclMi.addEventListener('dragover', e => { e.preventDefault(); dropAclMi.classList.add('drag-over') })
  dropAclMi.addEventListener('dragleave', () => dropAclMi.classList.remove('drag-over'))
  dropAclMi.addEventListener('drop', e => {
    e.preventDefault()
    dropAclMi.classList.remove('drag-over')
    agregarArchivosAclaracionMi(Array.from(e.dataTransfer.files))
  })

  document.getElementById('modalAclaracionMiClose').addEventListener('click', cerrarModalAclaracionMi)
  document.getElementById('btnAclaracionMiCancelar').addEventListener('click', cerrarModalAclaracionMi)
  modalAclaracionMiOverlay.addEventListener('click', e => { if (e.target === modalAclaracionMiOverlay) cerrarModalAclaracionMi() })

  document.getElementById('btnAclaracionMiGuardar').addEventListener('click', async () => {
    const comentario = document.getElementById('inputAclaracionMiComentario').value.trim()
    const errorEl = document.getElementById('modalAclaracionMiError')
    if (!comentario) {
      errorEl.textContent = 'La nota aclaratoria es obligatoria.'
      return
    }
    if (aclaracionMiGuardando) return
    aclaracionMiGuardando = true
    document.getElementById('btnAclaracionMiText').style.display = 'none'
    document.getElementById('btnAclaracionMiLoader').style.display = 'inline-block'
    errorEl.textContent = ''
    try {
      const formData = new FormData()
      formData.append('comentario', comentario)
      aclaracionMiArchivos.forEach(file => formData.append('archivos', file))
      const res = await fetch(`/oficios/${aclaracionMiOficioId}/aclaracion`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { errorEl.textContent = data.error || 'Error al guardar aclaración.'; return }
      cerrarModalAclaracionMi()
      window.location.reload()
    } catch {
      errorEl.textContent = 'Error de conexión.'
    } finally {
      document.getElementById('btnAclaracionMiText').style.display = ''
      document.getElementById('btnAclaracionMiLoader').style.display = 'none'
      aclaracionMiGuardando = false
    }
  })
}