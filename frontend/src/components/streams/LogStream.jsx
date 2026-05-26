import React from 'react';

export default function LogStream({ logs = [], maxLogs = 50, className = '' }) {
  const visibleLogs = logs.slice(-maxLogs);

  return (
    <div className={`w-full bg-[#0b0c10] border border-white/5 rounded-xl p-4 font-mono text-xs text-secondary leading-normal overflow-y-auto max-h-[300px] shadow-inner ${className}`}>
      {visibleLogs.length === 0 ? (
        <div className="text-slate-600 italic text-center py-6">
          [listening] waiting for telemetry ingestion packets...
        </div>
      ) : (
        <div className="space-y-1">
          {visibleLogs.map((log, idx) => (
            <div key={idx} className="log-row flex items-start gap-2 text-slate-300">
              <span className="text-slate-600 select-none">[{log.timestamp || new Date().toLocaleTimeString()}]</span>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                log.status === 'error' ? 'bg-error/10 text-error' : 
                log.status === 'warning' ? 'bg-warning/10 text-warning' : 
                'bg-secondary/10 text-secondary'
              }`}>
                {log.type || 'SYS'}
              </span>
              <span className="flex-1 text-slate-300">{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
