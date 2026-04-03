const { getDb } = require('./_db');
const { handleOptions, formatPayment } = require('./_utils');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const action = req.query.action || (req.body && req.body.action);

  // ── list ──────────────────────────────────────────────────────────────────
  if (action === 'list') {
    try {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const adminId = req.query.adminId;
      if (!adminId) return res.status(403).json({ error: 'Forbidden' });
      const sql = getDb();
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });
      const rows = await sql`SELECT * FROM payment_requests ORDER BY requested_at DESC`;
      return res.status(200).json({ payments: rows.map(formatPayment) });
    } catch (e) {
      console.error('payments list error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── submit ────────────────────────────────────────────────────────────────
  if (action === 'submit') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { userId, username } = req.body || {};
      if (!userId || !username) return res.status(400).json({ error: 'Missing fields' });
      const sql = getDb();
      const existing = await sql`
        SELECT id FROM payment_requests WHERE user_id = ${userId} AND status = 'pending' LIMIT 1
      `;
      if (existing.length) return res.status(409).json({ error: 'Already pending' });
      const id = 'pay_' + Date.now();
      const rows = await sql`
        INSERT INTO payment_requests (id, user_id, username, status, requested_at)
        VALUES (${id}, ${userId}, ${username}, 'pending', NOW())
        RETURNING *
      `;
      return res.status(201).json({ payment: formatPayment(rows[0]) });
    } catch (e) {
      console.error('submit payment error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── approve ───────────────────────────────────────────────────────────────
  if (action === 'approve') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { adminId, requestId } = req.body || {};
      if (!adminId || !requestId) return res.status(400).json({ error: 'Missing fields' });
      const sql = getDb();
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });
      const reqRows = await sql`SELECT * FROM payment_requests WHERE id = ${requestId} LIMIT 1`;
      if (!reqRows.length) return res.status(404).json({ error: 'Request not found' });
      const payReq = reqRows[0];
      const expiresAt = new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString();
      await sql`UPDATE users SET sub_active = true, sub_expires_at = ${expiresAt} WHERE id = ${payReq.user_id}`;
      await sql`UPDATE payment_requests SET status = 'approved', resolved_at = NOW() WHERE id = ${requestId}`;
      // Notify the user that their Premium was activated
      const notifId = 'n_premium_' + Date.now();
      await sql`
        INSERT INTO notifications (id, for_user_id, text, read, created_at)
        VALUES (${notifId}, ${payReq.user_id}, ${'🎉 Ваша подписка Premium активирована! Действует 3 недели.'}, false, NOW())
      `;
      return res.status(200).json({ ok: true, expiresAt });
    } catch (e) {
      console.error('approve error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── reject ────────────────────────────────────────────────────────────────
  if (action === 'reject') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { adminId, requestId } = req.body || {};
      if (!adminId || !requestId) return res.status(400).json({ error: 'Missing fields' });
      const sql = getDb();
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });
      await sql`UPDATE payment_requests SET status = 'rejected', resolved_at = NOW() WHERE id = ${requestId}`;
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('reject error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
};
