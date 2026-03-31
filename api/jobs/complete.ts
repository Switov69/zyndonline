import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions, formatJob } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { jobId } = req.body || {};
    if (!jobId) return res.status(400).json({ error: 'Missing jobId' });

    const sql = getDb();
    const jobRows = await sql`SELECT * FROM jobs WHERE id = ${jobId} LIMIT 1`;
    if (!jobRows.length) return res.status(404).json({ error: 'Job not found' });

    const job = jobRows[0];

    await sql`
      UPDATE jobs
      SET status = 'done',
          executor_id = ${job.taken_by_id || null},
          executor_name = ${job.taken_by_name || ''}
      WHERE id = ${jobId}
    `;

    if (job.author_id) {
      await sql`UPDATE users SET jobs_completed = jobs_completed + 1 WHERE id = ${job.author_id}`;
    }

    const rows = await sql`
      SELECT j.*,
        (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
      FROM jobs j LEFT JOIN users u ON j.author_id = u.id
      WHERE j.id = ${jobId} LIMIT 1
    `;
    return res.status(200).json({ job: formatJob(rows[0]) });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
