const { getDb } = require('./_db');
const { handleOptions, formatJob } = require('./_utils');

module.exports = async function handler(req, res) {
  if (handleOptions(req, res)) return;

  const action = req.query.action || (req.body && req.body.action);
  const id = req.query.id;

  // ── GET list ──────────────────────────────────────────────────────────────
  if (req.method === 'GET' && !action && !id) {
    try {
      const sql = getDb();
      const rows = await sql`
        SELECT j.*,
          (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j
        LEFT JOIN users u ON j.author_id = u.id
        ORDER BY COALESCE(j.premium_boosted_at, j.created_at) DESC
      `;
      return res.status(200).json({ jobs: rows.map(formatJob) });
    } catch (e) {
      console.error('jobs list error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── GET single ────────────────────────────────────────────────────────────
  if (req.method === 'GET' && id) {
    try {
      const sql = getDb();
      const rows = await sql`
        SELECT j.*,
          (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id
        WHERE j.id = ${id} LIMIT 1
      `;
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({ job: formatJob(rows[0]) });
    } catch (e) {
      console.error('job get error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── POST create ───────────────────────────────────────────────────────────
  if (req.method === 'POST' && !action) {
    try {
      const { title, description, category, budget, authorId, authorName, authorAvatar, authorTelegram, jobImage } = req.body || {};
      if (!title || !description || !budget || !authorId) {
        return res.status(400).json({ error: 'Missing required fields' });
      }
      const sql = getDb();
      const authorRows = await sql`SELECT sub_active, sub_expires_at FROM users WHERE id = ${authorId} LIMIT 1`;
      const hasPremium = authorRows.length > 0 && authorRows[0].sub_active &&
        (!authorRows[0].sub_expires_at || new Date(authorRows[0].sub_expires_at) > new Date());
      const jobId = 'job_' + Date.now();
      const now = new Date();
      const boostedAt = hasPremium ? now : null;
      const rows = await sql`
        INSERT INTO jobs (id, title, description, category, budget, author_id, author_name, author_avatar,
          author_telegram, status, job_image, premium_boosted_at, created_at)
        VALUES (${jobId}, ${title}, ${description}, ${category || 'other'}, ${budget},
          ${authorId}, ${authorName}, ${authorAvatar || ''}, ${authorTelegram || ''},
          'open', ${jobImage || null}, ${boostedAt}, ${now})
        RETURNING *
      `;
      await sql`UPDATE users SET jobs_posted = jobs_posted + 1 WHERE id = ${authorId}`;
      return res.status(201).json({ job: formatJob({ ...rows[0], author_premium: hasPremium }) });
    } catch (e) {
      console.error('job create error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── PATCH update ──────────────────────────────────────────────────────────
  if (req.method === 'PATCH' && id) {
    try {
      const { title, description, category, budget, jobImage, status, ratingForExecutor, ratingForAuthor, executorId, executorName } = req.body || {};
      const sql = getDb();
      if (title !== undefined) await sql`UPDATE jobs SET title = ${title} WHERE id = ${id}`;
      if (description !== undefined) await sql`UPDATE jobs SET description = ${description} WHERE id = ${id}`;
      if (category !== undefined) await sql`UPDATE jobs SET category = ${category} WHERE id = ${id}`;
      if (budget !== undefined) await sql`UPDATE jobs SET budget = ${budget} WHERE id = ${id}`;
      if (jobImage !== undefined) await sql`UPDATE jobs SET job_image = ${jobImage} WHERE id = ${id}`;
      if (status !== undefined) await sql`UPDATE jobs SET status = ${status} WHERE id = ${id}`;
      if (executorId !== undefined) {
        await sql`UPDATE jobs SET executor_id = ${executorId}, executor_name = ${executorName || ''} WHERE id = ${id}`;
      }
      if (ratingForExecutor !== undefined) await sql`UPDATE jobs SET rating_for_executor = ${ratingForExecutor} WHERE id = ${id}`;
      if (ratingForAuthor !== undefined) await sql`UPDATE jobs SET rating_for_author = ${ratingForAuthor} WHERE id = ${id}`;
      const rows = await sql`
        SELECT j.*, (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id WHERE j.id = ${id} LIMIT 1
      `;
      return res.status(200).json({ job: formatJob(rows[0]) });
    } catch (e) {
      console.error('job update error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── DELETE ────────────────────────────────────────────────────────────────
  if (req.method === 'DELETE' && id) {
    try {
      const sql = getDb();
      await sql`DELETE FROM jobs WHERE id = ${id}`;
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('job delete error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── take ──────────────────────────────────────────────────────────────────
  if (action === 'take') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
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
      // Notify job author: someone took their job
      const notifId = 'n_take_' + Date.now();
      await sql`
        INSERT INTO notifications (id, for_user_id, text, read, created_at)
        VALUES (${notifId}, ${job.author_id}, ${`${userName} откликнулся на ваш заказ «${job.title}»`}, false, NOW())
      `;
      const rows = await sql`
        SELECT j.*, (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id WHERE j.id = ${jobId} LIMIT 1
      `;
      return res.status(200).json({ job: formatJob(rows[0]), authorId: job.author_id });
    } catch (e) {
      console.error('take error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── complete ──────────────────────────────────────────────────────────────
  if (action === 'complete') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { jobId } = req.body || {};
      if (!jobId) return res.status(400).json({ error: 'Missing jobId' });
      const sql = getDb();
      const jobRows = await sql`SELECT * FROM jobs WHERE id = ${jobId} LIMIT 1`;
      if (!jobRows.length) return res.status(404).json({ error: 'Job not found' });
      const job = jobRows[0];
      await sql`
        UPDATE jobs SET status = 'done',
          executor_id = ${job.taken_by_id || null},
          executor_name = ${job.taken_by_name || ''}
        WHERE id = ${jobId}
      `;
      if (job.author_id) {
        await sql`UPDATE users SET jobs_completed = jobs_completed + 1 WHERE id = ${job.author_id}`;
      }
      const rows = await sql`
        SELECT j.*, (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id WHERE j.id = ${jobId} LIMIT 1
      `;
      return res.status(200).json({ job: formatJob(rows[0]) });
    } catch (e) {
      console.error('complete error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  // ── cancel (executor declines) ────────────────────────────────────────────
  if (action === 'cancel') {
    try {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const { jobId } = req.body || {};
      if (!jobId) return res.status(400).json({ error: 'Missing jobId' });
      const sql = getDb();
      // Fetch job before clearing so we can notify author
      const jobRows = await sql`SELECT * FROM jobs WHERE id = ${jobId} LIMIT 1`;
      if (!jobRows.length) return res.status(404).json({ error: 'Job not found' });
      const job = jobRows[0];
      await sql`
        UPDATE jobs SET status = 'open', taken_by_id = NULL, taken_by_name = NULL
        WHERE id = ${jobId}
      `;
      // Notify job author: executor withdrew
      if (job.author_id && job.taken_by_name) {
        const notifId = 'n_cancel_' + Date.now();
        await sql`
          INSERT INTO notifications (id, for_user_id, text, read, created_at)
          VALUES (${notifId}, ${job.author_id}, ${`${job.taken_by_name} отказался от вашего заказа «${job.title}»`}, false, NOW())
        `;
      }
      const rows = await sql`
        SELECT j.*, (u.sub_active = true AND (u.sub_expires_at IS NULL OR u.sub_expires_at > NOW())) AS author_premium
        FROM jobs j LEFT JOIN users u ON j.author_id = u.id WHERE j.id = ${jobId} LIMIT 1
      `;
      return res.status(200).json({ job: formatJob(rows[0]) });
    } catch (e) {
      console.error('cancel error:', e);
      return res.status(500).json({ error: e.message || 'Server error' });
    }
  }

  return res.status(400).json({ error: 'Unknown request' });
};
