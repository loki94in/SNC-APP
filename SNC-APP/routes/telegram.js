const express = require('express');
const { getDb, now } = require('../database');
const crypto = require('crypto');

const router = express.Router();
const { v4: uid } = require('uuid');

function getTokenKey() {
  const key = process.env.TELEGRAM_TOKEN_KEY || process.env.JWT_SECRET || 'snc-dev-key';
  return crypto.scryptSync(key, 'snc-tg-salt-v1', 32);
}

function encryptToken(token) {
  const key = getTokenKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64');
}

function decryptToken(enc) {
  const key = getTokenKey();
  const raw = Buffer.from(enc, 'base64');
  const iv = raw.subarray(0, 16);
  const authTag = raw.subarray(16, 32);
  const ct = raw.subarray(32);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}

function getTgConfig() {
  return getDb().prepare('SELECT * FROM telegram_config LIMIT 1').get();
}

// GET /api/telegram/config
router.get('/config', (req, res) => {
  const cfg = getTgConfig();
  return res.json({ config: cfg ? {
    status: cfg.status, chat_id: cfg.chat_id,
    alert_backup: cfg.alert_backup, alert_login_fail: cfg.alert_login_fail, alert_time: cfg.alert_time
  } : null });
});

// POST /api/telegram/token — async handler
router.post('/token', async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { token, chatId } = req.body;
  if (!token) return res.status(400).json({ error: 'Token required' });

  try {
    const test = await fetch(`https://api.telegram.org/bot${token}/getMe`).then(r => r.json());
    if (!test.ok) return res.status(400).json({ error: 'Could not verify token with Telegram' });

    const encrypted = encryptToken(token);
    const cfg = getTgConfig();
    if (cfg) {
      getDb().prepare('UPDATE telegram_config SET bot_token_enc=?,chat_id=?,status=? WHERE id=?')
        .run(encrypted, chatId || null, 'ACTIVE', cfg.id);
    } else {
      getDb().prepare('INSERT INTO telegram_config (id,bot_token_enc,chat_id,status,updated_at) VALUES (?,?,?,?,?)')
        .run(uid(), encrypted, chatId || null, 'ACTIVE', now());
    }
    return res.json({ ok: true, bot: test.result.username });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
});

// POST /api/telegram/test
router.post('/test', async (req, res) => {
  const { token } = req.body;
  try {
    const test = await fetch(`https://api.telegram.org/bot${token}/getMe`).then(r => r.json());
    return test.ok ? res.json({ ok: true, bot: test.result.username }) : res.json({ ok: false });
  } catch {
    return res.json({ ok: false });
  }
});

// POST /api/telegram/revoke
router.post('/revoke', (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const cfg = getTgConfig();
  if (cfg) {
    getDb().prepare("UPDATE telegram_config SET bot_token_enc=NULL,chat_id=NULL,status='REVOKED',updated_at=? WHERE id=?")
      .run(now(), cfg.id);
  }
  return res.json({ ok: true });
});

module.exports = router;
