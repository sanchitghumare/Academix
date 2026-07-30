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
      return { text: 'No minimum set', color: 'text-emerald-400', isSafe: true };
    }

    if (total === 0 || (attended / total) >= requiredRatio) {
      const canSkip = Math.floor(attended / requiredRatio - total);
      return { text: canSkip > 0 ? `Safe to skip ${canSkip}` : "Don't skip!", color: "text-emerald-400", isSafe: true };
    } else {
      const required = Math.ceil((requiredRatio * total - attended) / (1 - requiredRatio));
      return { text: `Attend next ${required}`, color: "text-rose-400", isSafe: false };
    }
  };

  const prediction = getPrediction();
  
  return (
    <article className="group flex flex-col justify-between rounded-xl border border-[#27272A] bg-[#111113] p-5 transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-600">
      <div>
        {/* Card Header & Controls */}
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-[#27272A]/50 pb-3">
          <h3 className="line-clamp-1 text-base font-bold text-[#FAFAFA]" title={name}>
            {name}
          </h3>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${prediction.isSafe ? 'border border-emerald-800/40 bg-emerald-950/40 text-emerald-400' : 'border border-rose-800/40 bg-rose-950/40 text-rose-400'}`}>
              Goal {target}%
            </span>
            <button
              className="rounded-md border border-[#27272A] bg-transparent px-2 py-0.5 text-[11px] font-medium text-[#FAFAFA] transition-colors hover:bg-zinc-900/50"
              onClick={() => onEdit(subject)}
            >
              Edit
            </button>
            <button 
              className="rounded-md border border-[#27272A] bg-transparent px-2 py-0.5 text-[11px] font-medium text-rose-400/80 transition-colors hover:border-rose-900/50 hover:text-rose-400" 
              onClick={() => onDelete(subject._id)}
            >
              Delete
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-4xl font-bold tracking-tight text-[#FAFAFA]">{shownPercentage}%</span>
          <span className="text-xs font-medium text-[#A1A1AA]">{attended} / {total} classes</span>
        </div>

        {isDropping && simulatedSlots > 0 && (
          <p className="mb-2 text-[11px] font-medium text-amber-400">
            Simulated skip today: +{simulatedSlots} classes
          </p>
        )}

        {/* Progress Bar & Goal Indicator */}
        <div className="relative mb-2 mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#09090B]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${prediction.isSafe ? 'bg-emerald-400' : 'bg-rose-500'}`}
              style={{ width: `${Math.min(shownPercentage, 100)}%` }}
            />
          </div>
          {/* Target marker line */}
          <div
            className="absolute -top-1 h-3.5 w-0.5 bg-[#FAFAFA]"
            style={{ left: `${Math.min(target, 100)}%` }}
            title={`Target ${target}%`}
          />
        </div>

        {/* Status Text */}
        <p className={`mt-3 mb-5 text-xs font-semibold ${prediction.color}`}>{prediction.text}</p>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#27272A]/50">
        <button
          onClick={() => onUpdate(name, 'present')}
          className="rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          + Present
        </button>
        <button
          onClick={() => onUpdate(name, 'absent')}
          className="rounded-lg border border-[#27272A] bg-transparent px-3 py-2 text-xs font-semibold text-[#FAFAFA] transition-colors hover:border-zinc-700 hover:bg-zinc-900/50"
        >
          - Absent
        </button>
      </div>
    </article>
  );
};

export default Attendancecard;