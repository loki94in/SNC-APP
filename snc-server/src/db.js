const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Patients Table
    db.run(`CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        regNo TEXT UNIQUE,
        name TEXT NOT NULL,
        phone TEXT,
        age INTEGER,
        gender TEXT,
        address TEXT,
        occupation TEXT,
        conditions TEXT,
        diet TEXT,
        history TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Sessions Table
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        date DATETIME,
        assessment TEXT,
        painLevel INTEGER,
        mobility TEXT,
        techniques TEXT,
        paymentId TEXT,
        FOREIGN KEY(patientId) REFERENCES patients(id)
    )`);

    // Payments Table
    db.run(`CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        patientId TEXT,
        sessionId TEXT,
        amount REAL,
        method TEXT,
        status TEXT,
        date DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(patientId) REFERENCES patients(id),
        FOREIGN KEY(sessionId) REFERENCES sessions(id)
    )`);

    // Settings Table (for admin pass etc)
    db.run(`CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);

    // Insert default admin password if not exists
    db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_password', 'admin123')`);
});

module.exports = db;
