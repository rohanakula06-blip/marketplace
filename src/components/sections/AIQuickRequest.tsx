'use client';

import { useState } from 'react';
import { Mic, Camera, Sparkles, Loader2 } from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

interface AIResult {
  analysis: {
    serviceDetected: string;
    category: string;
    urgency: string;
    safetyAdvice: string | null;
    recommendedRadius: number;
    suggestedPriceRange: string;
    summary: string;
  };
  availableWorkers: number;
  workers: { id: string; name: string; category: string; rating: number; pricing: string }[];
}

export function AIQuickRequest() {
  const [description, setDescription] = useState('My switchboard is making sparks.');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResult | null>(null);
  const { location, locationReady, openAuth, setWorkerProfileModal } = useUIStore();

  const analyze = async () => {
    if (!locationReady) return;
    setLoading(true);
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, location }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult(null);
    }
    setLoading(false);
  };

  return (
    <div className="glass-strong rounded-2xl p-6 md:p-8 mt-0">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-amber-500" size={20} />
        <h3 className="text-lg font-semibold text-slate-900">Not sure which professional you need? Ask LocalPro AI.</h3>
      </div>

      <div className="space-y-4">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your problem"
          className="w-full rounded-xl bg-slate-50 border border-slate-200 p-4 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 min-h-[80px] resize-none"
        />
        <div className="flex flex-wrap gap-3">
          <button className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100">
            <Mic size={16} /> Speak
          </button>
          <button className="flex items-center gap-2 glass px-4 py-2 rounded-xl text-sm text-slate-700 hover:bg-slate-100">
            <Camera size={16} /> Upload Photo
          </button>
          {locationReady && (
            <input
              type="text"
              value={location}
              readOnly
              className="flex-1 min-w-[200px] rounded-xl bg-slate-50 border border-slate-200 px-4 py-2 text-sm text-slate-700"
            />
          )}
          <button onClick={analyze} disabled={loading || !locationReady} className="btn-primary flex items-center gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            Analyse My Problem
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6 animate-in fade-in">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-4">
            <div><span className="text-slate-500 text-sm">Service detected:</span><p className="font-semibold text-amber-700">{result.analysis.serviceDetected}</p></div>
            <div><span className="text-slate-500 text-sm">Urgency:</span><p className={cn('font-semibold', result.analysis.urgency === 'high' ? 'text-red-600' : 'text-amber-600')}>{result.analysis.urgency.charAt(0).toUpperCase() + result.analysis.urgency.slice(1)}</p></div>
            <div><span className="text-slate-500 text-sm">Search radius:</span><p className="font-semibold text-slate-900">{result.analysis.recommendedRadius} km</p></div>
            <div><span className="text-slate-500 text-sm">Available verified workers:</span><p className="font-semibold text-teal-600">{result.availableWorkers}</p></div>
            <div className="sm:col-span-2"><span className="text-slate-500 text-sm">Price guidance:</span><p className="font-semibold text-slate-900">{result.analysis.suggestedPriceRange}</p></div>
          </div>
          {result.analysis.safetyAdvice && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 mb-4">
              <p className="text-sm font-semibold text-red-700">⚠️ Safety advice: {result.analysis.safetyAdvice}</p>
            </div>
          )}
          <button
            onClick={() => {
              if (result.workers[0]) setWorkerProfileModal(result.workers[0].id);
              else openAuth('register', 'customer');
            }}
            className="btn-gold"
          >
            View Recommended {result.analysis.serviceDetected}s
          </button>
          <p className="mt-3 text-xs text-slate-500">AI provides assistance and recommendations. The customer makes the final selection.</p>
        </div>
      )}
    </div>
  );
}
