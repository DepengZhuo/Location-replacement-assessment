/* =====================================================================
   HAHA Location Replacement Assessment v2.3
   ===================================================================== */
'use strict';

function renderSidebar() {
  const p = getActiveProject();
  const s1 = p ? validateStep1(p) : { ok: false };
  const s2 = p ? validateStep2(p) : { ok: false };
  const navBtn = (view, badge, label, disabled, title) =>
    `<button type="button" class="nav-item ${app.view === view ? 'active' : ''}" data-nav="${view}" ${disabled ? 'disabled' : ''} ${title ? `title="${esc(title)}"` : ''}>
      <span class="nav-badge">${badge}</span>
      <span class="nav-label">${esc(label)}</span>
    </button>`;

  $('#sidebar').innerHTML = `
    <a href="#" class="brand" data-nav="dashboard">
      <div class="brand-text">
        <strong>HAHA VENDING</strong>
        <small>${esc(t('brand.sub'))}</small>
      </div>
    </a>
    <div class="sidebar-label">${esc(t('nav.workspace'))}</div>
    <nav class="main-nav">
      ${navBtn('dashboard', '⌂', t('nav.dashboard'), false)}
      ${navBtn('projects', '☰', t('nav.projects'), false)}
    </nav>
    <div class="sidebar-label">${esc(t('nav.activeProject'))}</div>
    <nav class="main-nav">
      ${navBtn('step1', '01', t('nav.s1'), !p)}
      ${navBtn('step2', '02', t('nav.s2'), !p || !s1.ok, !p ? t('validate.project') : (!s1.ok ? t('validate.step1First') : ''))}
      ${navBtn('step3', '03', t('nav.s3'), !p || !s1.ok || !s2.ok, !p ? t('validate.project') : (!s1.ok ? t('validate.step1First') : (!s2.ok ? t('validate.step2First') : '')))}
    </nav>
    <div class="sidebar-bottom">
      <div class="sidebar-note">
        <span class="status-dot"></span>
        <div><strong>${esc(t('side.local'))}</strong><small>${esc(t('side.localSub'))}</small></div>
      </div>
      <div class="sidebar-footer">${esc(t('side.ver'))}</div>
    </div>
  `;
}

function renderTopbar() {
  const p = getActiveProject();
  const inActiveProject = ['step1', 'step2', 'step3'].includes(app.view);
  const viewTitle = app.view === 'dashboard' ? t('nav.dashboard')
    : app.view === 'projects' ? t('nav.projects')
    : app.view === 'step1' ? t('nav.s1')
    : app.view === 'step2' ? t('nav.s2') : t('nav.s3');

  const tipAttr = inActiveProject ? `title="${esc(t('top.newDisabledTip'))}"` : '';

  $('#topbar').innerHTML = `
    <div class="topbar-left">
      <button type="button" class="mobile-menu" data-action="toggleMenu">☰</button>
      <div class="breadcrumb">
        <span>HAHA</span><b>/</b><strong>${esc(viewTitle)}</strong>
        ${(inActiveProject && p) ? `<b>/</b><span class="bc-proj" data-out="topProjName">${esc(p.meta.locationName || t('top.untitled'))}</span>` : ''}
      </div>
    </div>
    <div class="topbar-actions">
      <span class="tip-wrap" ${tipAttr}>
        <button type="button" class="button button-dark button-small" data-action="openNewModal" ${inActiveProject ? 'disabled' : ''} ${tipAttr}>${esc(t('top.newProject'))}</button>
      </span>
      <div class="seg">
        <button type="button" class="${app.lang === 'en' ? 'on' : ''}" data-action="lang" data-value="en">EN</button>
        <button type="button" class="${app.lang === 'zh' ? 'on' : ''}" data-action="lang" data-value="zh">中文</button>
      </div>
    </div>
  `;
  renderStorageWarning();
}

function renderStorageWarning() {
  const el = $('#storageWarning');
  if (!el) return;
  if (!app.storageError) {
    el.classList.add('hidden');
    el.innerHTML = '';
    return;
  }
  el.classList.remove('hidden');
  el.innerHTML = `
    <span>⚠ ${esc(t('storage.warning'))}</span>
    <button type="button" class="button button-outline button-small" data-action="exportAll">${esc(t('common.backupAll'))}</button>
  `;
}

function showModal(html) {
  const root = $('#modalRoot');
  if (root) root.innerHTML = `<div class="modal-backdrop" id="modalBack"><div class="modal">${html}</div></div>`;
}
function closeModal() {
  const root = $('#modalRoot');
  if (root) root.innerHTML = '';
}

function openNewProjectModal() {
  showModal(`
    <h3>${esc(t('modal.newTitle'))}</h3>
    <p>${esc(t('modal.newDesc'))}</p>
    <form id="newProjForm" novalidate>
      <div class="field">
        <label for="newProjNameInput">${esc(t('modal.locLabel'))}</label>
        <input type="text" id="newProjNameInput" placeholder="${esc(t('modal.locPh'))}" autocomplete="off">
        <div class="error-text hidden" id="newProjError">${esc(t('modal.locErr'))}</div>
      </div>
      <div class="modal-actions">
        <button type="button" class="button button-outline" data-action="closeModal">${esc(t('common.cancel'))}</button>
        <button type="submit" class="button button-dark">${esc(t('modal.createBtn'))}</button>
      </div>
    </form>
  `);
  const inp = $('#newProjNameInput');
  const err = $('#newProjError');
  const form = $('#newProjForm');
  if (inp) {
    setTimeout(() => inp.focus(), 20);
    inp.addEventListener('input', () => {
      if (inp.value.trim()) {
        inp.classList.remove('input-error');
        if (err) err.classList.add('hidden');
      }
    });
  }
  if (form) {
    form.addEventListener('submit', ev => {
      ev.preventDefault();
      const name = inp ? inp.value.trim() : '';
      if (!name) {
        if (inp) { inp.classList.add('input-error'); inp.focus(); }
        if (err) err.classList.remove('hidden');
        return;
      }
      const p = createBlankProject(name);
      app.projects.unshift(p);
      app.activeId = p.id;
      app.view = 'step1';
      saveState();
      closeModal();
      mountView();
      toast(t('common.created'));
    });
  }
}

function askDeleteModal(id) {
  const p = app.projects.find(x => x.id === id);
  if (!p) return;
  showModal(`
    <h3>${esc(t('proj.delTitle'))}</h3>
    <p>${esc(t('proj.delMsg', { name: p.meta.locationName || t('top.untitled') }))}</p>
    <div class="modal-actions">
      <button type="button" class="button button-outline" data-action="closeModal">${esc(t('common.cancel'))}</button>
      <button type="button" class="button button-danger" data-action="confirmDelete" data-id="${id}">${esc(t('common.delete'))}</button>
    </div>
  `);
}
