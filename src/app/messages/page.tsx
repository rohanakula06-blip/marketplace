'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { useAuthStore } from '@/store/app-store';
import { Send, Bot, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { suggestMessage } from '@/lib/ai';

interface Message {
  id: string;
  message: string;
  sender: { id: string; name: string };
  receiver: { id: string; name: string };
  timestamp: string;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  lastMessage: string;
  bookingId?: string;
}

export default function MessagesPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const authReady = useAuthStore((s) => s.authReady);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!user) { router.replace('/login'); return; }
    fetch('/api/messages')
      .then((r) => r.json())
      .then((d) => {
        const msgs: Message[] = d.messages || [];
        const convMap = new Map<string, Conversation>();
        msgs.forEach((m) => {
          const partnerId = m.sender.id === user.id ? m.receiver.id : m.sender.id;
          const partnerName = m.sender.id === user.id ? m.receiver.name : m.sender.name;
          convMap.set(partnerId, { partnerId, partnerName, lastMessage: m.message });
        });
        setConversations(Array.from(convMap.values()));
      });
  }, [user, authReady, router]);

  useEffect(() => {
    if (!selected || !user) return;
    fetch(`/api/messages?partnerId=${selected.partnerId}`)
      .then((r) => r.json())
      .then((d) => setMessages(d.messages || []));
  }, [selected, user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!text.trim() || !selected || !user) return;
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ receiverId: selected.partnerId, message: text, bookingId: selected.bookingId }),
    });
    if (res.ok) {
      const { message } = await res.json();
      setMessages((m) => [...m, message]);
      setText('');
    }
  };

  const suggestions = suggestMessage(user?.workerProfile ? 'worker' : 'customer', 'service booking');

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="pt-24 pb-8 mx-auto max-w-5xl px-4">
        <div className="mb-6">
          <Link href="/" className="text-sm text-slate-500 hover:text-blue-600 flex items-center gap-1 mb-2"><ArrowLeft size={14} /> Back</Link>
          <h1 className="text-3xl font-bold text-slate-900">Connect with Professionals</h1>
          <p className="text-slate-500 text-sm mt-1">🔒 Private messaging — phone numbers are never shared</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex" style={{ height: 'calc(100vh - 220px)' }}>
          {/* Conversation list */}
          <div className="w-80 border-r border-slate-100 flex flex-col shrink-0">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">Conversations</h3>
            </div>
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <p className="p-6 text-sm text-slate-400 text-center">No conversations yet. Book a professional to start chatting.</p>
              ) : conversations.map((c) => (
                <button
                  key={c.partnerId}
                  onClick={() => setSelected(c)}
                  className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors ${selected?.partnerId === c.partnerId ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                      {c.partnerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-slate-900 truncate">{c.partnerName}</p>
                      <p className="text-xs text-slate-500 truncate">{c.lastMessage}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            {selected ? (
              <>
                <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {selected.partnerName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{selected.partnerName}</p>
                    <p className="text-xs text-teal-600">Secure in-app chat</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.sender.id === user.id ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${m.sender.id === user.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                        {m.message}
                        <p className={`text-xs mt-1 ${m.sender.id === user.id ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(m.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                <div className="p-3 border-t border-slate-100">
                  <div className="flex gap-2 mb-2 overflow-x-auto">
                    {suggestions.map((s, i) => (
                      <button key={i} onClick={() => setText(s)} className="text-xs px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap flex items-center gap-1 shrink-0">
                        <Bot size={12} />{s.slice(0, 40)}...
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && send()}
                      placeholder="Type a message..."
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    />
                    <button onClick={send} className="btn-primary !p-2.5"><Send size={18} /></button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                Select a conversation or book a professional to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
