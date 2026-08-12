'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { Navbar } from '@/components/layout/Navbar';
import { LocationControls } from '@/components/maps/LocationControls';
import { useUIStore, useAuthStore } from '@/store/app-store';
import { MapPin, Clock, Users } from 'lucide-react';

const LocationMapSection = dynamic(
  () => import('@/components/maps/LocationMapSection').then((m) => m.LocationMapSection),
  { ssr: false }
);

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: string;
  date: string;
  time: string;
  urgency: string;
  distance: number;
  applicationCount: number;
  latitude?: number;
  longitude?: number;
}

export default function FindJobsPage() {
  const { coords, openAuth, showToast } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    fetch(`/api/jobs?status=open&lat=${coords.lat}&lng=${coords.lng}`)
      .then((r) => r.json())
      .then((d) => setJobs(d.jobs || []));
  }, [coords]);

  const apply = async (jobId: string) => {
    if (!user) {
      openAuth('login', 'worker');
      return;
    }
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jobId,
        proposedPrice: '₹650',
        message: 'Available to help!',
        estimatedArrival: '45 min',
      }),
    });
    if (res.ok) showToast('Application submitted!', 'success');
    else showToast('Failed to apply', 'error');
  };

  const jobMarkers = jobs.map((j) => ({
    id: j.id,
    lat: j.latitude || coords.lat + (Math.random() - 0.5) * 0.05,
    lng: j.longitude || coords.lng + (Math.random() - 0.5) * 0.05,
    title: j.title,
    subtitle: `${j.budget} · ${j.distance} km`,
    type: 'job' as const,
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-12 mx-auto max-w-7xl px-4">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Find Nearby Jobs</h1>
        <p className="text-slate-500 mb-6">Map auto-detects your location to show nearby opportunities</p>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-6">
          <LocationControls compact />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-xl border border-slate-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-900">{job.title}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${job.urgency === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {job.urgency}
                  </span>
                </div>
                <p className="text-sm text-teal-600 capitalize mb-2">{job.category}</p>
                <p className="text-sm text-slate-600 mb-3">{job.description}</p>
                <div className="flex gap-4 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {job.distance} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {job.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {job.applicationCount} applied
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-amber-600">{job.budget}</span>
                  <button
                    onClick={() => apply(job.id)}
                    className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-700"
                  >
                    Apply for Job
                  </button>
                </div>
              </div>
            ))}
          </div>

          <LocationMapSection markers={jobMarkers} searchRadiusKm={15} height="600px" />
        </div>
      </div>
    </div>
  );
}
