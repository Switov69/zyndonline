const { getDb } = require('./_db');
const { handleOptions, formatUser } = require('./_utils');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const action = req.query.action || (req.body && req.body.action);

  // ── me ────────────────────────────────────────────────────────────────────
  if (action === 'me') {
    try {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const userId = req.query.userId;
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const sql = getDb();
      const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
      if (!rows.length) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({ user: formatUser(rows[0]) });
    } catch (e) {
      console.error('me error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── by-username ───────────────────────────────────────────────────────────
  if (action === 'by-username') {
    try {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const username = req.query.username;
      if (!username) return res.status(400).json({ error: 'Missing username' });
      const sql = getDb();
      const rows = await sql`SELECT * FROM users WHERE LOWER(username) = LOWER(${username}) LIMIT 1`;
      if (!rows.length) return res.status(404).json({ error: 'User not found' });
      return res.status(200).json({ user: formatUser(rows[0]) });
    } catch (e) {
      console.error('by-username error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── all (admin) ───────────────────────────────────────────────────────────
  if (action === 'all') {
    try {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const adminId = req.query.adminId;
      if (!adminId) return res.status(403).json({ error: 'Forbidden' });
      const sql = getDb();
      const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
      if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });
      const rows = await sql`SELECT * FROM users ORDER BY joined_at DESC`;
      return res.status(200).json({ users: rows.map(r => ({ ...formatUser(r), password: r.password_hash })) });
    } catch (e) {
      console.error('all users error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── notifications ─────────────────────────────────────────────────────────
  if (action === 'notifications') {
    try {
      if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
      const userId = req.query.userId;
      const since = req.query.since || '1970-01-01T00:00:00.000Z';
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const sql = getDb();
      const rows = await sql`
        SELECT * FROM notifications
        WHERE for_user_id = ${userId}
          AND read = false
          AND created_at > ${since}
        ORDER BY created_at DESC
        LIMIT 20
      `;
      // Mark as read
      if (rows.length > 0) {
        await sql`UPDATE notifications SET read = true WHERE for_user_id = ${userId} AND read = false AND created_at > ${since}`;
      }
      return res.status(200).json({ notifications: rows });
    } catch (e) {
      console.error('notifications error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── update ────────────────────────────────────────────────────────────────
  if (action === 'update') {
    try {
      if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });
      const { userId, username, telegram, avatar, subscription } = req.body || {};
      if (!userId) return res.status(400).json({ error: 'Missing userId' });
      const sql = getDb();
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
    } catch (e) {
      console.error('update error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── change-password ───────────────────────────────────────────────────────
  if (action === 'change-password') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { userId, oldPassword, newPassword } = req.body || {};
      if (!userId || !oldPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' });
      const sql = getDb();
      const rows = await sql`SELECT * FROM users WHERE id = ${userId} LIMIT 1`;
      if (!rows.length) return res.status(404).json({ error: 'User not found' });
      if (rows[0].password_hash !== oldPassword) return res.status(401).json({ error: 'Неверный текущий пароль' });
      if (oldPassword === newPassword) return res.status(400).json({ error: 'Новый пароль совпадает с текущим' });
      await sql`UPDATE users SET password_hash = ${newPassword} WHERE id = ${userId}`;
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('change-password error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── rate — also stores notification for the rated user ───────────────────
  if (action === 'rate') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { targetUserId, stars, jobId, role, raterName } = req.body || {};
      if (!targetUserId || !stars || !jobId || !role) return res.status(400).json({ error: 'Missing fields' });
      if (stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be 1-5' });
      const sql = getDb();
      await sql`UPDATE users SET rating_count = rating_count + 1, rating_total = rating_total + ${stars} WHERE id = ${targetUserId}`;
      if (role === 'executor') {
        await sql`UPDATE jobs SET rating_for_executor = ${stars} WHERE id = ${jobId}`;
      } else {
        await sql`UPDATE jobs SET rating_for_author = ${stars} WHERE id = ${jobId}`;
      }
      // Notify the rated user
      const who = raterName || (role === 'author' ? 'Исполнитель' : 'Заказчик');
      const notifText = `${who} оставил вам оценку ${stars}⭐`;
      const notifId = 'n_' + Date.now() + '_r';
      await sql`INSERT INTO notifications (id, for_user_id, text, read, created_at)
        VALUES (${notifId}, ${targetUserId}, ${notifText}, false, NOW())`;
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('rate error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── admin-update ──────────────────────────────────────────────────────────
  if (action === 'admin-update') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { adminId, targetUserId, data, blocked } = req.body || {};
      if (!adminId || !targetUserId) return res.status(400).json({ error: 'Missing fields' });
      const sql = getDb();
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
    } catch (e) {
      console.error('admin-update error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── delete ────────────────────────────────────────────────────────────────
  if (action === 'delete') {
    try {
      if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });
      const { adminId, targetUserId } = req.body || {};
      if (!adminId || !targetUserId) return res.status(400).json({ error: 'Missing fields' });
      const sql = getDb();
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
    } catch (e) {
      console.error('delete user error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  return res.status(400).json({ error: 'Unknown action' });
};
