import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions, formatUser } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const sql = getDb();
    const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });

    return res.status(200).json({ user: formatUser(rows[0]) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
