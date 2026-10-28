interface Props<T extends string> { label: string; value: T; options: [T, string][]; onChange: (v: T) => void }

export default function Chips<T extends string>({ label, value, options, onChange }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map(([v, t]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={`rounded-full border px-3 py-1.5 text-sm ${value === v ? "border-navy-900 bg-navy-900 text-white" : "bg-white text-slate-700 hover:bg-slate-100"}`}>
          {t}
        </button>
      ))}
    </div>
  );
}
