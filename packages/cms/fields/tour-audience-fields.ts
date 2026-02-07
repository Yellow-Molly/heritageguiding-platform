import type { Field } from 'payload'

/**
 * Target audience tags for Concierge Wizard filtering
 * Multi-select to categorize tours by audience type
 */
export const audienceTagsField: Field = {
  name: 'targetAudience',
  type: 'select',
  hasMany: true,
  label: 'Target Audience (Concierge Wizard)',
  admin: {
    description: 'Select all applicable audience types',
  },
  options: [
    { label: 'Family Friendly', value: 'family_friendly' },
    { label: 'Couples', value: 'couples' },
    { label: 'Corporate', value: 'corporate' },
    { label: 'Seniors', value: 'seniors' },
    { label: 'History Nerds', value: 'history_nerds' },
    { label: 'Photography', value: 'photography' },
    { label: 'Art Lovers', value: 'art_lovers' },
    { label: 'Food & Wine', value: 'food_wine' },
    { label: 'Adventure Seekers', value: 'adventure' },
    { label: 'Architecture Enthusiasts', value: 'architecture' },
    { label: 'Solo Travelers', value: 'solo_travelers' },
  ],
}

/**
 * Difficulty level and age recommendation fields
 */
export const tourDifficultyFields: Field[] = [
  {
    name: 'difficultyLevel',
    type: 'select',
    options: [
      { label: 'Easy (Mostly flat, minimal walking)', value: 'easy' },
      { label: 'Moderate (Some hills, 2-4km walking)', value: 'moderate' },
      { label: 'Challenging (Stairs, 5km+ walking)', value: 'challenging' },
    ],
  },
  {
    name: 'ageRecommendation',
    type: 'group',
    label: 'Age Recommendation',
    fields: [
      {
        name: 'minimumAge',
        type: 'number',
        min: 0,
        admin: {
          description: 'Minimum recommended age',
        },
      },
      {
        name: 'childFriendly',
        type: 'checkbox',
        defaultValue: false,
      },
      {
        name: 'teenFriendly',
        type: 'checkbox',
        defaultValue: false,
      },
    ],
  },
]
