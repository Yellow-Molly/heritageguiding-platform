/**
 * Payload collection hooks that invalidate Next.js `unstable_cache` tags
 * whenever a document changes or is deleted.
 *
 * Without these hooks, admin edits update the database but the front-site
 * API responses (get-featured-tours, get-tour-by-slug, get-guides, ...)
 * keep serving stale data until a manual POST to /api/revalidate or a
 * redeploy.
 *
 * `revalidateTag` requires a Next.js request context. Admin saves run
 * inside a Next.js route handler, so the call succeeds there. When
 * Payload is invoked from CLI scripts (seeders, imports) there is no
 * request context — we swallow the error so the script keeps running.
 */
import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import { revalidateTag } from 'next/cache'

/**
 * Safely call revalidateTag — errors outside a request context are logged
 * and swallowed so CLI scripts don't fail.
 */
function safeRevalidate(tag: string, collectionSlug: string): void {
  try {
    // Next.js 16 requires a cache-life profile as the second arg. Passing
    // `{ expire: 0 }` is the only documented way to get the old behavior —
    // immediate hard invalidation of both data cache and route cache.
    // Named profiles like 'max' have very long TTLs and only trigger
    // stale-while-revalidate, so the front site would keep serving stale
    // data until a background refresh completes.
    revalidateTag(tag, { expire: 0 })
  } catch (err) {
    // Outside Next.js request context (e.g. CLI import scripts).
    // Log at debug level; a manual POST /api/revalidate is the fallback.
    console.warn(
      `[revalidate-cache-tags] Could not revalidate tag "${tag}" for collection "${collectionSlug}":`,
      err instanceof Error ? err.message : err
    )
  }
}

/**
 * Factory for an afterChange hook that revalidates the given cache tags.
 * Use in a Payload CollectionConfig:
 *   hooks: { afterChange: [createRevalidateTagsAfterChangeHook(['tours'])] }
 */
export function createRevalidateTagsAfterChangeHook(
  tags: readonly string[]
): CollectionAfterChangeHook {
  return async ({ collection }) => {
    for (const tag of tags) safeRevalidate(tag, collection.slug)
  }
}

/**
 * Factory for an afterDelete hook that revalidates the given cache tags.
 */
export function createRevalidateTagsAfterDeleteHook(
  tags: readonly string[]
): CollectionAfterDeleteHook {
  return async ({ collection }) => {
    for (const tag of tags) safeRevalidate(tag, collection.slug)
  }
}
