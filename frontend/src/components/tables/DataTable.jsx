import React from 'react';

export default function DataTable({ headers = [], rows = [], renderRow }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-white/5 bg-surface-container/30">
      <table className="w-full border-collapse text-left text-xs">
        <thead className="bg-[#0e1017] border-b border-white/5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <tr>
            {headers.map((h, idx) => (
              <th key={idx} className="py-3 px-4 font-semibold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="py-8 text-center text-slate-500 font-medium italic">
                No active records matching current criteria.
              </td>
            </tr>
          ) : (
            rows.map((row, idx) => (
              <tr key={idx} className="data-table-row">
                {renderRow(row, idx)}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
