interface ProseBlock {
  title: string
  content: string
}

interface CancellationProseProps {
  title: string
  blocks: ProseBlock[]
}

/**
 * Detailed policy terms — 4 blocks with gold left border on a white surface.
 */
export function CancellationProse({ title, blocks }: CancellationProseProps) {
  return (
    <section aria-label="Detailed policy terms" className="bg-[var(--color-surface)] py-16">
      <div className="container mx-auto px-5 md:px-20 lg:px-40">
        {/* Header */}
        <div className="mb-10 text-center">
          <h2 className="font-serif text-3xl font-bold text-[var(--color-primary)]">{title}</h2>
          <div className="mx-auto mt-3 h-[3px] w-15 bg-[var(--color-secondary)]" />
        </div>

        {/* Policy blocks */}
        <div className="space-y-8">
          {blocks.map((block, i) => (
            <div key={i} className="border-l-4 border-[var(--color-secondary)] pl-6">
              <h3 className="text-lg font-bold text-[var(--color-primary)]">{block.title}</h3>
              <p className="mt-2 text-[var(--color-text)]">{block.content}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
