import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

interface BlogCardProps {
  title: string
  excerpt: string
  image: string
  imageAlt: string
  category: string
  slug: string
}

export function BlogCard({ title, excerpt, image, imageAlt, category, slug }: BlogCardProps) {
  const t = useTranslations('home.blog')

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)] transition-shadow duration-300 hover:shadow-[var(--shadow-card-hover)]">
      {/* Image */}
      <div className="relative aspect-[16/9]">
        <Image
          src={image}
          alt={imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>

      {/* Content */}
      <div className="p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent)]">
          {category}
        </span>
        <h3 className="mt-2 font-serif text-lg font-semibold text-[var(--color-primary)]">
          {title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-muted)]">
          {excerpt}
        </p>
        <Link
          href={`/blog/${slug}` as '/tours'}
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-dark)]"
        >
          {t('readMore')}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  )
}
