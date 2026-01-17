import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/language-switcher'

export default function HomePage() {
  const t = useTranslations('home')
  const tCommon = useTranslations('common')

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-white px-4 text-center">
      {/* Language switcher in top-right corner */}
      <div className="fixed right-4 top-4">
        <LanguageSwitcher />
      </div>

      <main className="max-w-2xl space-y-8">
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          {t('hero.title')}
        </h1>
        <p className="text-lg text-slate-600">{t('hero.subtitle')}</p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href={t('hero.cta')}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {t('hero.cta')}
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            Admin Panel
          </Link>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <p className="text-sm font-semibold text-green-800">✅ Phase 02: i18n & Localization</p>
          <p className="mt-1 text-xs text-green-700">
            Multi-language support active. Try switching languages above!
          </p>
        </div>
      </main>
    </div>
  )
}
