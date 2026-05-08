import type { PrivacySubProcessorTableProps } from './types'

/**
 * Sub-processor table — provider monogram chip + name; transfer cell uses
 * <abbr> for "EU SCCs" tooltip. Mobile stacks to cards.
 */
export function PrivacySubProcessorTable({
  id,
  heading,
  intro,
  caption,
  columnHeaders,
  rows,
}: PrivacySubProcessorTableProps) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-heading` : undefined} className="scroll-mt-24">
      <h2
        id={id ? `${id}-heading` : undefined}
        className="mb-4 font-serif text-2xl font-bold text-[var(--color-primary)] md:text-3xl"
      >
        {heading}
        <span className="mt-2 block h-[2px] w-8 bg-[var(--color-secondary-light)]" />
      </h2>
      {intro && <p className="mb-6 text-[var(--color-text)]">{intro}</p>}
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
                  {columnHeaders.provider}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-primary)]">
                  {columnHeaders.role}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-primary)]">
                  {columnHeaders.location}
                </th>
                <th scope="col" className="px-4 py-3 font-semibold text-[var(--color-primary)]">
                  {columnHeaders.transfer}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr
                  key={i}
                  className="border-t border-[var(--color-border-light)] even:bg-[var(--color-background-alt)]/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-[var(--color-secondary-light)] text-xs font-bold text-[var(--color-primary)]"
                      >
                        {row.monogram}
                      </span>
                      <span className="font-medium text-[var(--color-primary)]">
                        {row.provider}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[var(--color-text)]">{row.role}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">{row.location}</td>
                  <td className="px-4 py-3 text-[var(--color-text-muted)]">
                    {renderTransfer(row.transfer)}
                  </td>
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
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-[var(--color-secondary-light)] text-xs font-bold text-[var(--color-primary)]"
                >
                  {row.monogram}
                </span>
                <span className="font-semibold text-[var(--color-primary)]">{row.provider}</span>
              </div>
              <dl className="space-y-1 text-sm">
                <div className="flex flex-col">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {columnHeaders.role}
                  </dt>
                  <dd className="text-[var(--color-text)]">{row.role}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {columnHeaders.location}
                  </dt>
                  <dd className="text-[var(--color-text)]">{row.location}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                    {columnHeaders.transfer}
                  </dt>
                  <dd className="text-[var(--color-text)]">{renderTransfer(row.transfer)}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      </figure>
    </section>
  )
}

/**
 * Render transfer mechanism — wraps "EU SCCs" in <abbr> for tooltip context.
 */
function renderTransfer(value: string) {
  if (!value.includes('SCC')) return value
  return (
    <abbr title="EU Standard Contractual Clauses" className="cursor-help no-underline">
      {value}
    </abbr>
  )
}
