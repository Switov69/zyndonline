import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions, formatUser } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { adminId } = req.query;
    if (!adminId) return res.status(403).json({ error: 'Forbidden' });

    const sql = getDb();
    const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId as string} LIMIT 1`;
    if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });

    const rows = await sql`SELECT * FROM users ORDER BY joined_at DESC`;
    return res.status(200).json({ users: rows.map((r: any) => ({ ...formatUser(r), password: r.password_hash })) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
