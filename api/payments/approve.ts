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

    const reqRows = await sql`SELECT * FROM payment_requests WHERE id = ${requestId} LIMIT 1`;
    if (!reqRows.length) return res.status(404).json({ error: 'Request not found' });

    const payReq = reqRows[0];

    // Grant subscription for 3 weeks
    const expiresAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE users SET sub_active = true, sub_expires_at = ${expiresAt}
      WHERE id = ${payReq.user_id}
    `;
    await sql`
      UPDATE payment_requests SET status = 'approved', resolved_at = NOW()
      WHERE id = ${requestId}
    `;

    return res.status(200).json({ ok: true, expiresAt });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
