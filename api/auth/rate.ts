import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { targetUserId, stars, jobId, role } = req.body || {};
    if (!targetUserId || !stars || !jobId || !role) return res.status(400).json({ error: 'Missing fields' });
    if (stars < 1 || stars > 5) return res.status(400).json({ error: 'Stars must be 1-5' });

    const sql = getDb();
    await sql`
      UPDATE users
      SET rating_count = rating_count + 1, rating_total = rating_total + ${stars}
      WHERE id = ${targetUserId}
    `;

    if (role === 'executor') {
      await sql`UPDATE jobs SET rating_for_executor = ${stars} WHERE id = ${jobId}`;
    } else {
      await sql`UPDATE jobs SET rating_for_author = ${stars} WHERE id = ${jobId}`;
    }

    return res.status(200).json({ ok: true });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
