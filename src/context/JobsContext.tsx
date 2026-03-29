import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Job } from '../types';
import { mockJobs } from '../data/mockJobs';

interface JobsContextType {
  jobs: Job[];
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'status'>) => void;
  getJob: (id: string) => Job | undefined;
  takeJob: (jobId: string, userId: string, userName: string, authorId: string) => void;
  completeJob: (jobId: string) => void;
  deleteJob: (jobId: string) => void;
  updateJob: (jobId: string, data: Partial<Job>) => void;
  cancelJobTake: (jobId: string) => void;
}

const JobsContext = createContext<JobsContextType | null>(null);

// Premium auto-boost: jobs published within 7 days get bumped every ~hour
function applyPremiumBoosts(jobs: Job[]): Job[] {
  const now = Date.now();
  return jobs.map(j => {
    if (!j.premiumBoostedAt) return j;
    const pub = new Date(j.createdAt).getTime();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    if (now - pub > sevenDays) return j;
    // Boost: update premiumBoostedAt to now so it sorts to top
    const lastBoost = new Date(j.premiumBoostedAt).getTime();
    if (now - lastBoost > 60 * 60 * 1000) {
      return { ...j, premiumBoostedAt: new Date().toISOString() };
    }
    return j;
  });
}

function sortJobs(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => {
    const aTime = a.premiumBoostedAt ? new Date(a.premiumBoostedAt).getTime() : new Date(a.createdAt).getTime();
    const bTime = b.premiumBoostedAt ? new Date(b.premiumBoostedAt).getTime() : new Date(b.createdAt).getTime();
    return bTime - aTime;
  });
}

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('zynd_jobs');
    const raw: Job[] = saved ? JSON.parse(saved) : mockJobs;
    return sortJobs(applyPremiumBoosts(raw));
  });

  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('zynd_jobs');
      if (saved) {
        const raw: Job[] = JSON.parse(saved);
        setJobs(sortJobs(applyPremiumBoosts(raw)));
      }
    };
    window.addEventListener('zynd_jobs_updated', handler);
    return () => window.removeEventListener('zynd_jobs_updated', handler);
  }, []);

  const persist = (updated: Job[]) => {
    localStorage.setItem('zynd_jobs', JSON.stringify(updated));
  };

  const addJob = useCallback((job: Omit<Job, 'id' | 'createdAt' | 'status'>) => {
    // Check if author has premium for auto-boost
    const accounts: any[] = JSON.parse(localStorage.getItem('zynd_accounts') || '[]');
    const author = accounts.find((a: any) => a.id === job.authorId);
    const hasPremium = author?.subscription?.active &&
      author?.subscription?.expiresAt &&
      new Date(author.subscription.expiresAt) > new Date();

    const newJob: Job = {
      ...job,
      id: 'job_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'open',
      premiumBoostedAt: hasPremium ? new Date().toISOString() : undefined,
    };
    setJobs((prev) => {
      const updated = sortJobs([newJob, ...prev]);
      persist(updated);
      return updated;
    });
  }, []);

  const getJob = useCallback(
    (id: string) => jobs.find((j) => j.id === id),
    [jobs]
  );

  const takeJob = useCallback((jobId: string, userId: string, userName: string, authorId: string) => {
    setJobs((prev) => {
      const updated = prev.map((j) =>
        j.id === jobId
          ? { ...j, status: 'in_progress' as const, takenById: userId, takenByName: userName }
          : j
      );
      persist(updated);

      // Send desktop notification to author
      if ('Notification' in window && Notification.permission === 'granted') {
        const job = prev.find(j => j.id === jobId);
        if (job && job.authorId === authorId) {
          // We notify via a custom event since we don't have a server
          // The notification is for the current user if they are the author
          const currentUser = JSON.parse(localStorage.getItem('zynd_user') || 'null');
          if (currentUser && currentUser.id === authorId) {
            new Notification('Zynd.online — Заказ взят!', {
              body: `${userName} взялся за ваш заказ «${job.title}»`,
              icon: '/favicon.ico',
            });
          }
        }
      }

      // Store notification in localStorage for author
      const notifs: any[] = JSON.parse(localStorage.getItem('zynd_notifications') || '[]');
      const job = prev.find(j => j.id === jobId);
      if (job) {
        notifs.push({
          id: 'n_' + Date.now(),
          forUserId: authorId,
          text: `${userName} взялся за ваш заказ «${job.title}»`,
          createdAt: new Date().toISOString(),
          read: false,
        });
        localStorage.setItem('zynd_notifications', JSON.stringify(notifs));
      }

      return updated;
    });
  }, []);

  const completeJob = useCallback((jobId: string) => {
    setJobs((prev) => {
      const updated = prev.map((j) =>
        j.id === jobId ? { ...j, status: 'done' as const } : j
      );
      persist(updated);
      return updated;
    });
  }, []);

  const deleteJob = useCallback((jobId: string) => {
    setJobs((prev) => {
      const updated = prev.filter((j) => j.id !== jobId);
      persist(updated);
      return updated;
    });
  }, []);

  const updateJob = useCallback((jobId: string, data: Partial<Job>) => {
    setJobs((prev) => {
      const updated = prev.map((j) =>
        j.id === jobId ? { ...j, ...data } : j
      );
      persist(updated);
      return updated;
    });
  }, []);

  const cancelJobTake = useCallback((jobId: string) => {
    setJobs((prev) => {
      const updated = prev.map((j) =>
        j.id === jobId
          ? { ...j, status: 'open' as const, takenById: undefined, takenByName: undefined }
          : j
      );
      persist(updated);
      return updated;
    });
  }, []);

  return (
    <JobsContext.Provider value={{ jobs, addJob, getJob, takeJob, completeJob, deleteJob, updateJob, cancelJobTake }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs must be used within JobsProvider');
  return ctx;
}
