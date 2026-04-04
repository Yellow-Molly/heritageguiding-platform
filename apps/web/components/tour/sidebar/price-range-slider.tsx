'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { formatPrice } from '@/lib/utils'

interface PriceRangeSliderProps {
  min: number
  max: number
  currentMin: number
  currentMax: number
  onChange: (min: number, max: number) => void
}

/**
 * Dual-thumb price range slider.
 * Uses two native range inputs overlaid with custom styling.
 * Debounces onChange by 300ms to avoid excessive URL updates.
 */
export function PriceRangeSlider({
  min,
  max,
  currentMin,
  currentMax,
  onChange,
}: PriceRangeSliderProps) {
  const [localMin, setLocalMin] = useState(currentMin)
  const [localMax, setLocalMax] = useState(currentMax)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync local state when URL params change externally
  useEffect(() => {
    setLocalMin(currentMin)
    setLocalMax(currentMax)
  }, [currentMin, currentMax])

  const debouncedOnChange = useCallback(
    (newMin: number, newMax: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onChange(newMin, newMax), 300)
    },
    [onChange]
  )

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.min(Number(e.target.value), localMax - 50)
      setLocalMin(val)
      debouncedOnChange(val, localMax)
    },
    [localMax, debouncedOnChange]
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.max(Number(e.target.value), localMin + 50)
      setLocalMax(val)
      debouncedOnChange(localMin, val)
    },
    [localMin, debouncedOnChange]
  )

  const range = max - min
  const leftPercent = ((localMin - min) / range) * 100
  const rightPercent = ((localMax - min) / range) * 100

  const t = useTranslations('tours.filters')

  return (
    <div>
      <h3 className="text-sm font-bold text-[var(--color-primary)] mb-3">
        {t('priceRange')}
      </h3>

      {/* Min/Max labels */}
      <div className="flex items-center justify-between mb-4 text-sm text-[var(--color-text)]">
        <span>{formatPrice(localMin)}</span>
        <span>{formatPrice(localMax)}</span>
      </div>

      {/* Slider track + thumbs */}
      <div className="relative h-2">
        {/* Background track */}
        <div className="absolute inset-0 rounded-full bg-[var(--color-border)]" />

        {/* Active range highlight */}
        <div
          className="absolute top-0 bottom-0 rounded-full bg-[var(--color-primary)]"
          style={{ left: `${leftPercent}%`, right: `${100 - rightPercent}%` }}
        />

        {/* Min thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={50}
          value={localMin}
          onChange={handleMinChange}
          className="price-range-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: localMin > max - 100 ? 5 : 3 }}
          aria-label="Minimum price"
        />

        {/* Max thumb */}
        <input
          type="range"
          min={min}
          max={max}
          step={50}
          value={localMax}
          onChange={handleMaxChange}
          className="price-range-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
          style={{ zIndex: 4 }}
          aria-label="Maximum price"
        />
      </div>
    </div>
  )
}
