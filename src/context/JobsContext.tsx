import {
  createContext, useContext, useState, ReactNode, useCallback, useEffect,
} from 'react';
import { Job } from '../types';
import { api } from '../lib/api';

interface JobsContextType {
  jobs: Job[];
  loading: boolean;
  refreshJobs: () => Promise<void>;
  addJob: (job: {
    title: string; description: string; category: string; budget: string;
    authorId: string; authorName: string; authorAvatar: string;
    authorTelegram: string; jobImage?: string;
  }) => Promise<void>;
  getJob: (id: string) => Job | undefined;
  takeJob: (jobId: string, userId: string, userName: string) => Promise<void>;
  completeJob: (jobId: string) => Promise<void>;
  deleteJob: (jobId: string) => Promise<void>;
  updateJob: (jobId: string, data: Partial<Job>) => Promise<void>;
  cancelJobTake: (jobId: string) => Promise<void>;
}

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshJobs = useCallback(async () => {
    try {
      const { jobs: fetched } = await api.jobs.list();
      setJobs(fetched);
    } catch (e) {
      console.error('Failed to load jobs', e);
    }
  }, []);

  useEffect(() => {
    refreshJobs().finally(() => setLoading(false));
  }, [refreshJobs]);

  const getJob = useCallback((id: string) => jobs.find(j => j.id === id), [jobs]);

  const addJob = useCallback(async (jobData: {
    title: string; description: string; category: string; budget: string;
    authorId: string; authorName: string; authorAvatar: string;
    authorTelegram: string; jobImage?: string;
  }) => {
    const { job } = await api.jobs.create(jobData);
    setJobs(prev => [job, ...prev]);
  }, []);

  const takeJob = useCallback(async (jobId: string, userId: string, userName: string) => {
    const { job, authorId } = await api.jobs.take(jobId, userId, userName);
    setJobs(prev => prev.map(j => j.id === jobId ? job : j));

    // Desktop notification for the job author (only if current user IS the author)
    const storedId = localStorage.getItem('zynd_uid');
    if (storedId === authorId && 'Notification' in window && Notification.permission === 'granted') {
      const jobTitle = jobs.find(j => j.id === jobId)?.title || '';
      new Notification('Zynd.online — Заказ взят!', {
        body: `${userName} взялся за ваш заказ «${jobTitle}»`,
        icon: '/favicon.ico',
      });
    }
  }, [jobs]);

  const completeJob = useCallback(async (jobId: string) => {
    const { job } = await api.jobs.complete(jobId);
    // Remove from list (done jobs don't show on main feed)
    setJobs(prev => prev.filter(j => j.id !== jobId).concat(job));
  }, []);

  const deleteJob = useCallback(async (jobId: string) => {
    await api.jobs.delete(jobId);
    setJobs(prev => prev.filter(j => j.id !== jobId));
  }, []);

  const updateJob = useCallback(async (jobId: string, data: Partial<Job>) => {
    const { job } = await api.jobs.update(jobId, data);
    setJobs(prev => prev.map(j => j.id === jobId ? job : j));
  }, []);

  const cancelJobTake = useCallback(async (jobId: string) => {
    const { job } = await api.jobs.cancel(jobId);
    setJobs(prev => prev.map(j => j.id === jobId ? job : j));
  }, []);

  return (
    <JobsContext.Provider value={{
      jobs, loading, refreshJobs,
      addJob, getJob, takeJob,
      completeJob, deleteJob, updateJob, cancelJobTake,
    }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) throw new Error('useJobs must be used within JobsProvider');
  return ctx;
}
