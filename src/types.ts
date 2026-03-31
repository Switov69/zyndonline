export interface Rating {
  count: number;
  total: number;
}

export interface SubscriptionInfo {
  active: boolean;
  expiresAt?: string;
  profileBg?: string;
}

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
  rating?: Rating;
  subscription?: SubscriptionInfo;
}

export type JobCategory =
  | 'building'
  | 'redstone'
  | 'terraforming'
  | 'interior'
  | 'pixel_art'
  | 'other';

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
  takenById?: string;
  takenByName?: string;
  jobImage?: string;
  ratingForExecutor?: number;
  ratingForAuthor?: number;
  executorId?: string;
  executorName?: string;
  premiumBoostedAt?: string;
  authorPremium?: boolean;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  username: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
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

export const GRADIENT_PRESETS: { key: string; label: string; value: string }[] = [
  { key: 'purple', label: 'Фиолетовый', value: 'linear-gradient(135deg,#3b0764 0%,#7c3aed 100%)' },
  { key: 'ocean',  label: 'Океан',      value: 'linear-gradient(135deg,#0c4a6e 0%,#0ea5e9 100%)' },
  { key: 'sunset', label: 'Закат',      value: 'linear-gradient(135deg,#7f1d1d 0%,#f97316 100%)' },
  { key: 'forest', label: 'Лес',        value: 'linear-gradient(135deg,#052e16 0%,#22c55e 100%)' },
  { key: 'midnight',label:'Полночь',    value: 'linear-gradient(135deg,#0f172a 0%,#334155 100%)' },
  { key: 'rose',   label: 'Роза',       value: 'linear-gradient(135deg,#4c0519 0%,#f43f5e 100%)' },
  { key: 'gold',   label: 'Золото',     value: 'linear-gradient(135deg,#422006 0%,#eab308 100%)' },
  { key: 'cyber',  label: 'Кибер',      value: 'linear-gradient(135deg,#042f2e 0%,#2dd4bf 100%)' },
];
