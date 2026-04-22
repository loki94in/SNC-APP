const { contextBridge, ipcRenderer } = require('electron');

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  PRELOAD — DB Bridge
//
//  Strategy:
//   • On startup, sendSync to main for the DB snapshot (blocks ~1ms)
//     Fills the in-memory cache synchronously — NO async latency.
//   • Read ops (get/set/push/delete/update/find/filter) → synchronous
//   • find() and filter() → sendSync to main process where all data lives
//     (closures with outer-scope vars like activePatientId are preserved)
//   • All other ops → IPC invoke (fire-and-forget async writes)
//   • Single sendSync per find/filter call — not ideal but correctness-first
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// ── Startup: block until snapshot is loaded ───────────────────
let _cache = {};
try {
  _cache = ipcRenderer.sendSync('db:getSnapshotSync') || {};
} catch (e) {
  _cache = {};
}

// ── Matchers ───────────────────────────────────────────────────
function extractBody(fn) {
  if (typeof fn !== 'function') return fn;
  const src = fn.toString();
  // Arrow: "u => u.id === x" or "(u) => u.id === x"
  const ma = src.match(/^\(?([^)]*)\)?\s*=>/);
  if (ma) return src.slice(ma[0].length);
  // Named: "function(u){ return ... }"
  const mf = src.match(/^function\s*\(\s*[^)]*\s*\)\s*\{\s*return\s*(.*?)\s*\}$/s);
  if (mf) return mf[1];
  return src;
}

function extractClosureVars(fn) {
  if (typeof fn !== 'function') return '[]';
  const src = fn.toString();
  // Strip arg list and arrow/function keyword + body
  const ma = src.match(/^\(?([^)]*)\)?\s*=>/);
  const body = ma ? src.slice(ma[0].length) : src;
  // Collect all identifiers (simple regex, handles most cases)
  const ids = [];
  const re = /[a-zA-Z_$][a-zA-Z0-9_$]*/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    ids.push(m[0]);
  }
  // Filter out JS keywords, primitives, and the parameter name
  const paramNames = ma ? ma[1].split(',').map(function (s) { return s.trim(); }).filter(Boolean) : [];
  const keywords = new Set(['return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'typeof', 'instanceof', 'new', 'void', 'delete', 'in', 'of', 'true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'console', 'Math', 'JSON', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'Symbol'].concat(paramNames));
  const unique = [];
  const seen = new Set();
  for (const id of ids) {
    if (!seen.has(id) && !keywords.has(id)) {
      seen.add(id);
      unique.push(id);
    }
  }
  return JSON.stringify(unique);
}

function collectVarValues(varNames) {
  try {
    const names = JSON.parse(varNames);
    const values = {};
    for (const n of names) {
      if (typeof window[n] !== 'undefined') {
        values[n] = window[n];
      }
    }
    return JSON.stringify(values);
  } catch (e) {
    return '{}';
  }
}

// ── DB interface ───────────────────────────────────────────────
const DB = {
  get: function (key) {
    return _cache[key] !== undefined ? _cache[key] : null;
  },

  set: function (key, value) {
    _cache[key] = value;
    ipcRenderer.invoke('db:set', key, value);
    return value;
  },

  push: function (key, item) {
    if (!Array.isArray(_cache[key])) _cache[key] = [];
    _cache[key].push(item);
    ipcRenderer.invoke('db:set', key, _cache[key]);
    return item;
  },

  // find() and filter() use sendSync so closures with outer-scope vars work
  find: function (key, fn) {
    if (typeof fn !== 'function') {
      // Fallback: iterate locally
      const arr = _cache[key] || [];
      return arr.find(function (item) { return !!fn(item); }) || null;
    }
    const body = extractBody(fn);
    const closureVars = collectVarValues(extractClosureVars(fn));
    try {
      const result = ipcRenderer.sendSync('db:findSync', key, body, closureVars);
      return result;
    } catch (e) {
      return null;
    }
  },

  filter: function (key, fn) {
    if (typeof fn !== 'function') {
      const arr = _cache[key] || [];
      return arr.filter(function (item) { return !!fn(item); });
    }
    const body = extractBody(fn);
    const closureVars = collectVarValues(extractClosureVars(fn));
    try {
      const result = ipcRenderer.sendSync('db:filterSync', key, body, closureVars);
      return result;
    } catch (e) {
      return [];
    }
  },

  delete: function (key, id) {
    const arr = _cache[key] || [];
    const idx = arr.findIndex(function (item) { return item.id === id; });
    if (idx !== -1) {
      arr.splice(idx, 1);
      _cache[key] = arr;
      ipcRenderer.invoke('db:set', key, _cache[key]);
      return true;
    }
    return false;
  },

  update: function (key, id, updates) {
    const arr = _cache[key] || [];
    const idx = arr.findIndex(function (item) { return item.id === id; });
    if (idx !== -1) {
      arr[idx] = Object.assign({}, arr[idx], updates);
      _cache[key] = arr;
      ipcRenderer.invoke('db:set', key, _cache[key]);
      return arr[idx];
    }
    return null;
  },

  getAll: function (key) {
    return _cache[key] || [];
  },

  // Import/export for backup/restore
  importData: function (snapshot) {
    _cache = snapshot || {};
    ipcRenderer.invoke('db:importData', _cache);
  },

  exportData: function () {
    return JSON.parse(JSON.stringify(_cache));
  },

  getPath: function () {
    return ipcRenderer.invoke('db:path');
  }
};

contextBridge.exposeInMainWorld('DB', DB);
