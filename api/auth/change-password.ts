import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, oldPassword, newPassword } = req.body || {};
    if (!userId || !oldPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });

    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
    if (!rows.length) return res.status(404).json({ error: 'User not found' });

    if (rows[0].password_hash !== oldPassword) return res.status(401).json({ error: 'Неверный текущий пароль' });
    if (oldPassword === newPassword) return res.status(400).json({ error: 'Новый пароль совпадает с текущим' });

    await sql`UPDATE users SET password_hash = ${newPassword} WHERE id = ${userId}`;
    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
