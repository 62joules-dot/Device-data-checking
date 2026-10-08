export default function BarRow({
  label,
  value,
  max,
  color,
  suffix,
}: {
  label: React.ReactNode;
  value: number;
  max: number;
  color: string;
  suffix?: string;
}) {
  const pct = max > 0 ? Math.max((value / max) * 100, value > 0 ? 2 : 0) : 0;
  return (
    <div className="group relative flex items-center gap-3 py-1.5">
      <div className="w-32 flex-none truncate text-sm text-zinc-600">{label}</div>
      <div className="relative h-5 flex-1 rounded-full bg-zinc-100">
        <div
          className="h-5 rounded-full transition-[width]"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-16 flex-none text-right text-sm font-medium text-zinc-700">
        {value}
        {suffix}
      </div>
      <div className="pointer-events-none absolute -top-8 left-32 z-10 rounded-md bg-zinc-900 px-2 py-1 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {label}: {value}
        {suffix}
      </div>
    </div>
  );
}
