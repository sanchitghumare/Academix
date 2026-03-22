import React from 'react';

const Attendancecard = ({ subject, onUpdate, onDelete, onEdit, displayPct, isDropping, simulatedSlots = 0 }) => {
  if (!subject) return null;
  const { name, attended, total, minRequired } = subject;
  
  const percentage = total === 0 ? 0 : Math.round((attended / total) * 100);
  const shownPercentage = typeof displayPct === 'number' ? displayPct : percentage;
  const target = Math.max(0, Math.min(100, minRequired || 0));
  
  const getPrediction = () => {
    const requiredRatio = target / 100;
    if (requiredRatio === 0) {
      return { text: 'No minimum set', color: 'text-emerald-300', isSafe: true };
    }

    if (total === 0 || (attended / total) >= requiredRatio) {
      const canSkip = Math.floor(attended / requiredRatio - total);
      return { text: canSkip > 0 ? `Safe to skip ${canSkip}` : "Don't skip!", color: "text-green-500", isSafe: true };
    } else {
      const required = Math.ceil((requiredRatio * total - attended) / (1 - requiredRatio));
      return { text: `Attend next ${required}`, color: "text-red-500", isSafe: false };
    }
  };

  const prediction = getPrediction();
  
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-slate-900/95 via-slate-950 to-black p-5 shadow-[0_20px_60px_-35px_rgba(56,189,248,0.65)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-300/30">
      <div className="pointer-events-none absolute -top-14 -right-10 h-28 w-28 rounded-full bg-cyan-400/25 blur-3xl" />

      <div className="mb-5 flex items-start justify-between gap-3">
        <h3 className="line-clamp-1 text-xl font-extrabold tracking-tight text-white">{name}</h3>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${prediction.isSafe ? 'border-emerald-300/30 bg-emerald-400/10 text-emerald-300' : 'border-rose-300/30 bg-rose-400/10 text-rose-300'}`}>
            Goal {target}%
          </span>
          <button
            className='rounded-full border border-cyan-300/40 bg-cyan-400/20 px-3 py-1 text-xs font-bold text-cyan-100'
            onClick={() => onEdit(subject)}
          >
            Edit
          </button>
          <button className='rounded-full bg-rose-500 px-3 py-1 text-white' onClick={() => onDelete(subject._id)}>
            Delete
          </button>
        </div>
      </div>

      <div className="mb-4 flex items-end gap-3">
        <span className="text-5xl font-black leading-none text-white">{shownPercentage}%</span>
        <span className="pb-1 text-sm font-medium text-slate-300">{attended}/{total} classes</span>
      </div>

      {isDropping && simulatedSlots > 0 && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-amber-300">
          Simulated skip today: +{simulatedSlots} total classes
        </p>
      )}

      <div className="mb-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-800/90">
        <div
          className={`h-full rounded-full transition-all duration-500 ${prediction.isSafe ? 'bg-linear-to-r from-emerald-500 to-cyan-400' : 'bg-linear-to-r from-rose-500 to-orange-400'}`}
          style={{ width: `${Math.min(shownPercentage, 100)}%` }}
        />
      </div>
      <div className="relative mb-5 h-4">
        <div
          className="absolute top-0 h-4 w-px bg-amber-300/80"
          style={{ left: `${Math.min(target, 100)}%` }}
          title={`Target ${target}%`}
        />
      </div>

      <p className={`mb-6 text-sm font-semibold ${prediction.color}`}>{prediction.text}</p>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onUpdate(name, 'present')}
          className="rounded-xl bg-emerald-400 px-4 py-2.5 text-sm font-extrabold text-slate-950 transition-transform duration-200 hover:scale-[1.02] active:scale-95"
        >
          + Present
        </button>
        <button
          onClick={() => onUpdate(name, 'absent')}
          className="rounded-xl border border-white/20 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition-transform duration-200 hover:scale-[1.02] hover:bg-white/10 active:scale-95"
        >
          - Absent
        </button>
      </div>
    </article>
  );
};

export default Attendancecard;