import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions, formatJob } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const sql = getDb();
  const { id } = req.query;
  if (!id) return res.status(400).json({ error: 'Missing id' });

  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT j.*,
          (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j
        LEFT JOIN users u ON j.author_id = u.id
        WHERE j.id = ${id as string}
        LIMIT 1
      `;
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ job: formatJob(rows[0]) });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'PATCH') {
    try {
      const { title, description, category, budget, jobImage, status, ratingForExecutor, ratingForAuthor, executorId, executorName } = req.body || {};

      if (title !== undefined) await sql`UPDATE jobs SET title = ${title} WHERE id = ${id as string}`;
      if (description !== undefined) await sql`UPDATE jobs SET description = ${description} WHERE id = ${id as string}`;
      if (category !== undefined) await sql`UPDATE jobs SET category = ${category} WHERE id = ${id as string}`;
      if (budget !== undefined) await sql`UPDATE jobs SET budget = ${budget} WHERE id = ${id as string}`;
      if (jobImage !== undefined) await sql`UPDATE jobs SET job_image = ${jobImage} WHERE id = ${id as string}`;
      if (status !== undefined) await sql`UPDATE jobs SET status = ${status} WHERE id = ${id as string}`;
      if (executorId !== undefined) {
        await sql`UPDATE jobs SET executor_id = ${executorId}, executor_name = ${executorName || ''} WHERE id = ${id as string}`;
      }
      if (ratingForExecutor !== undefined) await sql`UPDATE jobs SET rating_for_executor = ${ratingForExecutor} WHERE id = ${id as string}`;
      if (ratingForAuthor !== undefined) await sql`UPDATE jobs SET rating_for_author = ${ratingForAuthor} WHERE id = ${id as string}`;

      const rows = await sql`
        SELECT j.*,
          (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id
        WHERE j.id = ${id as string} LIMIT 1
      `;
      return res.status(200).json({ job: formatJob(rows[0]) });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM jobs WHERE id = ${id as string}`;
      return res.status(200).json({ ok: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
