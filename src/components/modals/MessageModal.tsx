'use client';

import { useState, useEffect } from 'react';
import { X, Send, Bot } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store/app-store';
import { suggestMessage } from '@/lib/ai';

export function MessageModal() {
  const { messageModal, setMessageModal, showToast, openAuth } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<{ message: string; sender: { id: string; name: string } }[]>([]);
  const [text, setText] = useState('');
  const [suggestions] = useState(() => suggestMessage('customer', 'service request'));

  useEffect(() => {
    if (messageModal && user) {
      const params = new URLSearchParams({ partnerId: messageModal.userId });
      if (messageModal.bookingId) params.set('bookingId', messageModal.bookingId);
      fetch(`/api/messages?${params}`)
        .then((r) => r.json())
        .then((d) => setMessages(d.messages || []))
        .catch(() => {});
    }
  }, [messageModal, user]);

  if (!messageModal) return null;

  const send = async () => {
    if (!user) { openAuth('login'); return; }
    if (!text.trim()) return;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: messageModal.userId,
        bookingId: messageModal.bookingId,
        message: text,
      }),
    });
    if (res.ok) {
      const { message } = await res.json();
      setMessages((m) => [...m, message]);
      setText('');
    } else showToast('Failed to send message', 'error');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-strong rounded-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div>
            <h3 className="font-semibold text-slate-900">Messages</h3>
            <p className="text-xs text-teal-600">🔒 Private · No phone numbers shared</p>
          </div>
          <button onClick={() => setMessageModal(null)} className="text-slate-400 hover:text-slate-700"><X size={20} /></button>
        </div>
        <div className="p-4 space-y-3 min-h-[300px] max-h-[400px] overflow-y-auto">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.sender.id === user?.id ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${m.sender.id === user?.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                {m.message}
              </div>
            </div>
          ))}
          <div className="glass rounded-xl p-3 text-xs text-slate-600 flex items-start gap-2">
            <Bot size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium text-amber-600 mb-1">AI Suggestions</p>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setText(s)} className="block text-left text-slate-700 hover:text-blue-600 mb-1">{s}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-200 flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..."
            className="flex-1 input-light rounded-xl px-4 py-2 text-sm" onKeyDown={(e) => e.key === 'Enter' && send()} />
          <button onClick={send} className="btn-primary !p-2"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
}
