import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from './_db';
import { handleOptions, formatJob } from './_utils';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (handleOptions(req, res)) return;
  const sql = getDb();
  const action = (req.query.action as string) || req.body?.action;
  const id = req.query.id as string | undefined;

  // ── GET /api/jobs — list all jobs sorted ─────────────────────────────────
  if (req.method === 'GET' && !action && !id) {
    try {
      const rows = await sql`
        SELECT j.*,
          (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j
        LEFT JOIN users u ON j.author_id = u.id
        ORDER BY COALESCE(j.premium_boosted_at, j.created_at) DESC
      `;
      return res.status(200).json({ jobs: rows.map(formatJob) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── GET /api/jobs?id=xxx — get single job ─────────────────────────────────
  if (req.method === 'GET' && id) {
    try {
      const rows = await sql`
        SELECT j.*,
          (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id
        WHERE j.id = ${id} LIMIT 1
      `;
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ job: formatJob(rows[0]) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/jobs — create job ───────────────────────────────────────────
  if (req.method === 'POST' && !action) {
    try {
      const { title, description, category, budget, authorId, authorName, authorAvatar, authorTelegram, jobImage } = req.body || {};
      if (!title || !description || !budget || !authorId) return res.status(400).json({ error: 'Missing required fields' });
      const authorRows = await sql`SELECT sub_active, sub_expires_at FROM users WHERE id = ${authorId} LIMIT 1`;
      const hasPremium = authorRows.length > 0 && authorRows[0].sub_active &&
        (!authorRows[0].sub_expires_at || new Date(authorRows[0].sub_expires_at) > new Date());
      const jobId = 'job_' + Date.now();
      const now = new Date();
      const boostedAt = hasPremium ? now : null;
      const rows = await sql`
        INSERT INTO jobs (id, title, description, category, budget, author_id, author_name, author_avatar, author_telegram, status, job_image, premium_boosted_at, created_at)
        VALUES (${jobId}, ${title}, ${description}, ${category || 'other'}, ${budget}, ${authorId}, ${authorName}, ${authorAvatar || ''}, ${authorTelegram || ''}, 'open', ${jobImage || null}, ${boostedAt}, ${now})
        RETURNING *
      `;
      await sql`UPDATE users SET jobs_posted = jobs_posted + 1 WHERE id = ${authorId}`;
      return res.status(201).json({ job: formatJob({ ...rows[0], author_premium: hasPremium }) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── PATCH /api/jobs?id=xxx — update job ───────────────────────────────────
  if (req.method === 'PATCH' && id) {
    try {
      const { title, description, category, budget, jobImage, status, ratingForExecutor, ratingForAuthor, executorId, executorName } = req.body || {};
      if (title !== undefined) await sql`UPDATE jobs SET title = ${title} WHERE id = ${id}`;
      if (description !== undefined) await sql`UPDATE jobs SET description = ${description} WHERE id = ${id}`;
      if (category !== undefined) await sql`UPDATE jobs SET category = ${category} WHERE id = ${id}`;
      if (budget !== undefined) await sql`UPDATE jobs SET budget = ${budget} WHERE id = ${id}`;
      if (jobImage !== undefined) await sql`UPDATE jobs SET job_image = ${jobImage} WHERE id = ${id}`;
      if (status !== undefined) await sql`UPDATE jobs SET status = ${status} WHERE id = ${id}`;
      if (executorId !== undefined) await sql`UPDATE jobs SET executor_id = ${executorId}, executor_name = ${executorName || ''} WHERE id = ${id}`;
      if (ratingForExecutor !== undefined) await sql`UPDATE jobs SET rating_for_executor = ${ratingForExecutor} WHERE id = ${id}`;
      if (ratingForAuthor !== undefined) await sql`UPDATE jobs SET rating_for_author = ${ratingForAuthor} WHERE id = ${id}`;
      const rows = await sql`
        SELECT j.*, (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id WHERE j.id = ${id} LIMIT 1
      `;
      return res.status(200).json({ job: formatJob(rows[0]) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── DELETE /api/jobs?id=xxx ───────────────────────────────────────────────
  if (req.method === 'DELETE' && id) {
    try {
      await sql`DELETE FROM jobs WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/jobs?action=take ────────────────────────────────────────────
  if (action === 'take') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { jobId, userId, userName } = req.body || {};
      if (!jobId || !userId || !userName) return res.status(400).json({ error: 'Missing fields' });
      const jobRows = await sql`SELECT * FROM jobs WHERE id = ${jobId} AND status = 'open' LIMIT 1`;
      if (!jobRows.length) return res.status(400).json({ error: 'Job not available' });
      const job = jobRows[0];
      await sql`UPDATE jobs SET status = 'in_progress', taken_by_id = ${userId}, taken_by_name = ${userName} WHERE id = ${jobId}`;
      const notifId = 'n_' + Date.now();
      await sql`INSERT INTO notifications (id, for_user_id, text, read, created_at) VALUES (${notifId}, ${job.author_id}, ${`${userName} взялся за ваш заказ «${job.title}»`}, false, NOW())`;
      const rows = await sql`
        SELECT j.*, (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id WHERE j.id = ${jobId} LIMIT 1
      `;
      return res.status(200).json({ job: formatJob(rows[0]), authorId: job.author_id });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/jobs?action=complete ────────────────────────────────────────
  if (action === 'complete') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { jobId } = req.body || {};
      if (!jobId) return res.status(400).json({ error: 'Missing jobId' });
      const jobRows = await sql`SELECT * FROM jobs WHERE id = ${jobId} LIMIT 1`;
      if (!jobRows.length) return res.status(404).json({ error: 'Job not found' });
      const job = jobRows[0];
      await sql`UPDATE jobs SET status = 'done', executor_id = ${job.taken_by_id || null}, executor_name = ${job.taken_by_name || ''} WHERE id = ${jobId}`;
      if (job.author_id) await sql`UPDATE users SET jobs_completed = jobs_completed + 1 WHERE id = ${job.author_id}`;
      const rows = await sql`
        SELECT j.*, (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id WHERE j.id = ${jobId} LIMIT 1
      `;
      return res.status(200).json({ job: formatJob(rows[0]) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  // ── POST /api/jobs?action=cancel ─────────────────────────────────────────
  if (action === 'cancel') {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
      const { jobId } = req.body || {};
      if (!jobId) return res.status(400).json({ error: 'Missing jobId' });
      await sql`UPDATE jobs SET status = 'open', taken_by_id = NULL, taken_by_name = NULL WHERE id = ${jobId}`;
      const rows = await sql`
        SELECT j.*, (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id WHERE j.id = ${jobId} LIMIT 1
      `;
      return res.status(200).json({ job: formatJob(rows[0]) });
    } catch (e: any) { return res.status(500).json({ error: e.message }); }
  }

  return res.status(400).json({ error: 'Unknown request' });
}
