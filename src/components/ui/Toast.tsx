'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { useUIStore } from '@/store/app-store';
import { cn } from '@/lib/utils';

export function Toast() {
  const toast = useUIStore((s) => s.toast);
  const clearToast = useUIStore((s) => s.clearToast);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(clearToast, 4000);
      return () => clearTimeout(t);
    }
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className={cn(
      'fixed bottom-6 right-6 z-[9999] flex items-center gap-3 rounded-xl px-5 py-4 shadow-2xl',
      toast.type === 'success' && 'bg-teal-600 text-white',
      toast.type === 'error' && 'bg-red-600 text-white',
      toast.type === 'info' && 'glass-strong text-slate-900'
    )}>
      <span>{toast.message}</span>
      <button onClick={clearToast} className="opacity-70 hover:opacity-100"><X size={16} /></button>
    </div>
  );
}
