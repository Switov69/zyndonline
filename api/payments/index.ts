import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions, formatPayment } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const sql = getDb();

  // GET — admin gets all payment requests
  if (req.method === 'GET') {
    try {
      const { adminId } = req.query;
      if (!adminId) return res.status(403).json({ error: 'Forbidden' });
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId as string} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });

      const rows = await sql`SELECT * FROM payment_requests ORDER BY requested_at DESC`;
      return res.status(200).json({ payments: rows.map(formatPayment) });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — user submits payment request
  if (req.method === 'POST') {
    try {
      const { userId, username } = req.body || {};
      if (!userId || !username) return res.status(400).json({ error: 'Missing fields' });

      // Prevent duplicate pending
      const existing = await sql`SELECT id FROM payment_requests WHERE user_id = ${userId} AND status = 'pending' LIMIT 1`;
      if (existing.length > 0) return res.status(409).json({ error: 'Already pending' });

      const id = 'pay_' + Date.now();
      const rows = await sql`
        INSERT INTO payment_requests (id, user_id, username, status, requested_at)
        VALUES (${id}, ${userId}, ${username}, 'pending', NOW())
        RETURNING *
      `;
      return res.status(201).json({ payment: formatPayment(rows[0]) });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
