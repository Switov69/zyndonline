import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_db';
import { handleOptions, formatJob } from '../_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const sql = getDb();

  // GET — list all jobs (not done), sorted by premium_boosted_at DESC, then created_at DESC
  if (req.method === 'GET') {
    try {
      const rows = await sql`
        SELECT j.*,
          (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j
        LEFT JOIN users u ON j.author_id = u.id
        ORDER BY COALESCE(j.premium_boosted_at, j.created_at) DESC
      `;
      return res.status(200).json({ jobs: rows.map(formatJob) });
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST — create job
  if (req.method === 'POST') {
    try {
      const {
        title, description, category, budget,
        authorId, authorName, authorAvatar, authorTelegram,
        jobImage,
      } = req.body || {};

      if (!title || !description || !budget || !authorId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check if author has premium for auto-boost
      const authorRows = await sql`SELECT sub_active, sub_expires_at FROM users WHERE id = ${authorId} LIMIT 1`;
      const hasPremium = authorRows.length > 0 &&
        authorRows[0].sub_active &&
        (!authorRows[0].sub_expires_at || new Date(authorRows[0].sub_expires_at) > new Date());

      const id = 'job_' + Date.now();
      const now = new Date();
      const boostedAt = hasPremium ? now : null;

      const rows = await sql`
        INSERT INTO jobs (
          id, title, description, category, budget,
          author_id, author_name, author_avatar, author_telegram,
          status, job_image, premium_boosted_at, created_at
        ) VALUES (
          ${id}, ${title}, ${description}, ${category || 'other'}, ${budget},
          ${authorId}, ${authorName}, ${authorAvatar || ''}, ${authorTelegram || ''},
          'open', ${jobImage || null}, ${boostedAt}, ${now}
        )
        RETURNING *
      `;

      // Increment jobs_posted
      await sql`UPDATE users SET jobs_posted = jobs_posted + 1 WHERE id = ${authorId}`;

      const job = formatJob({ ...rows[0], author_premium: hasPremium });
      return res.status(201).json({ job });
    } catch (e: any) {
      console.error('create job error', e);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
