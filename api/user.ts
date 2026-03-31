import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';
import { handleOptions, formatUser } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const sql = getDb();
  const action = (req.query.action as string) || req.body?.action;

  // ── GET /api/user?action=me&userId=xxx ────────────────────────────────────
  if (action === 'me') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
      if (!rows.length) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({ user: formatUser(rows[0]) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── GET /api/user?action=all&adminId=xxx ──────────────────────────────────
  if (action === 'all') {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const adminId = req.query.adminId as string;
      if (!adminId) return res.status(403).json({ error: 'Forbidden' });
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });
      const rows = await sql`SELECT * FROM users ORDER BY joined_at DESC`;
      return res.status(200).json({ users: rows.map((r: any) => ({ ...formatUser(r), password: r.password_hash })) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── PATCH /api/user?action=update ─────────────────────────────────────────
  if (action === 'update') {
    if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { userId, username, telegram, avatar, subscription } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      if (username !== undefined) {
        await sql`UPDATE users SET username = ${username} WHERE id = ${userId}`;
        await sql`UPDATE jobs SET author_name = ${username} WHERE author_id = ${userId}`;
        await sql`UPDATE jobs SET taken_by_name = ${username} WHERE taken_by_id = ${userId}`;
        await sql`UPDATE jobs SET executor_name = ${username} WHERE executor_id = ${userId}`;
      }
      if (telegram !== undefined) {
        await sql`UPDATE users SET telegram = ${telegram} WHERE id = ${userId}`;
        await sql`UPDATE jobs SET author_telegram = ${telegram} WHERE author_id = ${userId}`;
      }
      if (avatar !== undefined) {
        await sql`UPDATE users SET avatar = ${avatar} WHERE id = ${userId}`;
        await sql`UPDATE jobs SET author_avatar = ${avatar} WHERE author_id = ${userId}`;
      }
      if (subscription !== undefined) {
        await sql`
          UPDATE users SET
            sub_active = ${subscription.active},
            sub_expires_at = ${subscription.expiresAt || null},
            sub_profile_bg = ${subscription.profileBg || ''}
          WHERE id = ${userId}
        `;
      }
      const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
      return res.status(200).json({ user: formatUser(rows[0]) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/user?action=change-password ────────────────────────────────
  if (action === 'change-password') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { userId, oldPassword, newPassword } = req.body || {};
      if (!userId || !oldPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
      const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
      if (!rows.length) return res.status(404).json({ error: 'User not found' });
      if (rows[0].password_hash !== oldPassword) return res.status(401).json({ error: 'Неверный текущий пароль' });
      if (oldPassword === newPassword) return res.status(400).json({ error: 'Новый пароль совпадает с текущим' });
      await sql`UPDATE users SET password_hash = ${newPassword} WHERE id = ${userId}`;
      return res.status(200).json({ ok: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/user?action=rate ────────────────────────────────────────────
  if (action === 'rate') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { targetUserId, stars, jobId, role } = req.body || {};
      if (!targetUserId || !stars || !jobId || !role) return res.status(400).json({ error: 'Missing fields' });
      if (stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be 1-5' });
      await sql`UPDATE users SET rating_count = rating_count + 1, rating_total = rating_total + ${stars} WHERE id = ${targetUserId}`;
      if (role === 'executor') {
        await sql`UPDATE jobs SET rating_for_executor = ${stars} WHERE id = ${jobId}`;
      } else {
        await sql`UPDATE jobs SET rating_for_author = ${stars} WHERE id = ${jobId}`;
      }
      return res.status(200).json({ ok: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/user?action=admin-update ────────────────────────────────────
  if (action === 'admin-update') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { adminId, targetUserId, data, blocked } = req.body || {};
      if (!adminId || !targetUserId) return res.status(400).json({ error: 'Missing fields' });
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });
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
        if (password !== undefined) await sql`UPDATE users SET password_hash = ${password} WHERE id = ${targetUserId}`;
        if (b !== undefined) await sql`UPDATE users SET blocked = ${b} WHERE id = ${targetUserId}`;
        if (avatar !== undefined) {
          await sql`UPDATE users SET avatar = ${avatar} WHERE id = ${targetUserId}`;
          await sql`UPDATE jobs SET author_avatar = ${avatar} WHERE author_id = ${targetUserId}`;
        }
      } else if (blocked !== undefined) {
        await sql`UPDATE users SET blocked = ${blocked} WHERE id = ${targetUserId}`;
      }
      return res.status(200).json({ ok: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── DELETE /api/user?action=delete ────────────────────────────────────────
  if (action === 'delete') {
    if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { adminId, targetUserId } = req.body || {};
      if (!adminId || !targetUserId) return res.status(400).json({ error: 'Missing fields' });
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });
      const targetCheck = await sql`SELECT is_admin FROM users WHERE id = ${targetUserId} LIMIT 1`;
      if (!targetCheck.length) return res.status(404).json({ error: 'User not found' });
      if (targetCheck[0].is_admin) return res.status(403).json({ error: 'Cannot delete admin' });
      await sql`DELETE FROM notifications WHERE for_user_id = ${targetUserId}`;
      await sql`DELETE FROM payment_requests WHERE user_id = ${targetUserId}`;
      await sql`UPDATE jobs SET status = 'open', taken_by_id = NULL, taken_by_name = NULL WHERE taken_by_id = ${targetUserId}`;
      await sql`DELETE FROM jobs WHERE author_id = ${targetUserId}`;
      await sql`DELETE FROM users WHERE id = ${targetUserId}`;
      return res.status(200).json({ ok: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(400).json({ error: 'Unknown action' });
}
