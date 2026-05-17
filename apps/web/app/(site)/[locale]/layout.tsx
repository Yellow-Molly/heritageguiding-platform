import '../../globals.css'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, localeMetadata, type Locale } from '@/i18n'
import { WhatsAppFloatingButton } from '@/components/shared/whatsapp-floating-button'
import { AiChatProvider } from '@/components/ai-chat'
import { SkipToContentLink } from '@/components/accessibility'
import { WebVitalsReporter } from '@/components/analytics/web-vitals-reporter'
import { inter, playfairDisplay } from '@/lib/fonts'
import { getWhatsAppNumber } from '@/lib/get-whatsapp-number-from-cms'
import { generateHreflangAlternates, generateOgLocaleAlternates } from '@/lib/seo'
import { isProductionDeployment } from '@/lib/environment'
import type { Metadata } from 'next'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'meta' })
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://privatetours.se'

  return {
    metadataBase: new URL(baseUrl),
    title: t('defaultTitle'),
    description: t('defaultDescription'),
    keywords: t('keywords'),
    alternates: generateHreflangAlternates('/', locale as Locale),
    openGraph: {
      type: 'website',
      locale: localeMetadata[locale as Locale]?.hreflang.replace('-', '_') || 'en_US',
      alternateLocale: generateOgLocaleAlternates(locale as Locale),
      url: `${baseUrl}/${locale}`,
      siteName: 'Private Tours',
    },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  // Validate locale parameter
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  // Load messages for the current locale
  const messages = await getMessages()

  // Fetch WhatsApp number from CMS globals (safe fallback to env var)
  const whatsappNumber = await getWhatsAppNumber()

  return (
    <html lang={locale} dir={localeMetadata[locale as Locale]?.dir || 'ltr'} suppressHydrationWarning>
      <head>
        {/*
          High-priority bandwidth lane intent (Slow 4G simulation):
            1. Document, Stylesheet (auto) — VeryHigh, structural
            2. Inter font (auto) — High, body text
            3. Hero image (Next/Image priority) — High, LCP candidate
          Everything else should be Low/VeryLow. SVG favicon is moved from
          app/icon.svg → public/icon.svg and re-declared with fetchpriority="low"
          here so Chrome doesn't auto-promote it to High and steal a slot from
          the hero image preload.
        */}
        <link
          rel="icon"
          href="/icon.svg"
          type="image/svg+xml"
          sizes="any"
          fetchPriority="low"
        />
        {/* Preconnect to critical third-party origins */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Bokun is lazy-loaded by LazyBokunWidget when booking sidebar enters
            viewport. Warming DNS/TLS here saves ~100-200ms when intersect fires. */}
        <link rel="dns-prefetch" href="https://widgets.bokun.io" />
        <link rel="dns-prefetch" href="https://static.bokun.io" />
        {/*
          Inline Bokun cart pin — must be parsed before Bokun's JS inserts #bokun-widgets-root,
          otherwise the wrapper renders inline (taking layout space, pushing content) and
          causes CLS 0.467 on TourDetails. External globals.css loads concurrently with JS so
          this rule must be inline. !important wins specificity over any Bokun inline styles.
        */}
        <style
          dangerouslySetInnerHTML={{
            __html: `#bokun-widgets-root{position:fixed!important;top:0!important;left:0!important;width:0!important;height:0!important;overflow:visible!important;contain:layout!important;pointer-events:none;z-index:60}#bokun-widgets-root *{pointer-events:auto}.bokun-widgets-cart-wrapper{position:fixed!important;bottom:1rem!important;right:1rem!important;left:auto!important;top:auto!important}`,
          }}
        />
        {/*
          Intercept dynamic Google Maps JS API loads (injected by Bokun widget without loading=async)
          and append loading=async + script.async=true so Google's loader doesn't log the
          "loaded directly without loading=async" warning. Narrow URL match (only maps.googleapis.com
          /maps/api/js) keeps blast radius minimal. Must run before any third-party bundle.
          Note: cross-origin iframes (Bokun checkout) are sealed sandboxes — patches here only
          affect the parent window's HTMLScriptElement prototype.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function r(v){return typeof v==='string'&&/maps\\.googleapis\\.com\\/maps\\/api\\/js/.test(v)&&!/[?&]loading=async/.test(v)?v+(v.indexOf('?')>-1?'&':'?')+'loading=async':v}var p=HTMLScriptElement.prototype,d=Object.getOwnPropertyDescriptor(p,'src');if(d&&d.set){Object.defineProperty(p,'src',{configurable:true,get:function(){return d.get.call(this)},set:function(v){var n=r(v);if(n!==v){this.async=true}d.set.call(this,n)}})}var sa=p.setAttribute;p.setAttribute=function(n,v){if(n==='src'){var nv=r(v);if(nv!==v){this.async=true}return sa.call(this,n,nv)}return sa.call(this,n,v)};if(typeof MutationObserver!=='undefined'){new MutationObserver(function(ms){ms.forEach(function(m){m.addedNodes.forEach(function(n){if(n.tagName==='SCRIPT'){var s=n.getAttribute('src');var ns=r(s);if(ns&&ns!==s){var rep=document.createElement('script');rep.async=true;rep.src=ns;n.parentNode&&n.parentNode.replaceChild(rep,n)}}})})}).observe(document,{childList:true,subtree:true})}})();`,
          }}
        />
        {/* Block indexing on non-production deployments */}
        {!isProductionDeployment() && (
          <meta name="robots" content="noindex, nofollow" />
        )}
      </head>
      <body className={`${inter.variable} ${playfairDisplay.variable} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AiChatProvider>
            <WebVitalsReporter />
            <SkipToContentLink />
            <div id="main">{children}</div>
            {whatsappNumber && <WhatsAppFloatingButton phoneNumber={whatsappNumber} />}
            {/* ARIA live region for dynamic announcements */}
            <div id="aria-announcer" role="status" aria-live="polite" className="sr-only" />
          </AiChatProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
