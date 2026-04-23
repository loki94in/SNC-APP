const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper for generic error responses
const handleError = (res, err) => res.status(500).json({ success: false, error: err.message });

// --- PATIENTS API ---

// Get all patients
app.get('/api/patients', (req, res) => {
    const { query } = req.query;
    let sql = "SELECT * FROM patients";
    let params = [];
    
    if (query) {
        sql += " WHERE name LIKE ? OR phone LIKE ? OR regNo LIKE ?";
        params = [`%${query}%`, `%${query}%`, `%${query}%`];
    }
    
    db.all(sql, params, (err, rows) => {
        if (err) return handleError(res, err);
        res.json(rows);
    });
});

// Create patient
app.post('/api/patients', (req, res) => {
    const { name, phone, age, gender, address, occupation, conditions, diet, history } = req.body;
    
    // Basic server-side validation
    if (!name || !phone) return res.status(400).json({ error: "Name and Phone are required" });

    const id = uuidv4();
    const regNo = `SNC-${Date.now().toString().slice(-6)}`;
    
    const sql = `INSERT INTO patients (id, regNo, name, phone, age, gender, address, occupation, conditions, diet, history) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [id, regNo, name, phone, age, gender, address, occupation, JSON.stringify(conditions), JSON.stringify(diet), history];
    
    db.run(sql, params, function(err) {
        if (err) return handleError(res, err);
        res.status(201).json({ id, regNo, ...req.body });
    });
});

// Update patient
app.put('/api/patients/:id', (req, res) => {
    const { id } = req.params;
    const { name, phone, age, gender, address, occupation, conditions, diet, history } = req.body;
    
    if (!name || !phone) return res.status(400).json({ error: "Name and Phone are required" });

    const sql = `UPDATE patients SET name=?, phone=?, age=?, gender=?, address=?, occupation=?, conditions=?, diet=?, history=? WHERE id=?`;
    const params = [name, phone, age, gender, address, occupation, JSON.stringify(conditions), JSON.stringify(diet), history, id];
    
    db.run(sql, params, function(err) {
        if (err) return handleError(res, err);
        res.json({ success: true, message: "Updated successfully" });
    });
});

// --- SESSIONS API ---

// Get all sessions
app.get('/api/sessions', (req, res) => {
    const sql = `
        SELECT s.*, p.name as patientName 
        FROM sessions s 
        JOIN patients p ON s.patientId = p.id 
        ORDER BY s.date DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) return handleError(res, err);
        res.json(rows);
    });
});

// Get sessions for a specific patient
app.get('/api/sessions/:patientId', (req, res) => {
    const { patientId } = req.params;
    db.all("SELECT * FROM sessions WHERE patientId = ? ORDER BY date DESC", [patientId], (err, rows) => {
        if (err) return handleError(res, err);
        res.json(rows);
    });
});

app.post('/api/sessions', (req, res) => {
    const { patientId, assessment, painLevel, mobility, techniques } = req.body;
    
    if (!patientId || !assessment) return res.status(400).json({ error: "Patient ID and Assessment are required" });

    const id = uuidv4();
    const date = new Date().toISOString();
    
    db.run("INSERT INTO sessions (id, patientId, date, assessment, painLevel, mobility, techniques) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, patientId, date, assessment, painLevel, mobility, JSON.stringify(techniques)],
        function(err) {
            if (err) return handleError(res, err);
            res.status(201).json({ id, date, ...req.body });
        }
    );
});

// --- PAYMENTS API ---

app.get('/api/payments', (req, res) => {
    db.all("SELECT p.*, pat.name as patientName FROM payments p JOIN patients pat ON p.patientId = pat.id ORDER BY p.date DESC", [], (err, rows) => {
        if (err) return handleError(res, err);
        res.json(rows);
    });
});

app.get('/api/revenue', (req, res) => {
    db.get("SELECT SUM(amount) as total FROM payments WHERE status = 'PAID'", [], (err, row) => {
        if (err) return handleError(res, err);
        res.json({ total: row.total || 0 });
    });
});

app.post('/api/payments', (req, res) => {
    const { patientId, amount, method, status } = req.body;
    
    if (!patientId || !amount) return res.status(400).json({ error: "Patient ID and Amount are required" });

    const id = uuidv4();
    const date = new Date().toISOString();
    
    db.run("INSERT INTO payments (id, patientId, date, amount, method, status) VALUES (?, ?, ?, ?, ?, ?)",
        [id, patientId, date, amount, method, status],
        function(err) {
            if (err) return handleError(res, err);
            res.status(201).json({ id, date, ...req.body });
        }
    );
});

// --- SETTINGS API ---

app.get('/api/settings', (req, res) => {
    db.all("SELECT * FROM settings", [], (err, rows) => {
        if (err) return handleError(res, err);
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json(settings);
    });
});

app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: "Setting key is required" });

    db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value], (err) => {
        if (err) return handleError(res, err);
        res.json({ success: true });
    });
});

app.listen(PORT, () => {
    console.log(`SNC Server running on http://localhost:${PORT}`);
});
