import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions, formatUser } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password, telegram } = req.body || {};
    if (!username || !password || !telegram) return res.status(400).json({ error: 'Missing fields' });

    const sql = getDb();

    // Check unique username
    const existing = await sql`SELECT id FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1`;
    if (existing.length > 0) return res.status(409).json({ error: 'Пользователь с таким никнеймом уже существует' });

    // 10-digit random ID
    const id = String(Math.floor(Math.random() * 9000000000 + 1000000000));
    const today = new Date().toISOString().split('T')[0];

    const rows = await sql`
      INSERT INTO users (id, username, password_hash, telegram, joined_at, is_admin, blocked, rating_count, rating_total, sub_active)
      VALUES (${id}, ${username}, ${password}, ${telegram}, ${today}, false, false, 0, 0, false)
      RETURNING *
    `;

    return res.status(201).json({ user: formatUser(rows[0]) });
  } catch (e: any) {
    console.error('register error', e);
    return res.status(500).json({ error: e.message });
  }
}
