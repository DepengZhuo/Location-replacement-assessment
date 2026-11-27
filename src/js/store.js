/* =====================================================================
   HAHA Location Replacement Assessment v2.2
   ===================================================================== */
'use strict';

const _memStore = new Map();
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
    try { window.localStorage.setItem(key, s); } catch (e) {}
  },
  remove(key) {
    _memStore.delete(key);
    try { window.localStorage.removeItem(key); } catch (e) {}
  }
};

function loadSavedProjects() {
  try {
    const raw = safeStorage.get(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

const app = {
  lang: safeStorage.get(LANG_KEY) || 'en',
  view: 'dashboard', // 'dashboard' | 'projects' | 'step1' | 'step2' | 'step3'
  projects: loadSavedProjects(),
  activeId: safeStorage.get(ACTIVE_KEY) || null,
  search: '',
  costExpanded: false
};

function saveState() {
  safeStorage.set(STORAGE_KEY, JSON.stringify(app.projects));
  if (app.activeId) safeStorage.set(ACTIVE_KEY, app.activeId);
  else safeStorage.remove(ACTIVE_KEY);
  safeStorage.set(LANG_KEY, app.lang);
}

function getActiveProject() {
  return app.projects.find(p => p.id === app.activeId) || null;
}
