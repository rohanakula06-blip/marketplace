'use client';

import { MessageSquare, MapPin, Image, Bot } from 'lucide-react';

const MESSAGES = [
  { from: 'customer', text: 'Hi Rajesh, the ceiling fan in the master bedroom stopped working.' },
  { from: 'worker', text: 'Hello Priya! I can come tomorrow at 11 AM. Is that convenient?' },
  { from: 'customer', text: 'Perfect, see you then. Address is Banjara Hills Road No. 12.' },
];

export function MessagingPreview() {
  return (
    <section className="section-padding">
      <div className="mx-auto max-w-4xl">
        <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">Secure In-App Messaging</h2>
        <div className="glass-strong rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-slate-900">Rajesh Kumar</h4>
              <p className="text-xs text-slate-500">Electrician · Booking #LP-2847</p>
            </div>
            <span className="text-xs text-teal-600">🔒 Private · No phone numbers shared</span>
          </div>
          <div className="p-6 space-y-4 min-h-[280px]">
            {MESSAGES.map((m, i) => (
              <div key={i} className={`flex ${m.from === 'customer' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${m.from === 'customer' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div className="glass rounded-xl p-3 text-xs text-slate-600 flex items-center gap-2">
              <Bot size={14} className="text-amber-500" />
              AI suggestion: &ldquo;Could you confirm if the fan makes any noise when switched on?&rdquo;
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 flex gap-2">
            <button className="p-2 glass rounded-lg text-slate-700 hover:bg-slate-100"><Image size={18} /></button>
            <button className="p-2 glass rounded-lg text-slate-700 hover:bg-slate-100"><MapPin size={18} /></button>
            <input placeholder="Type a message..." className="flex-1 input-light rounded-xl px-4 py-2 text-sm" />
            <button className="btn-primary !py-2 !px-4"><MessageSquare size={16} /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
