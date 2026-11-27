/* =====================================================================
   HAHA Location Replacement Assessment v2.3
   ===================================================================== */
'use strict';

function mountView() {
  document.documentElement.lang = app.lang === 'zh' ? 'zh-CN' : 'en';
  const p = getActiveProject();
  if (['step1', 'step2', 'step3'].includes(app.view) && !p) {
    app.view = 'dashboard';
  }
  renderSidebar();
  renderTopbar();

  const host = $('#pageContent');
  if (!host) return;

  if (app.view === 'dashboard') {
    host.innerHTML = renderDashboard();
  } else if (app.view === 'projects') {
    host.innerHTML = renderProjects();
  } else if (app.view === 'step1') {
    host.innerHTML = renderStep1(p);
    syncOutputs();
  } else if (app.view === 'step2') {
    syncUpliftBase(p, false);
    host.innerHTML = renderStep2(p);
    syncOutputs();
  } else if (app.view === 'step3') {
    syncUpliftBase(p, false);
    host.innerHTML = renderStep3(p, compute(p));
  }
}

/* Boot immediately */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountView);
} else {
  mountView();
}
