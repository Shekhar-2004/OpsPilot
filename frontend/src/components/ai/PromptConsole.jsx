import React from 'react';
import { Send, Sparkles, Terminal } from 'lucide-react';

export default function PromptConsole({ 
  value, 
  onChange, 
  onSubmit, 
  loading = false, 
  placeholder = "Ask copilot operational questions...",
  pills = [
    { label: "Show overdue tasks", cmd: "Show overdue tasks" },
    { label: "Which tasks are blocked?", cmd: "Which tasks are blocked?" },
    { label: "Workload balancing summary", cmd: "Summarize sponsorship work" }
  ]
}) {
  
  const handlePillClick = (cmd) => {
    if (onChange) onChange({ target: { value: cmd } });
  };

  return (
    <div className="space-y-4 bg-surface-container/30 border border-outline-variant/30 p-4 rounded-xxl relative overflow-hidden">
      
      {/* Glow background accent */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Pill Shortcuts */}
      {pills.length > 0 && (
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
          {pills.map((p, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handlePillClick(p.cmd)}
              className="text-[10px] font-sans font-bold text-secondary hover:text-primary bg-secondary-container/5 hover:bg-secondary-container/10 border border-secondary/25 hover:border-secondary/40 rounded-lg px-2.5 py-1.5 transition-all text-left shrink-0 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Console Input bar */}
      <form onSubmit={onSubmit} className="flex gap-3">
        <div className="relative flex-1">
          <Terminal className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/70" />
          <input
            type="text"
            required
            disabled={loading}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            className="w-full pl-8 pr-4 py-3 console-input text-primary font-sans text-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="px-5 py-3 bg-primary hover:opacity-90 disabled:bg-surface-container disabled:text-on-surface-variant/50 rounded-lg text-on-primary font-bold text-sm transition-all flex items-center gap-2 shadow-sm shrink-0 cursor-pointer disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-on-primary/20 border-t-on-primary rounded-full animate-spin"></span>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Analyze</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
