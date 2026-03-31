import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { adminId, requestId } = req.body || {};
    if (!adminId || !requestId) return res.status(400).json({ error: 'Missing fields' });

    const sql = getDb();
    const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
    if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });

    await sql`
      UPDATE payment_requests SET status = 'rejected', resolved_at = NOW()
      WHERE id = ${requestId}
    `;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
