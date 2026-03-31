import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions, formatUser } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    const sql = getDb();
    const rows = await sql`
      SELECT * FROM users
      WHERE LOWER(username) = LOWER(${username})
        AND password_hash = ${password}
      LIMIT 1
    `;

    if (rows.length === 0) return res.status(401).json({ error: 'Неверный логин или пароль' });
    const user = rows[0];
    if (user.blocked) return res.status(403).json({ error: 'Ваш аккаунт заблокирован' });

    return res.status(200).json({ user: formatUser(user) });
  } catch (e: any) {
    console.error('login error', e);
    return res.status(500).json({ error: e.message });
  }
}
