/* =====================================================================
   HAHA Location Replacement Assessment v2.3
   ===================================================================== */
'use strict';

const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}
function nf(v, d) {
  const n = Number(v);
  const digits = d == null ? 0 : d;
  return (isFinite(n) ? n : 0).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}
function money(v, d) {
  const n = Number(v) || 0;
  return (n < 0 ? '-' : '') + '$' + nf(Math.abs(n), d == null ? 0 : d);
}
function signedMoney(v, d) {
  const n = Number(v) || 0;
  return (n >= 0 ? '+' : '-') + '$' + nf(Math.abs(n), d == null ? 0 : d);
}
function pct(v, d) { return nf(v, d == null ? 1 : d) + '%'; }
function monthsFmt(v) { return isFinite(v) ? nf(v, 1) + ' ' + t('common.mo') : t('common.noPayback'); }
function todayStr() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

function getPath(obj, path) { return path.split('.').reduce((o, k) => o == null ? undefined : o[k], obj); }
function setPath(obj, path, val) {
  const parts = path.split('.');
  const last = parts.pop();
  let cur = obj;
  parts.forEach(k => { if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {}; cur = cur[k]; });
  cur[last] = val;
}

let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

function downloadFile(filename, content, mime) {
  try {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch (e) {}
      a.remove();
    }, 500);
    return true;
  } catch (e) {
    return false;
  }
}

function collectAppCss() {
  const inline = Array.from(document.querySelectorAll('style')).map(el => el.textContent || '').join('\n');
  if (inline.trim()) return inline;
  let css = '';
  Array.from(document.styleSheets).forEach(sheet => {
    try {
      css += Array.from(sheet.cssRules).map(rule => rule.cssText).join('\n') + '\n';
    } catch (e) {}
  });
  return css;
}
