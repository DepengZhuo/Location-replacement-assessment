/* =====================================================================
   HAHA Location Replacement Assessment v2.3
   ===================================================================== */
'use strict';

const _memStore = new Map();
const storageStatus = { available: true, lastError: '' };

function storageProbe() {
  try {
    const k = '__haha_storage_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    storageStatus.available = true;
    storageStatus.lastError = '';
  } catch (e) {
    storageStatus.available = false;
    storageStatus.lastError = e && e.message ? e.message : 'localStorage unavailable';
  }
}

const safeStorage = {
  get(key) {
    try {
      const val = window.localStorage.getItem(key);
      return val !== null ? val : (_memStore.has(key) ? _memStore.get(key) : null);
    } catch (e) {
      return _memStore.has(key) ? _memStore.get(key) : null;
    }
  },
  set(key, val) {
    const s = String(val);
    _memStore.set(key, s);
    try {
      window.localStorage.setItem(key, s);
      return true;
    } catch (e) {
      storageStatus.available = false;
      storageStatus.lastError = e && e.message ? e.message : 'localStorage write failed';
      return false;
    }
  },
  remove(key) {
    _memStore.delete(key);
    try { window.localStorage.removeItem(key); } catch (e) {}
  }
};

storageProbe();

/* Merge legacy / imported projects with the current schema without losing
   values the user already entered. Returns null for unusable payloads. */
function normalizeProject(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  if (!raw.meta || typeof raw.meta !== 'object') return null;

  const base = createBlankProject(typeof raw.meta.locationName === 'string' ? raw.meta.locationName : '');
  const p = Object.assign({}, base, raw);

  p.id = (typeof raw.id === 'string' && raw.id) ? raw.id : base.id;
  p.updatedAt = raw.updatedAt || new Date().toISOString();
  p.schemaVersion = 2;

  p.meta = Object.assign({}, base.meta, raw.meta);
  p.meta.locationName = typeof p.meta.locationName === 'string' ? p.meta.locationName : '';
  p.meta.venue = typeof p.meta.venue === 'string' && p.meta.venue ? p.meta.venue : base.meta.venue;
  p.meta.city = typeof p.meta.city === 'string' ? p.meta.city : '';
  p.meta.state = typeof p.meta.state === 'string' ? p.meta.state : '';
  p.meta.date = typeof p.meta.date === 'string' && p.meta.date ? p.meta.date : todayStr();

  p.machine = Object.assign({}, base.machine, raw.machine);
  p.machine.type = typeof p.machine.type === 'string' && p.machine.type ? p.machine.type : base.machine.type;
  p.machine.age = (p.machine.age === null || p.machine.age === undefined) ? '' : p.machine.age;
  p.machine.condition = ['good', 'fair', 'poor', ''].includes(p.machine.condition) ? p.machine.condition : base.machine.condition;
  p.machine.monitoring = ['yes', 'no', ''].includes(p.machine.monitoring) ? p.machine.monitoring : base.machine.monitoring;
  p.machine.payments = Array.isArray(p.machine.payments)
    ? p.machine.payments.filter(x => ['coin', 'bill', 'card', 'mobile'].includes(x))
    : base.machine.payments.slice();

  p.diag = Object.assign({}, base.diag, raw.diag);
  ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].forEach(k => {
    const v = p.diag[k];
    p.diag[k] = (v === 0 || v === 5 || v === 10) ? Number(v) : null;
  });

  p.baseline = Object.assign({}, base.baseline, raw.baseline);
  p.site = Object.assign({}, base.site, raw.site);
  p.uplift = Object.assign({}, base.uplift, raw.uplift);
  ['variety', 'basket', 'stock', 'payment'].forEach(k => {
    p.uplift[k] = Object.assign({}, base.uplift[k], raw.uplift && raw.uplift[k]);
    if (!['yes', 'partial', 'no', ''].includes(p.uplift[k].accept)) p.uplift[k].accept = base.uplift[k].accept;
  });
  p.haha = Object.assign({}, base.haha, raw.haha);
  p.invest = Object.assign({}, base.invest, raw.invest);
  p.invest.finance = Object.assign({}, base.invest.finance, raw.invest && raw.invest.finance);
  return p;
}

function loadSavedProjects() {
  try {
    const raw = safeStorage.get(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.map(normalizeProject).filter(Boolean);
    if (parsed && Array.isArray(parsed.projects)) return parsed.projects.map(normalizeProject).filter(Boolean);
    if (parsed && parsed.project) return [normalizeProject(parsed.project)].filter(Boolean);
  } catch (e) {}
  return [];
}

const app = {
  lang: safeStorage.get(LANG_KEY) || 'en',
  view: 'dashboard', // 'dashboard' | 'projects' | 'step1' | 'step2' | 'step3'
  projects: loadSavedProjects(),
  activeId: safeStorage.get(ACTIVE_KEY) || null,
  search: '',
  costExpanded: false,
  storageError: !storageStatus.available
};

function saveState() {
  const ok = safeStorage.set(STORAGE_KEY, JSON.stringify(app.projects));
  if (app.activeId) safeStorage.set(ACTIVE_KEY, app.activeId);
  else safeStorage.remove(ACTIVE_KEY);
  safeStorage.set(LANG_KEY, app.lang);
  app.storageError = !ok || !storageStatus.available;
  return ok;
}

function getActiveProject() {
  return app.projects.find(p => p.id === app.activeId) || null;
}

function backupProjectPayload(p) {
  return {
    schemaVersion: 2,
    appVersion: '2.3',
    exportedAt: new Date().toISOString(),
    project: p
  };
}

function exportAllPayload() {
  return {
    schemaVersion: 2,
    appVersion: '2.3',
    exportedAt: new Date().toISOString(),
    projects: app.projects
  };
}

function safeFilePart(value) {
  return String(value || 'project')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60) || 'project';
}

function backupProjectFile(p) {
  if (!p) return false;
  const name = 'HAHA-' + safeFilePart(p.meta.locationName) + '-' + todayStr() + '.json';
  return downloadFile(name, JSON.stringify(backupProjectPayload(p), null, 2), 'application/json');
}

function exportAllFile() {
  const name = 'HAHA-All-Projects-' + todayStr() + '.json';
  return downloadFile(name, JSON.stringify(exportAllPayload(), null, 2), 'application/json');
}

function parseImportPayload(text) {
  const data = JSON.parse(text);
  let items = null;
  if (Array.isArray(data)) items = data;
  else if (data && Array.isArray(data.projects)) items = data.projects;
  else if (data && data.project) items = [data.project];
  else if (data && data.meta) items = [data];

  if (!items) return { items: [], skipped: 0, invalid: true };

  const valid = [];
  let skipped = 0;
  items.forEach(raw => {
    const p = normalizeProject(raw);
    if (p) valid.push(p); else skipped++;
  });
  return { items: valid, skipped, invalid: false };
}

function importProjects(items) {
  let added = 0;
  (items || []).forEach(p => {
    if (!p) return;
    p.id = 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    p.updatedAt = p.updatedAt || new Date().toISOString();
    app.projects.unshift(p);
    added++;
  });
  return added;
}
