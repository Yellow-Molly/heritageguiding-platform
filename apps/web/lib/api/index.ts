/**
 * API data fetching functions for HeritageGuiding.
 * These functions provide data from CMS or mock sources for development.
 */

export { getFeaturedTours, type FeaturedTour } from './get-featured-tours'
export { getCategories, getAllCategories, type Category, type CategoryType } from './get-categories'
export { getTrustStats, formatTrustStats, type TrustStats } from './get-trust-stats'
export { getTours, getTourCategories, type TourFilters, type ToursResponse } from './get-tours'
export { getTourBySlug, getAllTourSlugs, type TourDetail } from './get-tour-by-slug'
export { getTourReviews, calculateAverageRating, type TourReview } from './get-tour-reviews'
export { getRelatedTours } from './get-related-tours'
