const { getDb } = require('./_db');
const { handleOptions, formatUser } = require('./_utils');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const action = req.query.action || (req.body && req.body.action);

  // ── login ────────────────────────────────────────────────────────────────
  if (action === 'login') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { username, password } = req.body || {};
      if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
      const sql = getDb();
      const rows = await sql`
        SELECT * FROM users WHERE LOWER(username) = LOWER(${username}) AND password_hash = ${password} LIMIT 1
      `;
      if (!rows.length) return res.status(401).json({ error: 'Неверный логин или пароль' });
      if (rows[0].blocked) return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });
      return res.status(200).json({ user: formatUser(rows[0]) });
    } catch (e) {
      console.error('login error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── register ─────────────────────────────────────────────────────────────
  if (action === 'register') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { username, password, telegram } = req.body || {};
      if (!username || !password || !telegram) return res.status(400).json({ error: 'Missing fields' });
      const sql = getDb();
      const existing = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1`;
      if (existing.length) return res.status(409).json({ error: 'Пользователь с таким никнеймом уже существует' });
      const id = String(Math.floor(Math.random() * 9000000000 + 1000000000));
      const today = new Date().toISOString().split('T')[0];
      const rows = await sql`
        INSERT INTO users (id, username, password_hash, telegram, joined_at, is_admin, blocked, rating_count, rating_total, sub_active)
        VALUES (${id}, ${username}, ${password}, ${telegram}, ${today}, false, false, 0, 0, false)
        RETURNING *
      `;
      return res.status(201).json({ user: formatUser(rows[0]) });
    } catch (e) {
      console.error('register error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  return res.status(400).json({ error: 'Unknown action. Use ?action=login or ?action=register' });
};
