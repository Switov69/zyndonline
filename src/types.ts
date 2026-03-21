export interface User {
  id: string;
  username: string;
  avatar: string;
  telegram: string;
  joinedAt: string;
  jobsPosted: number;
  jobsCompleted: number;
  blocked?: boolean;
  isAdmin?: boolean;
}

export type JobCategory = 'building' | 'redstone' | 'terraforming' | 'interior' | 'pixel_art' | 'other';

export interface Job {
  id: string;
  title: string;
  description: string;
  category: JobCategory;
  budget: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorTelegram: string;
  createdAt: string;
  status: 'open' | 'in_progress' | 'done';
  tags: string[];
  takenById?: string;
  takenByName?: string;
}

export const CATEGORY_LABELS: Record<JobCategory, string> = {
  building: 'Строительство',
  redstone: 'Редстоун',
  terraforming: 'Терраформинг',
  interior: 'Интерьер',
  pixel_art: 'Пиксель-арт',
  other: 'Другое',
};

export const CATEGORY_COLORS: Record<JobCategory, string> = {
  building: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  redstone: 'bg-red-500/15 text-red-400 border-red-500/20',
  terraforming: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  interior: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  pixel_art: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  other: 'bg-dark-400/30 text-dark-200 border-dark-400/30',
};
