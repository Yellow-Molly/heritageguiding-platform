'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useOptimistic,
  useTransition,
  type ReactNode,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { sanitizeSlug } from '@/lib/utils'

interface FilterCommitOptions {
  /** Use router.replace (no history entry) instead of router.push. */
  replace?: boolean
}

interface FilterStateValue {
  /**
   * Current optimistic URL search params.
   * Treat as readonly: clone (`new URLSearchParams(params.toString())`) before mutating.
   * Mutating the shared instance affects every consumer of this context.
   */
  params: URLSearchParams
  /** True while a router transition is pending — drives grid pending overlay. */
  isPending: boolean
  /** Set or delete a single param. Pass null/empty to delete. Resets `page`. */
  setParam: (key: string, value: string | null, opts?: FilterCommitOptions) => void
  /** Toggle a slug in a comma-delimited list under `key` (e.g. categories=foo,bar). Resets `page`. */
  toggleListItem: (key: string, slug: string, opts?: FilterCommitOptions) => void
  /** Remove all params (router push to bare pathname). */
  clearAll: (opts?: FilterCommitOptions) => void
}

const FilterStateContext = createContext<FilterStateValue | null>(null)

/**
 * Owns optimistic URL state + router transition for listing filter pages.
 *
 * Consumers call `useFilterState()` instead of duplicating
 * `useSearchParams + useRouter + usePathname + useTransition` blocks.
 *
 * - `useOptimistic` over `searchParams.toString()` → instant chip flip on click
 * - `useTransition` wraps `router.push`/`replace` → server resolves, React reverts
 *   automatically if the optimistic value diverges from the resolved server state
 */
export function FilterStateProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const serverStr = searchParams.toString()

  const [optimisticStr, setOptimistic] = useOptimistic(serverStr)
  const [isPending, startTransition] = useTransition()

  const commit = useCallback(
    (next: URLSearchParams, replace?: boolean) => {
      const str = next.toString()
      startTransition(() => {
        setOptimistic(str)
        const url = str ? `${pathname}?${str}` : pathname
        if (replace) {
          router.replace(url, { scroll: false })
        } else {
          router.push(url, { scroll: false })
        }
      })
    },
    [pathname, router, setOptimistic],
  )

  const setParam = useCallback<FilterStateValue['setParam']>(
    (key, value, opts) => {
      const next = new URLSearchParams(optimisticStr)
      if (value) next.set(key, value)
      else next.delete(key)
      // Filter changes always reset pagination
      next.delete('page')
      commit(next, opts?.replace)
    },
    [commit, optimisticStr],
  )

  const toggleListItem = useCallback<FilterStateValue['toggleListItem']>(
    (key, slug, opts) => {
      const sanitized = sanitizeSlug(slug)
      if (!sanitized) return
      const next = new URLSearchParams(optimisticStr)
      const list = next.get(key)?.split(',').filter(Boolean) ?? []
      const idx = list.indexOf(sanitized)
      if (idx >= 0) list.splice(idx, 1)
      else list.push(sanitized)
      if (list.length) next.set(key, list.join(','))
      else next.delete(key)
      next.delete('page')
      commit(next, opts?.replace)
    },
    [commit, optimisticStr],
  )

  const clearAll = useCallback<FilterStateValue['clearAll']>(
    (opts) => {
      commit(new URLSearchParams(), opts?.replace)
    },
    [commit],
  )

  const params = useMemo(() => new URLSearchParams(optimisticStr), [optimisticStr])

  const value = useMemo<FilterStateValue>(
    () => ({ params, isPending, setParam, toggleListItem, clearAll }),
    [params, isPending, setParam, toggleListItem, clearAll],
  )

  return <FilterStateContext.Provider value={value}>{children}</FilterStateContext.Provider>
}

export function useFilterState(): FilterStateValue {
  const ctx = useContext(FilterStateContext)
  if (!ctx) {
    throw new Error('useFilterState must be used within a <FilterStateProvider>')
  }
  return ctx
}
