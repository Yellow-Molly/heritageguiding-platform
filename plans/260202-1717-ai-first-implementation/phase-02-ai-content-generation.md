# Phase 02: AI Content Generation

## Context Links

- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Anthropic Claude API](https://docs.anthropic.com/claude/reference)
- [Phase 01 - Semantic Search](./phase-01-semantic-search-foundation.md)
- [Tours Collection](../../packages/cms/collections/tours.ts)
- [Design Guidelines](../../docs/design-guidelines.md)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P2 - High | pending | 12-16h |

Enable AI-powered content generation for tour descriptions, SEO metadata, and marketing copy. Reduce manual content creation time by 60% while maintaining brand voice and SEO optimization.

## Key Insights

1. **Claude 3.5 Sonnet**: Best for creative writing + following brand guidelines
2. **Vercel AI SDK**: Streaming responses, React hooks, edge-compatible
3. **Structured outputs**: Use JSON mode for SEO metadata generation
4. **Brand consistency**: System prompts with style guides and examples
5. **Human-in-loop**: AI drafts, editors approve/refine

## Requirements

### Functional

- Generate tour descriptions from bullet points/highlights
- Create SEO meta titles and descriptions
- Generate localized content (EN/SV/DE)
- Suggest tour highlights from description
- Create social media copy (Instagram, Facebook)
- Draft email newsletter content

### Non-Functional

- Generation time <10s for descriptions
- Maintain brand voice (premium, expert, welcoming)
- SEO-optimized output (keyword density, length)
- Cost tracking per generation
- Rate limiting (10 generations/minute/user)
- Content moderation (no inappropriate output)

## Architecture

### Content Generation Flow

```
CMS Editor clicks "Generate with AI"
        |
        v
Modal opens with input fields
        |
        v
/api/ai/generate-content
        |
        v
Build prompt with:
- System prompt (brand voice)
- Tour data (highlights, category)
- Generation type (description/SEO/social)
- Target locale
        |
        v
Anthropic Claude API (streaming)
        |
        v
Stream response to editor
        |
        v
Editor reviews/edits
        |
        v
Save to CMS field
```

### Component Diagram

```
┌──────────────────────────────────────────────────┐
│  Payload CMS Admin UI                            │
│  ┌────────────────────────────────────────────┐  │
│  │  Tour Edit Form                            │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  Description Field                   │  │  │
│  │  │  [✨ Generate with AI]               │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  │  ┌──────────────────────────────────────┐  │  │
│  │  │  SEO Fields                          │  │  │
│  │  │  [✨ Generate SEO]                   │  │  │
│  │  └──────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
              │
              v
┌──────────────────────────────────────────────────┐
│  AI Generation Modal                             │
│  ┌────────────────────────────────────────────┐  │
│  │  Input: Key points, tone, length           │  │
│  │  Output: Streaming AI response             │  │
│  │  Actions: [Use This] [Regenerate] [Cancel] │  │
│  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────┘
              │
              v
┌──────────────────────────────────────────────────┐
│  /api/ai/generate-content                        │
│  - Rate limiting                                 │
│  - Prompt construction                           │
│  - Claude API call (streaming)                   │
│  - Usage logging                                 │
└──────────────────────────────────────────────────┘
```

## Related Code Files

### Create

| File | Purpose |
|------|---------|
| `apps/web/lib/ai/content-generation-service.ts` | Core generation logic |
| `apps/web/lib/ai/prompts/tour-description-prompt.ts` | Description system prompt |
| `apps/web/lib/ai/prompts/seo-metadata-prompt.ts` | SEO generation prompt |
| `apps/web/lib/ai/prompts/social-media-prompt.ts` | Social copy prompt |
| `apps/web/app/api/ai/generate-content/route.ts` | Generation API endpoint |
| `packages/cms/components/ai-generation-modal.tsx` | Admin UI modal |
| `packages/cms/components/ai-generate-button.tsx` | Trigger button component |

### Modify

| File | Change |
|------|--------|
| `packages/cms/collections/tours.ts` | Add AI generate buttons to fields |
| `packages/cms/payload.config.ts` | Register custom components |
| `.env.example` | Add ANTHROPIC_API_KEY |

## Implementation Steps

### Step 1: Create Content Generation Service

```typescript
// apps/web/lib/ai/content-generation-service.ts
import Anthropic from '@anthropic-ai/sdk'
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export type ContentType = 'description' | 'seo' | 'social' | 'highlights' | 'email'
export type Locale = 'en' | 'sv' | 'de'
export type Tone = 'professional' | 'friendly' | 'luxurious' | 'adventurous'

export interface GenerationInput {
  type: ContentType
  tourData: {
    title: string
    highlights?: string[]
    categories?: string[]
    duration?: number
    price?: number
    location?: string
  }
  locale: Locale
  tone?: Tone
  additionalContext?: string
}

export interface GenerationResult {
  content: string
  tokens: { input: number; output: number }
  cost: number
}

const COST_PER_1K_INPUT = 0.003  // Claude 3.5 Sonnet
const COST_PER_1K_OUTPUT = 0.015

/**
 * Generate content using Claude with streaming
 */
export async function generateContent(
  input: GenerationInput
): Promise<ReadableStream> {
  const systemPrompt = getSystemPrompt(input.type, input.locale, input.tone)
  const userPrompt = buildUserPrompt(input)

  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system: systemPrompt,
    prompt: userPrompt,
    maxTokens: getMaxTokens(input.type),
    temperature: 0.7,
  })

  return result.toAIStream()
}

/**
 * Generate content without streaming (for batch operations)
 */
export async function generateContentSync(
  input: GenerationInput
): Promise<GenerationResult> {
  const systemPrompt = getSystemPrompt(input.type, input.locale, input.tone)
  const userPrompt = buildUserPrompt(input)

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: getMaxTokens(input.type),
    temperature: 0.7,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const content = response.content[0].type === 'text'
    ? response.content[0].text
    : ''

  const tokens = {
    input: response.usage.input_tokens,
    output: response.usage.output_tokens,
  }

  return {
    content,
    tokens,
    cost: (tokens.input / 1000) * COST_PER_1K_INPUT +
          (tokens.output / 1000) * COST_PER_1K_OUTPUT,
  }
}

function getMaxTokens(type: ContentType): number {
  switch (type) {
    case 'description': return 1000
    case 'seo': return 300
    case 'social': return 400
    case 'highlights': return 500
    case 'email': return 1500
    default: return 500
  }
}
```

### Step 2: Create System Prompts

```typescript
// apps/web/lib/ai/prompts/tour-description-prompt.ts

export const BRAND_VOICE = `
HeritageGuiding Brand Voice:
- Premium but approachable
- Expert and knowledgeable
- Warm and welcoming
- Passionate about Swedish heritage and history
- Focus on authentic experiences
- Avoid clichés and generic tourism language
`

export function getTourDescriptionPrompt(locale: string, tone: string = 'professional'): string {
  const localeInstructions = {
    en: 'Write in fluent, natural English.',
    sv: 'Skriv på flytande, naturlig svenska. Use Swedish conventions.',
    de: 'Schreiben Sie in fließendem, natürlichem Deutsch.',
  }

  return `${BRAND_VOICE}

You are a content writer for HeritageGuiding, a premium heritage tour company in Sweden.

Your task: Write a compelling tour description that:
1. Opens with an engaging hook
2. Highlights unique aspects of the experience
3. Includes sensory details (sights, sounds, atmosphere)
4. Mentions what guests will learn
5. Ends with a call-to-action feel

Tone: ${tone}
${localeInstructions[locale as keyof typeof localeInstructions]}

Format: 2-3 paragraphs, 150-250 words total.
Do NOT include the tour title or price in the description.
Do NOT use phrases like "Join us" or "Book now" - save that for CTAs.`
}

// apps/web/lib/ai/prompts/seo-metadata-prompt.ts
export function getSEOPrompt(locale: string): string {
  return `You are an SEO specialist for HeritageGuiding, a premium tour company in Sweden.

Generate SEO metadata for a tour page. Output as JSON:

{
  "metaTitle": "Max 60 characters, include primary keyword and location",
  "metaDescription": "Max 155 characters, compelling, include CTA verb",
  "keywords": ["5-8 relevant keywords"]
}

Language: ${locale === 'sv' ? 'Swedish' : locale === 'de' ? 'German' : 'English'}
Include location "Sweden" or specific city in title.
Make it compelling for search results click-through.`
}

// apps/web/lib/ai/prompts/social-media-prompt.ts
export function getSocialMediaPrompt(locale: string, platform: 'instagram' | 'facebook'): string {
  const platformGuide = {
    instagram: 'Max 2200 chars, use emojis sparingly, include 5-10 relevant hashtags at end',
    facebook: 'Max 500 chars for optimal engagement, can be more conversational',
  }

  return `You are a social media manager for HeritageGuiding Sweden.

Create a ${platform} post about this tour.
${platformGuide[platform]}

Language: ${locale === 'sv' ? 'Swedish' : locale === 'de' ? 'German' : 'English'}
Tone: Engaging, inspiring wanderlust, premium feel
Include a question or CTA to boost engagement.`
}
```

### Step 3: Create Prompt Builder

```typescript
// apps/web/lib/ai/prompts/prompt-builder.ts
import { getTourDescriptionPrompt } from './tour-description-prompt'
import { getSEOPrompt } from './seo-metadata-prompt'
import { getSocialMediaPrompt } from './social-media-prompt'
import type { GenerationInput, ContentType, Locale, Tone } from '../content-generation-service'

export function getSystemPrompt(type: ContentType, locale: Locale, tone?: Tone): string {
  switch (type) {
    case 'description':
      return getTourDescriptionPrompt(locale, tone || 'professional')
    case 'seo':
      return getSEOPrompt(locale)
    case 'social':
      return getSocialMediaPrompt(locale, 'instagram')
    case 'highlights':
      return getHighlightsPrompt(locale)
    case 'email':
      return getEmailPrompt(locale)
    default:
      return getTourDescriptionPrompt(locale, tone || 'professional')
  }
}

export function buildUserPrompt(input: GenerationInput): string {
  const { tourData, additionalContext } = input

  let prompt = `Tour: ${tourData.title}\n`

  if (tourData.categories?.length) {
    prompt += `Categories: ${tourData.categories.join(', ')}\n`
  }

  if (tourData.highlights?.length) {
    prompt += `Key highlights:\n${tourData.highlights.map(h => `- ${h}`).join('\n')}\n`
  }

  if (tourData.duration) {
    prompt += `Duration: ${tourData.duration} hours\n`
  }

  if (tourData.location) {
    prompt += `Location: ${tourData.location}\n`
  }

  if (additionalContext) {
    prompt += `\nAdditional context: ${additionalContext}`
  }

  return prompt
}

function getHighlightsPrompt(locale: string): string {
  return `Generate 5-7 tour highlights based on the description.
Each highlight should be:
- Concise (5-10 words)
- Start with action verb or compelling noun
- Focus on unique/memorable aspects

Language: ${locale === 'sv' ? 'Swedish' : locale === 'de' ? 'German' : 'English'}
Output as JSON array: ["highlight1", "highlight2", ...]`
}

function getEmailPrompt(locale: string): string {
  return `Write a promotional email for this tour.
Include:
- Compelling subject line
- Brief intro paragraph
- 3 key selling points as bullet points
- Clear CTA

Language: ${locale === 'sv' ? 'Swedish' : locale === 'de' ? 'German' : 'English'}
Tone: Professional, warm, creates urgency without being pushy`
}
```

### Step 4: Create API Endpoint

```typescript
// apps/web/app/api/ai/generate-content/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateContent, GenerationInput } from '@/lib/ai/content-generation-service'
import { getServerSession } from 'next-auth' // or your auth method

// Rate limiting (simple in-memory, use Redis in production)
const rateLimits = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 10 // requests per minute
const RATE_WINDOW = 60000 // 1 minute

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userLimit = rateLimits.get(userId)

  if (!userLimit || now > userLimit.resetAt) {
    rateLimits.set(userId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false
  }

  userLimit.count++
  return true
}

export async function POST(request: NextRequest) {
  // Auth check - only admin users
  const session = await getServerSession()
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Rate limiting
  if (!checkRateLimit(session.user.email)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again in 1 minute.' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()

    // Validate input
    const input: GenerationInput = {
      type: body.type,
      tourData: body.tourData,
      locale: body.locale || 'en',
      tone: body.tone,
      additionalContext: body.additionalContext,
    }

    if (!input.type || !input.tourData?.title) {
      return NextResponse.json(
        { error: 'Missing required fields: type, tourData.title' },
        { status: 400 }
      )
    }

    // Generate with streaming
    const stream = await generateContent(input)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('[AI Generate]', error)
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    )
  }
}
```

### Step 5: Create Admin UI Components

```typescript
// packages/cms/components/ai-generate-button.tsx
'use client'

import { useState } from 'react'
import { Button } from '@payloadcms/ui'
import { Sparkles } from 'lucide-react'
import { AIGenerationModal } from './ai-generation-modal'

interface AIGenerateButtonProps {
  fieldName: string
  contentType: 'description' | 'seo' | 'highlights'
  tourData: {
    title: string
    highlights?: string[]
    categories?: string[]
  }
  locale: string
  onGenerated: (content: string) => void
}

export function AIGenerateButton({
  fieldName,
  contentType,
  tourData,
  locale,
  onGenerated,
}: AIGenerateButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        buttonStyle="secondary"
        size="small"
        onClick={() => setIsOpen(true)}
        icon={<Sparkles className="h-4 w-4" />}
      >
        Generate with AI
      </Button>

      {isOpen && (
        <AIGenerationModal
          contentType={contentType}
          tourData={tourData}
          locale={locale}
          onClose={() => setIsOpen(false)}
          onUseContent={(content) => {
            onGenerated(content)
            setIsOpen(false)
          }}
        />
      )}
    </>
  )
}
```

```typescript
// packages/cms/components/ai-generation-modal.tsx
'use client'

import { useState, useEffect } from 'react'
import { Modal, Button, TextareaInput } from '@payloadcms/ui'

interface AIGenerationModalProps {
  contentType: 'description' | 'seo' | 'highlights'
  tourData: { title: string; highlights?: string[]; categories?: string[] }
  locale: string
  onClose: () => void
  onUseContent: (content: string) => void
}

export function AIGenerationModal({
  contentType,
  tourData,
  locale,
  onClose,
  onUseContent,
}: AIGenerationModalProps) {
  const [generating, setGenerating] = useState(false)
  const [content, setContent] = useState('')
  const [additionalContext, setAdditionalContext] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    setGenerating(true)
    setError(null)
    setContent('')

    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: contentType,
          tourData,
          locale,
          additionalContext,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Generation failed')
      }

      // Stream the response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value)
          setContent((prev) => prev + chunk)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Modal slug="ai-generation" onClose={onClose}>
      <div className="p-6 space-y-4">
        <h2 className="text-xl font-semibold">Generate {contentType}</h2>
        <p className="text-sm text-gray-600">
          Tour: {tourData.title}
        </p>

        <TextareaInput
          path="additionalContext"
          name="additionalContext"
          label="Additional context (optional)"
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          placeholder="Any specific points to include..."
        />

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded">
            {error}
          </div>
        )}

        {content && (
          <div className="p-4 bg-gray-50 rounded max-h-64 overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm">{content}</pre>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <Button buttonStyle="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            buttonStyle="secondary"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate'}
          </Button>
          {content && (
            <Button
              buttonStyle="primary"
              onClick={() => onUseContent(content)}
            >
              Use This
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
```

### Step 6: Environment Variables

```bash
# .env.example additions
# Anthropic API (for content generation)
ANTHROPIC_API_KEY=sk-ant-...

# AI Configuration
AI_RATE_LIMIT_PER_MINUTE=10
AI_MAX_TOKENS_DESCRIPTION=1000
AI_MAX_TOKENS_SEO=300
```

## Todo List

- [ ] Create content-generation-service.ts
- [ ] Create tour-description-prompt.ts
- [ ] Create seo-metadata-prompt.ts
- [ ] Create social-media-prompt.ts
- [ ] Create prompt-builder.ts
- [ ] Create /api/ai/generate-content endpoint
- [ ] Create ai-generate-button.tsx component
- [ ] Create ai-generation-modal.tsx component
- [ ] Register components in Payload config
- [ ] Add ANTHROPIC_API_KEY to environment
- [ ] Implement rate limiting with Redis (production)
- [ ] Add usage logging/analytics
- [ ] Test streaming in admin UI
- [ ] Test multi-locale generation
- [ ] Add content moderation check

## Success Criteria

- [ ] AI generates descriptions in <10s
- [ ] SEO metadata follows best practices
- [ ] Multi-locale content quality verified
- [ ] Rate limiting prevents abuse
- [ ] Streaming works in admin modal
- [ ] 60% reduction in content creation time
- [ ] Brand voice consistency maintained

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Poor content quality | Medium | High | Human review required, iterative prompts |
| API costs spike | Medium | Medium | Rate limiting, usage monitoring |
| Hallucinated facts | Medium | High | Editor review, fact-check system prompt |
| Brand voice drift | Low | Medium | Detailed style guide in prompts |
| Streaming failures | Low | Medium | Fallback to non-streaming |

## Security Considerations

1. **API Key Protection**: ANTHROPIC_API_KEY server-only
2. **Auth Required**: Only admin users can generate
3. **Rate Limiting**: Prevent abuse and cost overruns
4. **Content Moderation**: Consider adding safety checks
5. **No PII in Prompts**: Don't include customer data

## Next Steps

After Phase 02 completion:
1. **Phase 03**: Use generated content for recommendations
2. **Batch Generation**: Generate for all existing tours
3. **Quality Metrics**: Track acceptance rate of AI content
4. **A/B Testing**: Test AI vs human content performance

---

**Unresolved Questions:**

1. Should we add content moderation API (Anthropic/OpenAI)?
2. Track cost per generation for budgeting?
3. Allow tone selection per generation?
4. Save generation history for comparison?
