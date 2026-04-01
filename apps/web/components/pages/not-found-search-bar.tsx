'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface NotFoundSearchBarProps {
  placeholder: string
}

export function NotFoundSearchBar({ placeholder }: NotFoundSearchBarProps) {
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      router.push(`/tours?q=${encodeURIComponent(trimmed)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full md:w-[420px]">
      <div className="flex items-center gap-2.5 bg-white rounded-full h-12 px-4 border border-gray-200 shadow-sm">
        <Search className="w-[18px] h-[18px] text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-[var(--color-text-light)] outline-none"
        />
      </div>
    </form>
  )
}
