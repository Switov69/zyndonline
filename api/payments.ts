import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';
import { handleOptions, formatPayment } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const sql = getDb();
  const action = (req.query.action as string) || req.body?.action;

  // ── GET /api/payments?action=list&adminId=xxx ─────────────────────────────
  if (action === 'list') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const adminId = req.query.adminId as string;
      if (!adminId) return res.status(403).json({ error: 'Forbidden' });
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });
      const rows = await sql`SELECT * FROM payment_requests ORDER BY requested_at DESC`;
      return res.status(200).json({ payments: rows.map(formatPayment) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/payments?action=submit ─────────────────────────────────────
  if (action === 'submit') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { userId, username } = req.body || {};
      if (!userId || !username) return res.status(400).json({ error: 'Missing fields' });
      const existing = await sql`SELECT id FROM payment_requests WHERE user_id = ${userId} AND status = 'pending' LIMIT 1`;
      if (existing.length) return res.status(409).json({ error: 'Already pending' });
      const id = 'pay_' + Date.now();
      const rows = await sql`
        INSERT INTO payment_requests (id, user_id, username, status, requested_at)
        VALUES (${id}, ${userId}, ${username}, 'pending', NOW())
        RETURNING *
      `;
      return res.status(201).json({ payment: formatPayment(rows[0]) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/payments?action=approve ────────────────────────────────────
  if (action === 'approve') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { adminId, requestId } = req.body || {};
      if (!adminId || !requestId) return res.status(400).json({ error: 'Missing fields' });
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });
      const reqRows = await sql`SELECT * FROM payment_requests WHERE id = ${requestId} LIMIT 1`;
      if (!reqRows.length) return res.status(404).json({ error: 'Request not found' });
      const expiresAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
      await sql`UPDATE users SET sub_active = true, sub_expires_at = ${expiresAt} WHERE id = ${reqRows[0].user_id}`;
      await sql`UPDATE payment_requests SET status = 'approved', resolved_at = NOW() WHERE id = ${requestId}`;
      return res.status(200).json({ ok: true, expiresAt });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/payments?action=reject ─────────────────────────────────────
  if (action === 'reject') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { adminId, requestId } = req.body || {};
      if (!adminId || !requestId) return res.status(400).json({ error: 'Missing fields' });
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });
      await sql`UPDATE payment_requests SET status = 'rejected', resolved_at = NOW() WHERE id = ${requestId}`;
      return res.status(200).json({ ok: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
