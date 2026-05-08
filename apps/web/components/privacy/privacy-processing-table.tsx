import type { PrivacyProcessingTableProps } from './types'

/**
 * Processing Register — full table on ≥md, stacked card list on mobile.
 * Legal-basis cell rendered as a pill.
 */
export function PrivacyProcessingTable({
  id,
  heading,
  caption,
  columnHeaders,
  rows,
}: PrivacyProcessingTableProps) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-heading` : undefined} className="scroll-mt-24">
      <h2
        id={id ? `${id}-heading` : undefined}
        className="mb-6 font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl"
      >
        {heading}
        <span className="mt-2 block h-[2px] w-8 bg-[var(--color-secondary-light)]" />
      </h2>
      <figure>
        <figcaption className="mb-4 text-sm text-[var(--color-text-muted)] md:text-base">
          {caption}
        </figcaption>

        {/* Desktop table */}
        <div className="hidden overflow-hidden rounded-xl border-t-2 border-[var(--color-secondary-light)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] md:block">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[var(--color-background-alt)]">
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-primary)]">
                  {columnHeaders.activity}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-primary)]">
                  {columnHeaders.data}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-primary)]">
                  {columnHeaders.basis}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-primary)]">
                  {columnHeaders.retention}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-[var(--color-border-light)] even:bg-[var(--color-background-alt)]/40"
                >
                  <td className="px-4 py-3 font-medium text-[var(--color-text)]">{row.activity}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.dataCategories}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                      {row.legalBasis}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.retention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <ul className="space-y-3 md:hidden">
          {rows.map((row, i) => (
            <li
              key={i}
              className="space-y-2 rounded-lg bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]"
            >
              <p className="font-medium text-[var(--color-primary)]">{row.activity}</p>
              <dl className="space-y-1 text-sm">
                <div className="flex flex-col">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {columnHeaders.data}
                  </dt>
                  <dd className="text-[var(--color-text)]">{row.dataCategories}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {columnHeaders.basis}
                  </dt>
                  <dd>
                    <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-xs font-medium text-[var(--color-primary)]">
                      {row.legalBasis}
                    </span>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {columnHeaders.retention}
                  </dt>
                  <dd className="text-[var(--color-text)]">{row.retention}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </figure>
    </section>
  )
}
