import React from 'react';

export default function SkeletonList({ rows = 3, desktop = false, count = (desktop ? 6 : 3) }) {
  if (desktop) {
    return (
      <>
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="bg-white rounded-[2rem] border border-slate-100 p-6 animate-pulse space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-slate-50 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-50 rounded-lg w-3/4" />
                <div className="h-3 bg-slate-50 rounded-lg w-1/2" />
              </div>
            </div>
            <div className="h-10 bg-slate-50 rounded-xl w-full" />
          </div>
        ))}
      </>
    );
  }

  return (
    <>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse space-y-3">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-xl" />
            <div className="skeleton h-4 w-40" />
          </div>
          <div className="skeleton h-3 w-full opacity-50" />
        </div>
      ))}
    </>
  );
}
