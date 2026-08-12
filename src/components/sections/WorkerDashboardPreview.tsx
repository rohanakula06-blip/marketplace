'use client';

import { useEffect, useState } from 'react';
import { MapPin, Clock, Users } from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  budget: string;
  date: string;
  time: string;
  urgency: string;
  distance: number;
  applicationCount: number;
}

export function WorkerDashboardPreview() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [available, setAvailable] = useState(true);
  const { openAuth, showToast } = useUIStore();

  useEffect(() => {
    fetch('/api/jobs?status=open')
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs || []))
      .catch(() => {});
  }, []);

  const apply = async (jobId: string) => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        proposedPrice: '₹650',
        message: 'I am available and can help with this job.',
        estimatedArrival: '45 minutes',
      }),
    });
    if (res.status === 401) {
      openAuth('login', 'worker');
      return;
    }
    if (res.ok) showToast('Application submitted successfully!', 'success');
    else showToast('Failed to submit application', 'error');
  };

  return (
    <section id="for-workers" className="section-padding">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-bold mb-2">Worker Marketplace Preview</h2>
        <p className="text-slate-600 mb-8">Discover nearby jobs and grow your earnings</p>

        <div className="glass-strong rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Availability</span>
              <button
                onClick={() => setAvailable(!available)}
                className={cn('relative w-14 h-7 rounded-full transition-colors', available ? 'bg-teal-600' : 'bg-slate-600')}
              >
                <div className={cn('absolute top-1 w-5 h-5 rounded-full bg-white transition-transform', available ? 'left-8' : 'left-1')} />
              </button>
              <span className={cn('text-sm font-medium', available ? 'text-teal-400' : 'text-slate-500')}>{available ? 'Online' : 'Offline'}</span>
            </div>
            <input placeholder="Search jobs..." className="input-light rounded-xl px-4 py-2 text-sm min-w-[200px]" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <div key={job.id} className="glass rounded-xl p-5 hover:border-teal-500/30 border border-transparent transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{job.title}</h4>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    job.urgency === 'emergency' ? 'bg-red-100 text-red-700' :
                    job.urgency === 'same-day' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                  )}>{job.urgency}</span>
                </div>
                <p className="text-sm text-teal-600 capitalize mb-2">{job.category}</p>
                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{job.description}</p>
                <div className="flex flex-wrap gap-3 text-xs text-slate-500 mb-4">
                  <span className="flex items-center gap-1"><MapPin size={12} />{job.distance} km</span>
                  <span className="flex items-center gap-1"><Clock size={12} />{job.date} {job.time}</span>
                  <span className="flex items-center gap-1"><Users size={12} />{job.applicationCount} applied</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-amber-600">{job.budget}</span>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1.5 rounded-lg glass text-slate-700 hover:bg-slate-100">View Details</button>
                    <button onClick={() => apply(job.id)} className="text-xs px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 font-medium">Apply for Job</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
