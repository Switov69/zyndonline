import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions, formatUser } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, username, telegram, avatar, subscription } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'Missing userId' });

    const sql = getDb();

    // Build partial update
    if (username !== undefined) {
      await sql`UPDATE users SET username = ${username} WHERE id = ${userId}`;
      // Sync in jobs
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
  } catch (e: any) {
    console.error('update error', e);
    return res.status(500).json({ error: e.message });
  }
}
