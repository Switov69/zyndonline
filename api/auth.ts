import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';
import { handleOptions, formatUser } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const sql = getDb();
  const action = (req.query.action as string) || req.body?.action;

  // ── POST /api/auth?action=login ───────────────────────────────────────────
  if (action === 'login') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { username, password } = req.body || {};
      if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
      const rows = await sql`
        SELECT * FROM users WHERE LOWER(username) = LOWER(${username}) AND password_hash = ${password} LIMIT 1
      `;
      if (!rows.length) return res.status(401).json({ error: 'Неверный логин или пароль' });
      if (rows[0].blocked) return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });
      return res.status(200).json({ user: formatUser(rows[0]) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/auth?action=register ────────────────────────────────────────
  if (action === 'register') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { username, password, telegram } = req.body || {};
      if (!username || !password || !telegram) return res.status(400).json({ error: 'Missing fields' });
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
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(400).json({ error: 'Unknown action. Use ?action=login or ?action=register' });
}
