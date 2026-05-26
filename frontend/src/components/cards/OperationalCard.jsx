import React from 'react';

export default function OperationalCard({ children, title, headerAction, className = '', interactive = false, onClick }) {
  const cardClass = interactive ? 'surface-card-interactive' : 'surface-card';
  
  return (
    <div 
      className={`${cardClass} p-5 ${className}`} 
      onClick={onClick}
    >
      {(title || headerAction) && (
        <div className="flex items-center justify-between gap-4 mb-4 pb-3 border-b border-white/5">
          {title && (
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">
              {title}
            </h3>
          )}
          {headerAction && (
            <div className="shrink-0">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div>
        {children}
      </div>
    </div>
  );
}
