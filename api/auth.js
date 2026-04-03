const bcrypt = require('bcryptjs');
const { getDb } = require('./_db');
const { handleOptions, formatUser } = require('./_utils');

const SALT_ROUNDS = 10;

// Returns true if the string looks like a bcrypt hash (starts with $2a$ or $2b$)
function isBcryptHash(str) {
  return typeof str === 'string' && /^\$2[ab]\$/.test(str);
}

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const action = req.query.action || (req.body && req.body.action);

  // ── login ─────────────────────────────────────────────────────────────────
  if (action === 'login') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { username, password } = req.body || {};
      if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

      const sql = getDb();
      // Fetch user by username only — we compare password separately
      const rows = await sql`
        SELECT * FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1
      `;
      if (!rows.length) return res.status(401).json({ error: 'Неверный логин или пароль' });

      const user = rows[0];
      let passwordOk = false;

      if (isBcryptHash(user.password_hash)) {
        // Modern path: bcrypt compare
        passwordOk = await bcrypt.compare(password, user.password_hash);
      } else {
        // Legacy path: plaintext comparison (for existing accounts before migration)
        passwordOk = user.password_hash === password;
        if (passwordOk) {
          // Silently upgrade plaintext → bcrypt hash on successful login
          const newHash = await bcrypt.hash(password, SALT_ROUNDS);
          await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${user.id}`;
        }
      }

      if (!passwordOk) return res.status(401).json({ error: 'Неверный логин или пароль' });
      if (user.blocked) return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });

      return res.status(200).json({ user: formatUser(user) });
    } catch (e) {
      console.error('login error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── register ──────────────────────────────────────────────────────────────
  if (action === 'register') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { username, password, telegram } = req.body || {};
      if (!username || !password || !telegram) return res.status(400).json({ error: 'Missing fields' });

      const sql = getDb();
      const existing = await sql`
        SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1
      `;
      if (existing.length) return res.status(409).json({ error: 'Пользователь с таким никнеймом уже существует' });

      const id = String(Math.floor(Math.random() * 9000000000 + 1000000000));
      const today = new Date().toISOString().split('T')[0];
      // Hash the password before storing — never save plaintext for new users
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      const rows = await sql`
        INSERT INTO users (id, username, password_hash, telegram, joined_at, is_admin, blocked, rating_count, rating_total, sub_active)
        VALUES (${id}, ${username}, ${hashedPassword}, ${telegram}, ${today}, false, false, 0, 0, false)
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
