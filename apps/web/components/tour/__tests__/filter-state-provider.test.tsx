import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useSyncExternalStore } from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { FilterStateProvider, useFilterState } from '../filter-state-provider'

// Reactive search-param store — when router.push/replace fires, currentSearch
// updates and listeners re-render. Lets tests observe optimistic state through
// to its post-resolution snapshot under jsdom.
const mockPush = vi.fn()
const mockReplace = vi.fn()
let currentSearch = ''
const listeners = new Set<() => void>()
function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}
function notify() {
  for (const l of listeners) l()
}
function setSearchFromUrl(url: string) {
  const idx = url.indexOf('?')
  currentSearch = idx >= 0 ? url.slice(idx + 1) : ''
  notify()
}

vi.mock('next/navigation', () => ({
  useSearchParams: () => {
    useSyncExternalStore(subscribe, () => currentSearch, () => currentSearch)
    return {
      get: (key: string) => new URLSearchParams(currentSearch).get(key),
      toString: () => currentSearch,
    }
  },
  useRouter: () => ({
    push: (url: string, opts?: unknown) => {
      mockPush(url, opts)
      setSearchFromUrl(url)
    },
    replace: (url: string, opts?: unknown) => {
      mockReplace(url, opts)
      setSearchFromUrl(url)
    },
  }),
  usePathname: () => '/en/tours',
}))

/** Probe component that exposes provider state to the test. */
function Probe() {
  const { params, isPending, setParam, toggleListItem, clearAll } = useFilterState()
  return (
    <div>
      <span data-testid="params">{params.toString()}</span>
      <span data-testid="pending">{isPending ? '1' : '0'}</span>
      <button onClick={() => setParam('q', 'hello')}>set-q</button>
      <button onClick={() => setParam('q', 'hello', { replace: true })}>replace-q</button>
      <button onClick={() => toggleListItem('categories', 'history')}>toggle-history</button>
      <button onClick={() => clearAll()}>clear</button>
    </div>
  )
}

describe('FilterStateProvider', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockReplace.mockClear()
    currentSearch = ''
  })

  it('throws if useFilterState used outside provider', () => {
    function Bad() {
      useFilterState()
      return null
    }
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Bad />)).toThrow(/within a <FilterStateProvider>/)
    spy.mockRestore()
  })

  it('setParam pushes URL with reset page param', () => {
    currentSearch = 'page=3'
    render(
      <FilterStateProvider>
        <Probe />
      </FilterStateProvider>,
    )

    act(() => {
      fireEvent.click(screen.getByText('set-q'))
    })

    expect(mockPush).toHaveBeenCalledWith('/en/tours?q=hello', { scroll: false })
    // Optimistic-resolved end state visible to consumers
    expect(screen.getByTestId('params').textContent).toBe('q=hello')
  })

  it('setParam with replace:true uses router.replace, not push', () => {
    render(
      <FilterStateProvider>
        <Probe />
      </FilterStateProvider>,
    )

    act(() => {
      fireEvent.click(screen.getByText('replace-q'))
    })

    expect(mockReplace).toHaveBeenCalledWith('/en/tours?q=hello', { scroll: false })
    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.getByTestId('params').textContent).toBe('q=hello')
  })

  it('toggleListItem adds slug to comma list', () => {
    currentSearch = 'categories=architecture'
    render(
      <FilterStateProvider>
        <Probe />
      </FilterStateProvider>,
    )

    act(() => {
      fireEvent.click(screen.getByText('toggle-history'))
    })

    expect(mockPush).toHaveBeenCalledWith(
      '/en/tours?categories=architecture%2Chistory',
      { scroll: false },
    )
    expect(screen.getByTestId('params').textContent).toBe('categories=architecture%2Chistory')
  })

  it('toggleListItem removes slug already present', () => {
    currentSearch = 'categories=history,architecture'
    render(
      <FilterStateProvider>
        <Probe />
      </FilterStateProvider>,
    )

    act(() => {
      fireEvent.click(screen.getByText('toggle-history'))
    })

    expect(mockPush).toHaveBeenCalledWith('/en/tours?categories=architecture', { scroll: false })
    expect(screen.getByTestId('params').textContent).toBe('categories=architecture')
  })

  it('toggleListItem removes key when last slug deleted', () => {
    currentSearch = 'categories=history'
    render(
      <FilterStateProvider>
        <Probe />
      </FilterStateProvider>,
    )

    act(() => {
      fireEvent.click(screen.getByText('toggle-history'))
    })

    expect(mockPush).toHaveBeenCalledWith('/en/tours', { scroll: false })
    expect(screen.getByTestId('params').textContent).toBe('')
  })

  it('clearAll pushes bare pathname', () => {
    currentSearch = 'categories=history&q=foo'
    render(
      <FilterStateProvider>
        <Probe />
      </FilterStateProvider>,
    )

    act(() => {
      fireEvent.click(screen.getByText('clear'))
    })

    expect(mockPush).toHaveBeenCalledWith('/en/tours', { scroll: false })
    expect(screen.getByTestId('params').textContent).toBe('')
  })
})
