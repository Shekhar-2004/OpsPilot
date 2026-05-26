import React from 'react';
import { Sparkles } from 'lucide-react';

export default function AIIndicator({ active = true, label = 'AI Synchronized' }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-primary/5 border border-primary/10 rounded-lg text-primary text-[10px] font-bold uppercase tracking-wider">
      <span className="relative flex h-2 w-2">
        {active && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
        )}
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
      </span>
      <span>{label}</span>
    </div>
  );
}
