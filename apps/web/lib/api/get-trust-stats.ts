/**
 * Fetches trust statistics for social proof display.
 * These stats build credibility on the homepage.
 */

export interface TrustStats {
  happyTravelers: number
  uniqueTours: number
  averageRating: number
  yearsExperience: number
  totalReviews: number
  licensedGuides: number
}

// Default stats - can be updated from CMS or analytics
const defaultStats: TrustStats = {
  happyTravelers: 5000,
  uniqueTours: 25,
  averageRating: 4.9,
  yearsExperience: 15,
  totalReviews: 735,
  licensedGuides: 8,
}

/**
 * Get trust statistics for homepage display.
 * In production, these could be computed from actual booking/review data.
 * @returns Trust statistics object
 */
export async function getTrustStats(): Promise<TrustStats> {
  // TODO: In production, compute from actual data:
  // - happyTravelers: COUNT of completed bookings
  // - uniqueTours: COUNT of published tours
  // - averageRating: AVG of review ratings
  // - totalReviews: COUNT of reviews
  // - licensedGuides: COUNT of active guides

  return defaultStats
}

/**
 * Format statistics for display with appropriate suffixes.
 * @param stats - Raw trust statistics
 * @returns Formatted stats for UI
 */
export function formatTrustStats(stats: TrustStats) {
  return [
    {
      label: 'Happy Travelers',
      value: stats.happyTravelers,
      suffix: '+',
      icon: 'users',
    },
    {
      label: 'Unique Tours',
      value: stats.uniqueTours,
      suffix: '+',
      icon: 'map-pin',
    },
    {
      label: 'Average Rating',
      value: stats.averageRating,
      suffix: '',
      icon: 'star',
    },
    {
      label: 'Years Experience',
      value: stats.yearsExperience,
      suffix: '+',
      icon: 'calendar',
    },
  ]
}
