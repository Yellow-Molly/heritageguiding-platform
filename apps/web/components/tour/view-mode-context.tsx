'use client'

import { createContext } from 'react'

/**
 * Context for sharing viewMode ('grid' | 'list') between
 * TourCatalogClient (provider) and TourGridLayout (consumer).
 */
export const ViewModeContext = createContext<'grid' | 'list'>('grid')
