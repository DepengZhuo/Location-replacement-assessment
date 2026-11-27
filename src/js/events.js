/* =====================================================================
   HAHA Location Replacement Assessment v2.3
   ===================================================================== */
'use strict';

function goToStep(step) {
  const p = getActiveProject();
  if (!p) return;
  if (!canEnterStep(step, p)) {
    toast(stepMissingText(step === 'step3' ? 'step2' : 'step1', p));
    return;
  }
  app.view = step;
  mountView();
}

document.addEventListener('click', e => {
  /* Navigation links */
  const nav = e.target.closest('[data-nav]');
  if (nav && !nav.disabled) {
    e.preventDefault();
    const target = nav.dataset.nav;
    const p = getActiveProject();
    if (target === 'step2' && !canEnterStep('step2', p)) {
      toast(stepMissingText('step1', p));
      return;
    }
    if (target === 'step3' && !canEnterStep('step3', p)) {
      toast(stepMissingText('step2', p));
      return;
    }
    app.view = target;
    const sb = $('#sidebar'); if (sb) sb.classList.remove('open');
    const ov = $('#sidebarOverlay'); if (ov) ov.classList.remove('show');
    mountView();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) {}
    return;
  }

  if (e.target.id === 'sidebarOverlay') {
    $('#sidebar').classList.remove('open');
    $('#sidebarOverlay').classList.remove('show');
    return;
  }
  if (e.target.id === 'modalBack') { closeModal(); return; }

  /* Delete button inside project card stops card click propagation */
  const delBtn = e.target.closest('[data-action="askDelete"]');
  if (delBtn) {
    e.stopPropagation();
    askDeleteModal(delBtn.dataset.id);
    return;
  }

  /* Single-value setters (Chips / Segmented Controls / Diagnostic 10-5-0) */
  const setBtn = e.target.closest('[data-set]');
  if (setBtn) {
    const p = getActiveProject();
    if (!p) return;
    const path = setBtn.dataset.set;
    let val = setBtn.dataset.value;
    if (val === 'true') val = true;
    else if (val === 'false') val = false;
    else if (/^\d+(\.\d+)?$/.test(val)) val = Number(val);

    setPath(p, path, val);
    if (path === 'invest.modelId') p.invest.modelManual = true;

    const chipGrp = setBtn.closest('[data-chip-group]');
    if (chipGrp) $$('button', chipGrp).forEach(b => b.classList.toggle('on', b === setBtn));

    const segGrp = setBtn.closest('[data-seg-group]');
    if (segGrp) $$('button', segGrp).forEach(b => b.classList.toggle('on', b === setBtn));

    const diagGrp = setBtn.closest('[data-diag-group]');
    if (diagGrp) {
      $$('button', diagGrp).forEach(b => {
        b.classList.remove('on-10', 'on-5', 'on-0');
        if (b === setBtn) b.classList.add('on-' + val);
      });
    }

    /* Update uplift % input directly when acceptance changes */
    if (/^uplift\.[a-z]+\.accept$/.test(path)) {
      const k = path.split('.')[1];
      const q = compute(p).quadrantId;
      const f = val === 'yes' ? 1 : val === 'partial' ? 0.5 : 0;
      const newPct = round1(QUADRANT_BASE[q][k] * f);
      p.uplift[k].pct = newPct;
      p.uplift[k].custom = false;
      const pctInp = $(`[data-bind="uplift.${k}.pct"]`);
      if (pctInp) pctInp.value = newPct;
    }

    p.updatedAt = new Date().toISOString();
    saveState();
    syncOutputs();
    return;
  }

  /* Multi-select toggles (Payments Accepted) */
  const togBtn = e.target.closest('[data-toggle]');
  if (togBtn) {
    const p = getActiveProject();
    if (!p) return;
    const arr = getPath(p, togBtn.dataset.toggle);
    if (Array.isArray(arr)) {
      const v = togBtn.dataset.value;
      const i = arr.indexOf(v);
      if (i >= 0) arr.splice(i, 1); else arr.push(v);
      togBtn.classList.toggle('on', arr.includes(v));
      p.updatedAt = new Date().toISOString();
      saveState();
      syncOutputs();
    }
    return;
  }

  /* General Actions */
  const act = e.target.closest('[data-action]');
  if (!act || act.disabled) return;
  const a = act.dataset.action;

  if (a === 'toggleMenu') {
    $('#sidebar').classList.toggle('open');
    $('#sidebarOverlay').classList.toggle('show');
  } else if (a === 'lang') {
    app.lang = act.dataset.value;
    saveState();
    mountView();
  } else if (a === 'openNewModal') {
    openNewProjectModal();
  } else if (a === 'closeModal') {
    closeModal();
  } else if (a === 'loadSample') {
    const p = createSampleProject();
    app.projects.unshift(p);
    app.activeId = p.id;
    app.view = 'step1';
    saveState();
    mountView();
    toast(t('common.sampleCreated'));
  } else if (a === 'openProj') {
    app.activeId = act.dataset.id;
    app.view = 'step1';
    saveState();
    mountView();
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch (err) {}
  } else if (a === 'confirmDelete') {
    const id = act.dataset.id;
    app.projects = app.projects.filter(x => x.id !== id);
    if (app.activeId === id) app.activeId = app.projects[0] ? app.projects[0].id : null;
    saveState();
    closeModal();
    mountView();
    toast(t('common.deleted'));
  } else if (a === 'goStep1') { goToStep('step1'); }
  else if (a === 'goStep2') { goToStep('step2'); }
  else if (a === 'goStep3') { goToStep('step3'); }
  else if (a === 'estOrders') {
    const p = getActiveProject();
    if (p) {
      const sales = num(p.baseline.monthlySales);
      if (sales > 0) {
        const est = Math.round(sales / 2.5);
        p.baseline.monthlyOrders = est;
        p.baseline.ordersEstimated = true;
        const inp = $('[data-bind="baseline.monthlyOrders"]');
        if (inp) inp.value = est;
        saveState();
        syncOutputs();
      }
    }
  } else if (a === 'autoModel') {
    const p = getActiveProject();
    if (p) {
      p.invest.modelManual = false;
      saveState();
      syncOutputs();
    }
  } else if (a === 'resetUplift') {
    const p = getActiveProject();
    if (p) {
      syncUpliftBase(p, true);
      ['variety', 'basket', 'stock', 'payment'].forEach(k => {
        const inp = $(`[data-bind="uplift.${k}.pct"]`);
        if (inp) inp.value = p.uplift[k].pct;
      });
      saveState();
      syncOutputs();
    }
  } else if (a === 'toggleCost') {
    app.costExpanded = !app.costExpanded;
    const body = $('#costBody');
    const arrow = $('#costArrow');
    if (body) body.classList.toggle('hidden', !app.costExpanded);
    if (arrow) arrow.textContent = app.costExpanded ? '▲' : '▼';
  } else if (a === 'backupProject') {
    const p = app.projects.find(x => x.id === act.dataset.id) || getActiveProject();
    if (p && backupProjectFile(p)) toast(t('common.backedUp'));
    else toast(t('common.backupFailed'));
  } else if (a === 'exportAll') {
    if (exportAllFile()) toast(t('common.exportedAll'));
    else toast(t('common.backupFailed'));
  } else if (a === 'importProjects') {
    const imp = $('#importFile');
    if (imp) imp.click();
  } else if (a === 'printReport') {
    try { window.print(); } catch (err) {}
  } else if (a === 'downloadReport') {
    const p = getActiveProject();
    if (!p) return;
    const m = compute(p);
    const css = collectAppCss();
    const html = `<!DOCTYPE html><html lang="${app.lang === 'zh' ? 'zh-CN' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(p.meta.locationName || 'HAHA Assessment Report')}</title><style>${css} body{background:#fff;padding:24px}</style></head><body>${reportDocumentHtml(p, m)}</body></html>`;
    const fname = 'HAHA-' + safeFilePart(p.meta.locationName) + '-Report.html';
    if (downloadFile(fname, html, 'text/html;charset=utf-8')) {
      toast(t('common.reportDownloaded'));
    } else {
      toast(t('common.backupFailed'));
    }
  }
});

/* STRICT ZERO-RE-RENDER INPUT HANDLER */
document.addEventListener('input', e => {
  /* Search bar updates ONLY #projCardsHost so search input never loses focus */
  if (e.target.id === 'projSearch') {
    app.search = e.target.value;
    const host = $('#projCardsHost');
    if (host) host.innerHTML = projectCardsHtml();
    return;
  }

  const el = e.target.closest('[data-bind]');
  if (!el) return;
  const p = getActiveProject();
  if (!p) return;

  const path = el.dataset.bind;
  const val = el.type === 'checkbox' ? el.checked : el.value;
  setPath(p, path, val);
  if (path === 'baseline.monthlyOrders') p.baseline.ordersEstimated = false;
  if (/^uplift\.[a-z]+\.pct$/.test(path)) {
    p.uplift[path.split('.')[1]].custom = true;
  }
  p.updatedAt = new Date().toISOString();
  saveState();
  syncOutputs();
});

document.addEventListener('change', e => {
  const el = e.target.closest('[data-bind]');
  if (!el) return;
  if (el.type === 'checkbox' || el.tagName === 'SELECT') {
    const p = getActiveProject();
    if (!p) return;
    setPath(p, el.dataset.bind, el.type === 'checkbox' ? el.checked : el.value);
    p.updatedAt = new Date().toISOString();
    saveState();
    syncOutputs();
  }
});

/* Escape key closes modal */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});

/* Import Project JSON (single project, all-project export, or legacy array) */
const impInput = $('#importFile');
if (impInput) {
  impInput.addEventListener('change', e => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const result = parseImportPayload(reader.result);
        const added = importProjects(result.items);
        if (added > 0) {
          saveState();
          mountView();
          toast(result.skipped
            ? t('common.importedSkipped', { count: added, skipped: result.skipped })
            : t('common.imported', { count: added }));
        } else {
          toast(t('common.invalidFile'));
        }
      } catch (err) {
        toast(t('common.importFailed'));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });
}
