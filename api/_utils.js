function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function handleOptions(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') { res.status(204).end(); return true; }
  return false;
}

function formatUser(row) {
  const subActive = !!row.sub_active && (!row.sub_expires_at || new Date(row.sub_expires_at) > new Date());
  return {
    id: String(row.id),
    username: row.username,
    avatar: row.avatar || '',
    telegram: row.telegram || '',
    joinedAt: row.joined_at
      ? (typeof row.joined_at === 'string' ? row.joined_at.split('T')[0] : new Date(row.joined_at).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0],
    jobsPosted: row.jobs_posted || 0,
    jobsCompleted: row.jobs_completed || 0,
    blocked: !!row.blocked,
    isAdmin: !!row.is_admin,
    rating: { count: row.rating_count || 0, total: row.rating_total || 0 },
    subscription: {
      active: subActive,
      expiresAt: row.sub_expires_at || undefined,
      profileBg: row.sub_profile_bg || '',
    },
  };
}

function formatJob(row) {
  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    category: row.category,
    budget: row.budget,
    authorId: String(row.author_id),
    authorName: row.author_name,
    authorAvatar: row.author_avatar || '',
    authorTelegram: row.author_telegram || '',
    createdAt: row.created_at
      ? (typeof row.created_at === 'string' ? row.created_at.split('T')[0] : new Date(row.created_at).toISOString().split('T')[0])
      : new Date().toISOString().split('T')[0],
    status: row.status,
    takenById: row.taken_by_id ? String(row.taken_by_id) : undefined,
    takenByName: row.taken_by_name || undefined,
    executorId: row.executor_id ? String(row.executor_id) : undefined,
    executorName: row.executor_name || undefined,
    ratingForExecutor: row.rating_for_executor || undefined,
    ratingForAuthor: row.rating_for_author || undefined,
    jobImage: row.job_image || undefined,
    premiumBoostedAt: row.premium_boosted_at || undefined,
    authorPremium: !!row.author_premium,
  };
}

function formatPayment(row) {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    username: row.username,
    requestedAt: row.requested_at,
    status: row.status,
  };
}

module.exports = { handleOptions, formatUser, formatJob, formatPayment };
