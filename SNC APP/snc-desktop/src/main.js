const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

// ─── LOGGING ───────────────────────────────────────────────────
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('SNC Desktop starting...');

// ─── SINGLE INSTANCE ───────────────────────────────────────────
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0];
  if (win) {
    if (win.isMinimized()) win.restore();
    win.focus();
  }
});

// ─── DB PATH ───────────────────────────────────────────────────
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'snc.db');

// ─── JSON-FILE DATABASE ────────────────────────────────────────
function JSONDB(filepath) {
  this.filepath = filepath;
  this.data = {};
  this._load();
}

JSONDB.prototype._load = function () {
  try {
    if (fs.existsSync(this.filepath)) {
      const raw = fs.readFileSync(this.filepath, 'utf-8');
      this.data = JSON.parse(raw);
      log.info('DB loaded from', this.filepath);
    } else {
      this.data = {};
      log.info('DB created fresh at', this.filepath);
    }
  } catch (e) {
    log.error('DB load error:', e.message);
    this.data = {};
  }
};

JSONDB.prototype._save = function () {
  try {
    const dir = path.dirname(this.filepath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.filepath, JSON.stringify(this.data, null, 2), 'utf-8');
  } catch (e) {
    log.error('DB save error:', e.message);
  }
};

JSONDB.prototype.get = function (key) {
  return this.data[key] !== undefined ? this.data[key] : null;
};

JSONDB.prototype.set = function (key, value) {
  this.data[key] = value;
  this._save();
  return true;
};

JSONDB.prototype.push = function (key, item) {
  if (!Array.isArray(this.data[key])) this.data[key] = [];
  this.data[key].push(item);
  this._save();
  return item;
};

JSONDB.prototype.find = function (key, fn) {
  const arr = this.data[key] || [];
  return arr.find(fn) || null;
};

JSONDB.prototype.filter = function (key, fn) {
  const arr = this.data[key] || [];
  return arr.filter(fn);
};

JSONDB.prototype.delete = function (key, id) {
  const arr = this.data[key] || [];
  const idx = arr.findIndex(function (item) { return item.id === id; });
  if (idx !== -1) {
    arr.splice(idx, 1);
    this.data[key] = arr;
    this._save();
    return true;
  }
  return false;
};

JSONDB.prototype.update = function (key, id, updates) {
  const arr = this.data[key] || [];
  const idx = arr.findIndex(function (item) { return item.id === id; });
  if (idx !== -1) {
    arr[idx] = Object.assign({}, arr[idx], updates);
    this.data[key] = arr;
    this._save();
    return arr[idx];
  }
  return null;
};

JSONDB.prototype.getAll = function (key) {
  return this.data[key] || [];
};

JSONDB.prototype.getSnapshot = function () {
  return JSON.parse(JSON.stringify(this.data));
};

JSONDB.prototype.replaceAll = function (snapshot) {
  this.data = snapshot || {};
  this._save();
};

let db;

function initDB() {
  db = new JSONDB(dbPath);
  log.info('Database initialized at:', dbPath);
}

// ─── IPC HANDLERS ──────────────────────────────────────────────
function setupIPC() {
  ipcMain.handle('db:get', function (event, key) {
    return db.get(key);
  });

  ipcMain.handle('db:set', function (event, key, value) {
    db.set(key, value);
    return true;
  });

  ipcMain.handle('db:push', function (event, key, item) {
    return db.push(key, item);
  });

  ipcMain.handle('db:find', function (event, key, fnBody) {
    try {
      const fn = new Function('item', 'return !!(' + fnBody + ')');
      return db.find(key, fn);
    } catch (e) {
      log.error('db:find error:', e.message);
      return null;
    }
  });

  ipcMain.handle('db:filter', function (event, key, fnBody) {
    try {
      const fn = new Function('item', 'return !!(' + fnBody + ')');
      return db.filter(key, fn);
    } catch (e) {
      log.error('db:filter error:', e.message);
      return [];
    }
  });

  ipcMain.handle('db:delete', function (event, key, id) {
    return db.delete(key, id);
  });

  ipcMain.handle('db:update', function (event, key, id, updates) {
    return db.update(key, id, updates);
  });

  ipcMain.handle('db:getAll', function (event, key) {
    return db.getAll(key);
  });

  ipcMain.handle('db:getAllKeys', function () {
    return Object.keys(db.data);
  });

  ipcMain.handle('db:getSnapshot', function () {
    return db.getSnapshot();
  });

  // Sync IPC — only used once at startup to prime the renderer cache
  ipcMain.on('db:getSnapshotSync', function (event) {
    event.returnValue = db.getSnapshot();
  });

  ipcMain.handle('db:path', function () {
    return dbPath;
  });

  ipcMain.handle('db:importData', function (event, snapshot) {
    db.replaceAll(snapshot);
    return true;
  });

  ipcMain.handle('db:exportData', function () {
    return db.getSnapshot();
  });

  log.info('IPC handlers registered');
}

// ─── WINDOW ───────────────────────────────────────────────────
let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'SNC Patient Register',
    backgroundColor: '#0d4a2c',
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false,
    },
  });

  // Load the HTML — preload runs before any renderer JS
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.on('did-finish-load', function () {
    log.info('Page finished loading');
  });

  mainWindow.webContents.on('render-process-gone', function (event, details) {
    log.error('Renderer process gone:', details.reason);
  });

  mainWindow.on('closed', function () {
    mainWindow = null;
  });

  mainWindow.once('ready-to-show', function () {
    mainWindow.show();
    log.info('Main window shown');
  });
}

// ─── APP LIFECYCLE ─────────────────────────────────────────────
app.whenReady().then(function () {
  log.info('App ready');
  initDB();
  setupIPC();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    log.info('All windows closed, quitting');
    app.quit();
  }
});

app.on('before-quit', function () {
  log.info('App quitting');
});
