import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { adminId, targetUserId } = req.body || {};
    if (!adminId || !targetUserId) return res.status(400).json({ error: 'Missing fields' });

    const sql = getDb();
    const adminCheck = await sql`SELECT is_admin FROM users WHERE id = ${adminId} LIMIT 1`;
    if (!adminCheck.length || !adminCheck[0].is_admin) return res.status(403).json({ error: 'Forbidden' });

    // Don't allow deleting another admin
    const targetCheck = await sql`SELECT is_admin FROM users WHERE id = ${targetUserId} LIMIT 1`;
    if (!targetCheck.length) return res.status(404).json({ error: 'User not found' });
    if (targetCheck[0].is_admin) return res.status(403).json({ error: 'Cannot delete admin' });

    // Delete cascade: notifications, payment_requests, jobs (taken_by reset), user's jobs deleted
    await sql`DELETE FROM notifications WHERE for_user_id = ${targetUserId}`;
    await sql`DELETE FROM payment_requests WHERE user_id = ${targetUserId}`;
    // Reset jobs taken by this user
    await sql`UPDATE jobs SET status = 'open', taken_by_id = NULL, taken_by_name = NULL WHERE taken_by_id = ${targetUserId}`;
    // Delete jobs authored by this user
    await sql`DELETE FROM jobs WHERE author_id = ${targetUserId}`;
    // Delete user
    await sql`DELETE FROM users WHERE id = ${targetUserId}`;

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    console.error('delete user error', e);
    return res.status(500).json({ error: e.message });
  }
}
