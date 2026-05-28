type Props = {
  completed: number;
  total: number;
  pct: number;
  className?: string;
};

export function ProgressBar({ completed, total, pct, className = "" }: Props) {
  const isDone = total > 0 && completed >= total;

  return (
    <div className={className}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
        <div
          className={`h-full transition-all ${
            isDone ? "bg-emerald-500" : "bg-neutral-900"
          }`}
          style={{ width: `${pct}%` }}
          aria-hidden
        />
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        {isDone ? (
          <span className="font-medium text-emerald-700">
            Complete · {completed} of {total} lessons
          </span>
        ) : (
          <>
            {completed} of {total} lesson{total === 1 ? "" : "s"} · {pct}%
          </>
        )}
      </p>
    </div>
  );
}
