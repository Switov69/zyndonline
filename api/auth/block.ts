import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { adminId, targetUserId, blocked, data } = req.body || {};
    if (!adminId || !targetUserId) return res.status(400).json({ error: 'Missing fields' });

    const sql = getDb();
    const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
    if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });

    // General admin update (can include username, telegram, password, blocked, avatar)
    if (data) {
      const { username, telegram, password, blocked: b, avatar } = data;
      if (username !== undefined) {
        await sql`UPDATE users SET username = ${username} WHERE id = ${targetUserId}`;
        await sql`UPDATE jobs SET author_name = ${username} WHERE author_id = ${targetUserId}`;
        await sql`UPDATE jobs SET taken_by_name = ${username} WHERE taken_by_id = ${targetUserId}`;
      }
      if (telegram !== undefined) {
        await sql`UPDATE users SET telegram = ${telegram} WHERE id = ${targetUserId}`;
        await sql`UPDATE jobs SET author_telegram = ${telegram} WHERE author_id = ${targetUserId}`;
      }
      if (password !== undefined) {
        await sql`UPDATE users SET password_hash = ${password} WHERE id = ${targetUserId}`;
      }
      if (b !== undefined) {
        await sql`UPDATE users SET blocked = ${b} WHERE id = ${targetUserId}`;
      }
      if (avatar !== undefined) {
        await sql`UPDATE users SET avatar = ${avatar} WHERE id = ${targetUserId}`;
        await sql`UPDATE jobs SET author_avatar = ${avatar} WHERE author_id = ${targetUserId}`;
      }
    } else if (blocked !== undefined) {
      await sql`UPDATE users SET blocked = ${blocked} WHERE id = ${targetUserId}`;
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
