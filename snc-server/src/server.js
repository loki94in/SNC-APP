const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

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
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// Create patient
app.post('/api/patients', (req, res) => {
    const { name, phone, age, gender, address, occupation, conditions, diet, history } = req.body;
    const id = uuidv4();
    const regNo = `SNC-${Date.now().toString().slice(-6)}`; // Simple regNo generator
    
    const sql = `INSERT INTO patients (id, regNo, name, phone, age, gender, address, occupation, conditions, diet, history) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const params = [id, regNo, name, phone, age, gender, address, occupation, JSON.stringify(conditions), JSON.stringify(diet), history];
    
    db.run(sql, params, function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ id, regNo, ...req.body });
    });
});

// --- SESSIONS API ---

app.get('/api/sessions/:patientId', (req, res) => {
    const { patientId } = req.params;
    db.all("SELECT * FROM sessions WHERE patientId = ? ORDER BY date DESC", [patientId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/sessions', (req, res) => {
    const { patientId, assessment, painLevel, mobility, techniques } = req.body;
    const id = uuidv4();
    const date = new Date().toISOString();
    
    db.run("INSERT INTO sessions (id, patientId, date, assessment, painLevel, mobility, techniques) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [id, patientId, date, assessment, painLevel, mobility, JSON.stringify(techniques)],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, date, ...req.body });
        }
    );
});

// --- PAYMENTS API ---

app.get('/api/payments', (req, res) => {
    db.all("SELECT p.*, pat.name as patientName FROM payments p JOIN patients pat ON p.patientId = pat.id ORDER BY p.date DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.post('/api/payments', (req, res) => {
    const { patientId, sessionId, amount, method, status } = req.body;
    const id = uuidv4();
    
    db.run("INSERT INTO payments (id, patientId, sessionId, amount, method, status) VALUES (?, ?, ?, ?, ?, ?)",
        [id, patientId, sessionId, amount, method, status],
        function(err) {
            if (err) return res.status(500).json({ error: err.message });
            res.status(201).json({ id, ...req.body });
        }
    );
});

app.listen(PORT, () => {
    console.log(`SNC Server running on http://localhost:${PORT}`);
});
