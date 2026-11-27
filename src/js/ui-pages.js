/* =====================================================================
   HAHA Location Replacement Assessment v2.2
   ===================================================================== */
'use strict';

function renderDashboard() {
  const list = app.projects;
  const computed = list.map(p => ({ p, m: compute(p) }));
  const viableList = computed.filter(x => x.m.viable);
  const validStandalone = computed.filter(x => x.m.hasData && isFinite(x.m.invest.standalonePayback));
  const avgStandalone = validStandalone.length
    ? validStandalone.reduce((s, x) => s + x.m.invest.standalonePayback, 0) / validStandalone.length
    : Infinity;
  const assessed = computed.filter(x => x.m.hasData);
  const avgGain = assessed.length
    ? assessed.reduce((s, x) => s + x.m.invest.delta, 0) / assessed.length
    : 0;

  const recentRows = computed.slice(0, 5).map(({ p, m }) => `
    <div class="recent-row" data-action="openProj" data-id="${p.id}">
      <div>
        <strong>${esc(p.meta.locationName || t('top.untitled'))}</strong>
        <small>${esc(t('venue.' + p.meta.venue))} · ${esc(t('verdict.' + m.verdict))} · ${m.hasData ? signedMoney(m.invest.delta, 0) + '/mo' : '—'}</small>
      </div>
      <button type="button" class="button button-dark button-small" data-action="openProj" data-id="${p.id}">${esc(t('common.open'))}</button>
    </div>
  `).join('');

  return `
    <div class="hero-strip">
      <div>
        <span class="hero-kicker">${esc(t('dash.kicker'))}</span>
        <h2>${esc(t('dash.title'))}</h2>
        <p>${esc(t('dash.desc'))}</p>
        <div class="hero-cta">
          <button type="button" class="button button-white" data-action="openNewModal">${esc(t('dash.ctaNew'))}</button>
          <button type="button" class="button button-outline" style="background:transparent;color:#fff;border-color:#555" data-action="loadSample">${esc(t('dash.ctaSample'))}</button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="visual-frame">
          <div class="machine-top">HAHA Vending</div>
          <div class="machine-screen">TAP · OPEN<br>GRAB &amp; GO</div>
          <div class="shelf-row"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="shelf-row"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="shelf-row"><i></i><i></i><i></i><i></i><i></i></div>
          <div class="machine-foot"></div>
        </div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><span>${esc(t('dash.stat1'))}</span><strong>${list.length}</strong><small>${esc(t('dash.stat1Sub'))}</small></div>
      <div class="stat-card"><span>${esc(t('dash.stat2'))}</span><strong>${viableList.length}</strong><small>${esc(t('dash.stat2Sub'))}</small></div>
      <div class="stat-card"><span>${esc(t('dash.stat3'))}</span><strong>${isFinite(avgStandalone) ? nf(avgStandalone, 1) + ' ' + esc(t('common.mo')) : '—'}</strong><small>${esc(t('dash.stat3Sub'))}</small></div>
      <div class="stat-card"><span>${esc(t('dash.stat4'))}</span><strong>${assessed.length ? signedMoney(avgGain, 0) : '—'}</strong><small>${esc(t('dash.stat4Sub'))}</small></div>
    </div>

    <div class="dashboard-grid">
      <div class="panel">
        <div class="panel-head">
          <div><h3>${esc(t('dash.recent'))}</h3><p>${esc(t('dash.recentSub'))}</p></div>
          <button type="button" class="button button-outline button-small" data-nav="projects">${esc(t('nav.projects'))}</button>
        </div>
        <div class="recent-list">${recentRows || `<div class="empty-box">${esc(t('dash.empty'))}</div>`}</div>
      </div>
      <div class="panel">
        <div class="panel-head">
          <div><h3>${esc(t('dash.quick'))}</h3><p>${esc(t('dash.quickSub'))}</p></div>
        </div>
        <button type="button" class="quick-link" data-action="${getActiveProject() ? 'goStep1' : 'openNewModal'}">
          <span class="quick-number">01</span>
          <div><strong>${esc(t('dash.q1'))}</strong><small>${esc(t('dash.q1d'))}</small></div>
          <b>→</b>
        </button>
        <button type="button" class="quick-link" data-action="${getActiveProject() ? 'goStep2' : 'openNewModal'}">
          <span class="quick-number">02</span>
          <div><strong>${esc(t('dash.q2'))}</strong><small>${esc(t('dash.q2d'))}</small></div>
          <b>→</b>
        </button>
        <button type="button" class="quick-link" data-action="${getActiveProject() ? 'goStep3' : 'openNewModal'}">
          <span class="quick-number">03</span>
          <div><strong>${esc(t('dash.q3'))}</strong><small>${esc(t('dash.q3d'))}</small></div>
          <b>→</b>
        </button>
      </div>
    </div>
  `;
}

/* =====================================================================
   10. VIEW: MY PROJECTS (NO DUPLICATE BUTTON; OPENS AT STEP 01)
   ===================================================================== */
function projectCardsHtml() {
  const q = app.search.trim().toLowerCase();
  const filtered = app.projects.filter(p => !q ||
    (p.meta.locationName || '').toLowerCase().includes(q) ||
    (p.meta.city || '').toLowerCase().includes(q)
  );
  if (!filtered.length) return `<div class="empty-box">${esc(t('dash.empty'))}</div>`;

  return `<div class="projects-grid">${filtered.map(p => {
    const m = compute(p);
    const badgeCls = m.viable ? 'strong' : m.verdict === 'defer' ? 'defer' : '';
    return `
      <div class="project-card" data-action="openProj" data-id="${p.id}">
        <div class="project-card-top">
          <span class="project-type">${esc(t('venue.' + p.meta.venue))}</span>
          <span class="project-badge ${badgeCls}">${esc(t('verdict.' + m.verdict))}</span>
        </div>
        <h3>${esc(p.meta.locationName || t('top.untitled'))}</h3>
        <p>${esc([p.meta.city, p.meta.state].filter(Boolean).join(', ') || '—')} · ${esc(m.invest.model.name)}</p>
        <div style="font-size:13px;font-weight:800;color:${m.hasData && m.invest.delta >= 0 ? 'var(--green)' : 'var(--muted)'}">
          ${m.hasData ? signedMoney(m.invest.delta, 0) + '/mo · ' + esc(monthsFmt(m.invest.standalonePayback)) : '—'}
        </div>
        <div class="project-card-bottom">
          <button type="button" class="button button-dark button-small" data-action="openProj" data-id="${p.id}">${esc(t('common.open'))}</button>
          <button type="button" class="button button-danger button-small" data-action="askDelete" data-id="${p.id}">${esc(t('common.delete'))}</button>
        </div>
      </div>
    `;
  }).join('')}</div>`;
}

function renderProjects() {
  return `
    <div class="page-heading">
      <div>
        <div class="eyebrow">${esc(t('nav.workspace'))}</div>
        <h1>${esc(t('proj.title'))}</h1>
        <p>${esc(t('proj.desc'))}</p>
      </div>
    </div>
    <div class="project-toolbar">
      <div class="search-box">
        <span>⌕</span>
        <input type="text" id="projSearch" value="${esc(app.search)}" placeholder="${esc(t('proj.search'))}">
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="button button-outline button-small" data-action="backupAll">${esc(t('common.backup'))}</button>
        <button type="button" class="button button-outline button-small" data-action="restoreAll">${esc(t('common.restore'))}</button>
      </div>
    </div>
    <div id="projCardsHost">${projectCardsHtml()}</div>
  `;
}
