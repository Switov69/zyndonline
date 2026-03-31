import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions, formatJob } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { jobId, userId, userName } = req.body || {};
    if (!jobId || !userId || !userName) return res.status(400).json({ error: 'Missing fields' });

    const sql = getDb();

    const jobRows = await sql`SELECT * FROM jobs WHERE id = ${jobId} AND status = 'open' LIMIT 1`;
    if (!jobRows.length) return res.status(400).json({ error: 'Job not available' });

    const job = jobRows[0];

    await sql`
      UPDATE jobs SET status = 'in_progress', taken_by_id = ${userId}, taken_by_name = ${userName}
      WHERE id = ${jobId}
    `;

    // Store notification for job author
    const notifId = 'n_' + Date.now();
    await sql`
      INSERT INTO notifications (id, for_user_id, text, read, created_at)
      VALUES (${notifId}, ${job.author_id}, ${`${userName} взялся за ваш заказ «${job.title}»`}, false, NOW())
    `;

    const rows = await sql`
      SELECT j.*,
        (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
      FROM jobs j LEFT JOIN users u ON j.author_id = u.id
      WHERE j.id = ${jobId} LIMIT 1
    `;
    return res.status(200).json({ job: formatJob(rows[0]), authorId: job.author_id });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
