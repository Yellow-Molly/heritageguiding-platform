interface CompanyInfoEntry {
  label: string
  value: string
}

interface CompanyInfoCardProps {
  entries: CompanyInfoEntry[]
}

/**
 * White surface card with two-column key/value grid (single column on mobile).
 * Used in §01 Parties to display legal entity details.
 */
export function CompanyInfoCard({ entries }: CompanyInfoCardProps) {
  return (
    <dl className="my-6 grid grid-cols-1 gap-x-8 gap-y-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:grid-cols-2">
      {entries.map((entry) => (
        <div key={entry.label} className="flex flex-col gap-1">
          <dt className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--color-text-muted)]">
            {entry.label}
          </dt>
          <dd className="m-0 text-sm text-[var(--color-text)]">{entry.value}</dd>
        </div>
      ))}
    </dl>
  )
}
