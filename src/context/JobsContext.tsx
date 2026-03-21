import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Job } from '../types';
import { mockJobs } from '../data/mockJobs';

interface JobsContextType {
  jobs: Job[];
  addJob: (job: Omit<Job, 'id' | 'createdAt' | 'status'>) => void;
  getJob: (id: string) => Job | undefined;
  takeJob: (jobId: string, userId: string, userName: string) => void;
  completeJob: (jobId: string) => void;
  deleteJob: (jobId: string) => void;
  updateJob: (jobId: string, data: Partial<Job>) => void;
  cancelJobTake: (jobId: string) => void;
}

const JobsContext = createContext<JobsContextType | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = localStorage.getItem('zynd_jobs');
    return saved ? JSON.parse(saved) : mockJobs;
  });

  // Listen for external updates (e.g. from admin panel updating user data)
  useEffect(() => {
    const handler = () => {
      const saved = localStorage.getItem('zynd_jobs');
      if (saved) {
        setJobs(JSON.parse(saved));
      }
    };
    window.addEventListener('zynd_jobs_updated', handler);
    return () => window.removeEventListener('zynd_jobs_updated', handler);
  }, []);

  const persist = (updated: Job[]) => {
    localStorage.setItem('zynd_jobs', JSON.stringify(updated));
  };

  const addJob = useCallback((job: Omit<Job, 'id' | 'createdAt' | 'status'>) => {
    const newJob: Job = {
      ...job,
      id: 'job_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      status: 'open',
    };
    setJobs((prev) => {
      const updated = [newJob, ...prev];
      persist(updated);
      return updated;
    });
  }, []);

  const getJob = useCallback(
    (id: string) => jobs.find((j) => j.id === id),
    [jobs]
  );

  const takeJob = useCallback((jobId: string, userId: string, userName: string) => {
    setJobs((prev) => {
      const updated = prev.map((j) =>
        j.id === jobId
          ? { ...j, status: 'in_progress' as const, takenById: userId, takenByName: userName }
          : j
      );
      persist(updated);
      return updated;
    });
  }, []);

  const completeJob = useCallback((jobId: string) => {
    setJobs((prev) => {
      const updated = prev.filter((j) => j.id !== jobId);
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
