import React from 'react';

export default function StatusBadge({ status, size = 'sm' }) {
  const normalized = status?.toLowerCase() || '';

  let colors = 'bg-slate-800 text-slate-400 border-white/5';
  let dot = 'bg-slate-500';

  if (['done', 'synced', 'healthy', 'operational', 'completed', 'active'].includes(normalized)) {
    colors = 'bg-secondary/10 text-secondary border-secondary/15';
    dot = 'bg-secondary';
  } else if (['blocked', 'warning', 'degraded', 'pending', 'processing'].includes(normalized)) {
    colors = 'bg-warning/10 text-warning border-warning/15';
    dot = 'bg-warning';
  } else if (['critical', 'urgent', 'failed', 'danger', 'error'].includes(normalized)) {
    colors = 'bg-error/10 text-error border-error/15';
    dot = 'bg-error';
  }

  const padding = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <span className={`inline-flex items-center gap-1.5 font-bold uppercase tracking-wider rounded-full border ${padding} ${colors}`}>
      <span className={`rounded-full shrink-0 ${dotSize} ${dot}`} />
      {status}
    </span>
  );
}
