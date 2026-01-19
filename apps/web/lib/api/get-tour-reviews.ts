/**
 * Fetches tour reviews from CMS.
 * In production, this will query Payload CMS. Currently uses mock data.
 */

export interface TourReview {
  id: string
  tourId: string
  authorName: string
  authorCountry?: string
  rating: number
  text: string
  date: string
  verified: boolean
}

// Mock reviews data
const mockReviews: Record<string, TourReview[]> = {
  'gamla-stan-walking': [
    {
      id: 'review-1',
      tourId: 'gamla-stan-walking',
      authorName: 'Sarah M.',
      authorCountry: 'United States',
      rating: 5,
      text: 'Erik was an incredible guide! His knowledge of medieval Stockholm is impressive, and he made the history come alive with his storytelling. The hidden courtyards were a highlight - places we never would have found on our own.',
      date: '2026-01-10',
      verified: true,
    },
    {
      id: 'review-2',
      tourId: 'gamla-stan-walking',
      authorName: 'Thomas K.',
      authorCountry: 'Germany',
      rating: 5,
      text: 'Perfect introduction to Stockholm! The pace was comfortable, and Erik answered all our questions with patience and depth. Highly recommend for anyone visiting for the first time.',
      date: '2026-01-05',
      verified: true,
    },
    {
      id: 'review-3',
      tourId: 'gamla-stan-walking',
      authorName: 'Emma L.',
      authorCountry: 'United Kingdom',
      rating: 4,
      text: 'Great tour with lots of interesting facts. Would have loved a bit more time at Stortorget, but overall excellent experience. Erik is clearly passionate about his city.',
      date: '2025-12-28',
      verified: true,
    },
    {
      id: 'review-4',
      tourId: 'gamla-stan-walking',
      authorName: 'Marco B.',
      authorCountry: 'Italy',
      rating: 5,
      text: 'One of the best walking tours I have ever taken. Erik speaks perfect English and his historical knowledge is extraordinary. The small group size made it feel personal.',
      date: '2025-12-20',
      verified: true,
    },
  ],
  'royal-palace': [
    {
      id: 'review-5',
      tourId: 'royal-palace',
      authorName: 'Jennifer W.',
      authorCountry: 'Canada',
      rating: 5,
      text: 'Anna is exceptional! Her insider knowledge of the palace is unmatched. We saw areas and heard stories that you simply cannot experience on a regular visit. Worth every penny.',
      date: '2026-01-08',
      verified: true,
    },
    {
      id: 'review-6',
      tourId: 'royal-palace',
      authorName: 'Hans S.',
      authorCountry: 'Austria',
      rating: 4,
      text: 'Very informative tour with skip-the-line access that saved us lots of time. Anna was professional and engaging. Only wish it was a bit longer to see more rooms.',
      date: '2025-12-30',
      verified: true,
    },
    {
      id: 'review-7',
      tourId: 'royal-palace',
      authorName: 'Lisa N.',
      authorCountry: 'Sweden',
      rating: 5,
      text: 'Even as a Swede, I learned so much! Anna shared stories about the royal family that I had never heard before. A must for anyone interested in Swedish history.',
      date: '2025-12-15',
      verified: true,
    },
  ],
  'vasa-museum': [
    {
      id: 'review-8',
      tourId: 'vasa-museum',
      authorName: 'David C.',
      authorCountry: 'Australia',
      rating: 5,
      text: 'Mind-blowing! The Vasa ship is incredible in person, and Magnus made the experience even better. He explained the technical details in a way that was fascinating even for non-experts.',
      date: '2026-01-12',
      verified: true,
    },
    {
      id: 'review-9',
      tourId: 'vasa-museum',
      authorName: 'Marie F.',
      authorCountry: 'France',
      rating: 5,
      text: 'Absolutely worth it for the skip-the-line access alone. Magnus is a walking encyclopedia of naval history. Our whole family was engaged, including the kids!',
      date: '2026-01-03',
      verified: true,
    },
    {
      id: 'review-10',
      tourId: 'vasa-museum',
      authorName: 'Peter J.',
      authorCountry: 'Netherlands',
      rating: 4,
      text: 'Great tour with lots of details about the ship and 17th century life. The museum itself is spectacular. Magnus was very knowledgeable and accommodating.',
      date: '2025-12-22',
      verified: true,
    },
    {
      id: 'review-11',
      tourId: 'vasa-museum',
      authorName: 'Yuki T.',
      authorCountry: 'Japan',
      rating: 5,
      text: 'Incredible experience! The ship is magnificent and Magnus brought the whole story to life. Highly recommend taking the guided tour rather than exploring alone.',
      date: '2025-12-10',
      verified: true,
    },
  ],
}

/**
 * Get reviews for a specific tour.
 * @param tourId - The tour ID
 * @param limit - Maximum number of reviews to return
 * @returns Array of verified tour reviews
 */
export async function getTourReviews(
  tourId: string,
  limit: number = 10
): Promise<TourReview[]> {
  // TODO: Replace with Payload CMS query when CMS is configured
  // const payload = await getPayload({ config })
  // const { docs } = await payload.find({
  //   collection: 'reviews',
  //   where: {
  //     tour: { equals: tourId },
  //     verified: { equals: true }
  //   },
  //   sort: '-date',
  //   limit
  // })
  // return docs as TourReview[]

  // For now, return mock data
  const reviews = mockReviews[tourId] || []
  return reviews.slice(0, limit)
}

/**
 * Calculate aggregate rating for a tour's reviews.
 * @param reviews - Array of reviews
 * @returns Average rating or 0 if no reviews
 */
export function calculateAverageRating(reviews: TourReview[]): number {
  if (reviews.length === 0) return 0
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
  return sum / reviews.length
}
