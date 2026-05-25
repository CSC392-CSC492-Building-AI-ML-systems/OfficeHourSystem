interface StatCardProps {
  label: string;
  value: string;
  valueClassName?: string;
}

export function StatCard({
  label,
  value,
  valueClassName = "text-[#071f41]",
}: StatCardProps) {
  return (
    <article className="rounded-[26px] border border-slate-200/80 bg-white px-6 py-5 shadow-[0_18px_50px_-30px_rgba(15,41,66,0.35)]">
      <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-4 text-3xl font-semibold tracking-tight ${valueClassName}`}
      >
        {value}
      </p>
    </article>
  );
}
