# Phase 05: Domain-Specific LLM

## Context Links

- [Phase 01 - Semantic Search](./phase-01-semantic-search-foundation.md) - Embeddings infrastructure
- [Phase 02 - AI Content Generation](./phase-02-ai-content-generation.md) - LLM integration
- [Vercel AI SDK RAG](https://sdk.vercel.ai/docs/guides/rag-chatbot)
- [Anthropic Claude](https://docs.anthropic.com/claude/docs)
- [Current Find Tour Page](../../apps/web/app/[locale]/(frontend)/find-tour/page.tsx)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P3 - Medium | pending | 20-24h |

Replace generic BubblaV chatbot with domain-specific AI assistant powered by RAG (Retrieval Augmented Generation). The assistant will have deep knowledge of Swedish heritage, tours across Sweden, and local expertise - answering questions accurately and recommending tours contextually.

## Key Insights

1. **RAG over fine-tuning**: Cheaper, updatable, no training required
2. **Knowledge sources**: Tour data, historical facts, FAQs, guide expertise
3. **Context window**: Claude 3.5 Sonnet has 200K tokens - can include extensive context
4. **Streaming**: Essential for good UX in chat interfaces
5. **Guardrails**: Prevent off-topic responses, hallucinations about tours

## Requirements

### Functional

- Answer Swedish heritage questions accurately
- Recommend tours based on conversation context
- Handle booking inquiries (link to booking flow)
- Multi-language support (SV/EN/DE)
- Remember conversation context within session
- Suggest follow-up questions
- Handle "I don't know" gracefully

### Non-Functional

- Response time <3s for first token
- Streaming for smooth UX
- Context retrieval <500ms
- 95%+ factual accuracy on tour info
- Fallback to human support option
- Cost tracking per conversation

## Architecture

### RAG Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Question                                │
│              "What's the best tour for history lovers?"         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Query Processing                               │
│  1. Detect language (auto)                                      │
│  2. Extract intent (tour_recommendation, history_question, etc) │
│  3. Identify entities (dates, locations, preferences)           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Context Retrieval                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Tour Embeddings│  │  FAQ Embeddings │  │Knowledge Base   │  │
│  │  (pgvector)     │  │  (pgvector)     │  │  (pgvector)     │  │
│  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘  │
│           │                    │                    │           │
│           └────────────────────┼────────────────────┘           │
│                                │                                 │
│                    Top-K relevant chunks                         │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Prompt Construction                            │
│  System: You are HeritageGuide AI, expert on Sweden...          │
│  Context: [Retrieved tour data, FAQs, knowledge]                │
│  Conversation: [Previous messages]                               │
│  User: What's the best tour for history lovers?                 │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Claude 3.5 Sonnet                              │
│  - Generate response with citations                              │
│  - Include tour recommendations with links                       │
│  - Stream response tokens                                        │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Response Processing                            │
│  - Parse tour mentions → add booking links                      │
│  - Add follow-up suggestions                                     │
│  - Track conversation for analytics                              │
└─────────────────────────────────────────────────────────────────┘
```

### Knowledge Base Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                    Knowledge Sources                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. TOURS (Primary)                                             │
│     - Title, description, highlights                            │
│     - Price, duration, logistics                                │
│     - Guide information                                          │
│     - Categories, audience tags                                  │
│     Source: Payload CMS (real-time)                             │
│                                                                  │
│  2. FAQS                                                        │
│     - Common questions and answers                              │
│     - Booking policies                                          │
│     - Cancellation rules                                        │
│     Source: Payload CMS Pages collection                        │
│                                                                  │
│  3. STOCKHOLM KNOWLEDGE                                         │
│     - Historical facts                                          │
│     - Landmark information                                      │
│     - Cultural context                                          │
│     Source: Curated markdown files                              │
│                                                                  │
│  4. GUIDE EXPERTISE                                             │
│     - Guide bios and specialties                                │
│     - Certifications                                            │
│     Source: Payload CMS Guides collection                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Related Code Files

### Create

| File | Purpose |
|------|---------|
| `apps/web/lib/ai/chatbot/heritage-assistant.ts` | Main assistant logic |
| `apps/web/lib/ai/chatbot/knowledge-retriever.ts` | RAG retrieval |
| `apps/web/lib/ai/chatbot/prompt-templates.ts` | System prompts |
| `apps/web/lib/ai/chatbot/intent-classifier.ts` | Query intent detection |
| `apps/web/lib/ai/chatbot/response-processor.ts` | Post-process responses |
| `apps/web/app/api/chat/route.ts` | Chat API endpoint |
| `apps/web/components/chatbot/heritage-chatbot.tsx` | Chat UI component |
| `apps/web/components/chatbot/chat-message.tsx` | Message component |
| `apps/web/components/chatbot/tour-recommendation-card.tsx` | Inline tour card |
| `packages/cms/collections/knowledge-base.ts` | Knowledge articles |
| `packages/cms/migrations/add-knowledge-embeddings.ts` | KB embeddings table |

### Modify

| File | Change |
|------|--------|
| `apps/web/app/[locale]/(frontend)/find-tour/page.tsx` | Replace BubblaV |
| `packages/cms/payload.config.ts` | Add knowledge-base collection |
| `.env.example` | Ensure ANTHROPIC_API_KEY present |

## Implementation Steps

### Step 1: Create Knowledge Retriever

```typescript
// apps/web/lib/ai/chatbot/knowledge-retriever.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateEmbedding } from '../embeddings-service'

export interface RetrievedContext {
  type: 'tour' | 'faq' | 'knowledge' | 'guide'
  content: string
  metadata: Record<string, unknown>
  similarity: number
}

interface RetrievalOptions {
  query: string
  locale?: string
  limit?: number
  types?: ('tour' | 'faq' | 'knowledge' | 'guide')[]
  minSimilarity?: number
}

/**
 * Retrieve relevant context from all knowledge sources
 */
export async function retrieveContext(
  options: RetrievalOptions
): Promise<RetrievedContext[]> {
  const {
    query,
    locale = 'en',
    limit = 10,
    types = ['tour', 'faq', 'knowledge', 'guide'],
    minSimilarity = 0.5,
  } = options

  const queryEmbedding = await generateEmbedding(query)
  const embeddingString = `[${queryEmbedding.join(',')}]`

  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const results: RetrievedContext[] = []

  // Retrieve from tours
  if (types.includes('tour')) {
    const tourResults = await db.execute(sql`
      SELECT
        'tour' as type,
        t.id,
        t.title,
        t.short_description,
        t.slug,
        t.pricing_base_price as price,
        t.duration_hours as duration,
        1 - (te.embedding <=> ${embeddingString}::vector) as similarity
      FROM tour_embeddings te
      JOIN tours t ON te.tour_id = t.id
      WHERE te.locale = ${locale}
        AND t.status = 'published'
        AND 1 - (te.embedding <=> ${embeddingString}::vector) > ${minSimilarity}
      ORDER BY similarity DESC
      LIMIT ${Math.ceil(limit / 2)}
    `)

    for (const row of tourResults.rows as any[]) {
      results.push({
        type: 'tour',
        content: `Tour: ${row.title}\n${row.short_description}\nPrice: ${row.price} SEK, Duration: ${row.duration}h`,
        metadata: {
          id: row.id,
          slug: row.slug,
          title: row.title,
          price: row.price,
          duration: row.duration,
        },
        similarity: parseFloat(row.similarity),
      })
    }
  }

  // Retrieve from FAQs
  if (types.includes('faq')) {
    const faqResults = await db.execute(sql`
      SELECT
        'faq' as type,
        f.question,
        f.answer,
        1 - (fe.embedding <=> ${embeddingString}::vector) as similarity
      FROM faq_embeddings fe
      JOIN faqs f ON fe.faq_id = f.id
      WHERE fe.locale = ${locale}
        AND 1 - (fe.embedding <=> ${embeddingString}::vector) > ${minSimilarity}
      ORDER BY similarity DESC
      LIMIT ${Math.ceil(limit / 4)}
    `)

    for (const row of faqResults.rows as any[]) {
      results.push({
        type: 'faq',
        content: `Q: ${row.question}\nA: ${row.answer}`,
        metadata: { question: row.question },
        similarity: parseFloat(row.similarity),
      })
    }
  }

  // Retrieve from knowledge base
  if (types.includes('knowledge')) {
    const kbResults = await db.execute(sql`
      SELECT
        'knowledge' as type,
        kb.title,
        kb.content,
        kb.category,
        1 - (ke.embedding <=> ${embeddingString}::vector) as similarity
      FROM knowledge_embeddings ke
      JOIN knowledge_base kb ON ke.knowledge_id = kb.id
      WHERE ke.locale = ${locale}
        AND 1 - (ke.embedding <=> ${embeddingString}::vector) > ${minSimilarity}
      ORDER BY similarity DESC
      LIMIT ${Math.ceil(limit / 4)}
    `)

    for (const row of kbResults.rows as any[]) {
      results.push({
        type: 'knowledge',
        content: `${row.title}\n${row.content}`,
        metadata: { title: row.title, category: row.category },
        similarity: parseFloat(row.similarity),
      })
    }
  }

  // Sort by similarity and return top results
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit)
}

/**
 * Format retrieved context for prompt inclusion
 */
export function formatContextForPrompt(contexts: RetrievedContext[]): string {
  const sections: Record<string, string[]> = {
    tour: [],
    faq: [],
    knowledge: [],
    guide: [],
  }

  for (const ctx of contexts) {
    sections[ctx.type].push(ctx.content)
  }

  let formatted = ''

  if (sections.tour.length > 0) {
    formatted += '## Available Tours\n' + sections.tour.join('\n\n') + '\n\n'
  }

  if (sections.faq.length > 0) {
    formatted += '## Frequently Asked Questions\n' + sections.faq.join('\n\n') + '\n\n'
  }

  if (sections.knowledge.length > 0) {
    formatted += '## Swedish Heritage Knowledge\n' + sections.knowledge.join('\n\n') + '\n\n'
  }

  return formatted.trim()
}
```

### Step 2: Create Prompt Templates

```typescript
// apps/web/lib/ai/chatbot/prompt-templates.ts

export const SYSTEM_PROMPT = `You are HeritageGuide AI, a knowledgeable and friendly assistant for HeritageGuiding, a premium heritage tour company in Sweden.

## Your Role
- Help visitors discover Sweden's rich history and heritage
- Recommend tours based on their interests and preferences
- Answer questions about Swedish landmarks, history, and culture
- Assist with booking inquiries and practical questions

## Your Personality
- Expert but approachable - share knowledge enthusiastically
- Warm and welcoming - make visitors feel excited about Sweden
- Concise but thorough - answer questions completely without rambling
- Honest - if you don't know something, say so and suggest alternatives

## Guidelines
1. ALWAYS base tour recommendations on the provided context
2. NEVER invent tours, prices, or details not in the context
3. When recommending tours, include: title, brief description, price, duration
4. Format tour recommendations with the tour slug for linking: [Tour Title](/tours/slug)
5. If asked about availability or booking, direct to the tour page or suggest contacting support
6. For questions outside your knowledge, acknowledge limits and offer to help differently
7. Respond in the same language the user writes in (Swedish, English, or German)

## Response Format
- Keep responses concise (2-4 paragraphs max for recommendations)
- Use bullet points for multiple options
- End with a follow-up question or suggestion when appropriate
- Include relevant tour links when recommending

## Off-Topic Handling
If asked about topics unrelated to Sweden, heritage, or tourism:
- Politely redirect: "I specialize in Swedish heritage and tours. I'd be happy to help you discover..."
- Never engage with harmful, illegal, or inappropriate requests`

export const TOUR_RECOMMENDATION_PROMPT = `Based on the user's interests, recommend 2-3 relevant tours from the provided context.

For each tour, include:
- Tour name (linked)
- Why it matches their interests
- Key highlights
- Price and duration

If no tours match well, suggest the closest alternatives and explain why.`

export const HISTORY_QUESTION_PROMPT = `Answer the user's question about Swedish history or heritage using the provided knowledge.

Guidelines:
- Be accurate and cite sources when possible
- Connect historical facts to tours when relevant
- If the question is outside your knowledge, acknowledge and suggest tours that cover the topic`

export function buildPrompt(
  systemPrompt: string,
  context: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[],
  userMessage: string
): { system: string; messages: { role: 'user' | 'assistant'; content: string }[] } {
  const systemWithContext = `${systemPrompt}

## Current Knowledge Context
${context}

---
Answer based ONLY on the context above. If the information isn't in the context, say you don't have that specific information.`

  return {
    system: systemWithContext,
    messages: [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ],
  }
}
```

### Step 3: Create Heritage Assistant

```typescript
// apps/web/lib/ai/chatbot/heritage-assistant.ts
import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { retrieveContext, formatContextForPrompt, RetrievedContext } from './knowledge-retriever'
import { SYSTEM_PROMPT, buildPrompt } from './prompt-templates'
import { classifyIntent, Intent } from './intent-classifier'

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  tourRecommendations?: TourRecommendation[]
}

export interface TourRecommendation {
  id: number
  slug: string
  title: string
  price: number
  duration: number
}

export interface ChatOptions {
  locale?: string
  sessionId?: string
}

/**
 * Process user message and generate streaming response
 */
export async function chat(
  userMessage: string,
  conversationHistory: ChatMessage[],
  options: ChatOptions = {}
): Promise<{
  stream: ReadableStream
  contexts: RetrievedContext[]
}> {
  const { locale = 'en' } = options

  // Classify intent to optimize retrieval
  const intent = await classifyIntent(userMessage)

  // Retrieve relevant context
  const contexts = await retrieveContext({
    query: userMessage,
    locale,
    limit: getRetrievalLimit(intent),
    types: getRetrievalTypes(intent),
    minSimilarity: 0.4,
  })

  const formattedContext = formatContextForPrompt(contexts)

  // Build prompt with context
  const { system, messages } = buildPrompt(
    SYSTEM_PROMPT,
    formattedContext,
    conversationHistory.map((m) => ({ role: m.role, content: m.content })),
    userMessage
  )

  // Generate streaming response
  const result = await streamText({
    model: anthropic('claude-3-5-sonnet-20241022'),
    system,
    messages,
    maxTokens: 1000,
    temperature: 0.7,
  })

  return {
    stream: result.toAIStream(),
    contexts,
  }
}

function getRetrievalLimit(intent: Intent): number {
  switch (intent) {
    case 'tour_recommendation':
      return 8
    case 'booking_inquiry':
      return 4
    case 'history_question':
      return 6
    case 'faq':
      return 4
    default:
      return 6
  }
}

function getRetrievalTypes(intent: Intent): ('tour' | 'faq' | 'knowledge' | 'guide')[] {
  switch (intent) {
    case 'tour_recommendation':
      return ['tour', 'guide']
    case 'booking_inquiry':
      return ['tour', 'faq']
    case 'history_question':
      return ['knowledge', 'tour']
    case 'faq':
      return ['faq']
    default:
      return ['tour', 'faq', 'knowledge']
  }
}

/**
 * Extract tour recommendations from assistant response
 */
export function extractTourRecommendations(
  response: string,
  contexts: RetrievedContext[]
): TourRecommendation[] {
  const recommendations: TourRecommendation[] = []
  const tourContexts = contexts.filter((c) => c.type === 'tour')

  // Find tour mentions in response
  for (const ctx of tourContexts) {
    const title = ctx.metadata.title as string
    if (response.toLowerCase().includes(title.toLowerCase())) {
      recommendations.push({
        id: ctx.metadata.id as number,
        slug: ctx.metadata.slug as string,
        title,
        price: ctx.metadata.price as number,
        duration: ctx.metadata.duration as number,
      })
    }
  }

  return recommendations.slice(0, 3)
}
```

### Step 4: Create Intent Classifier

```typescript
// apps/web/lib/ai/chatbot/intent-classifier.ts

export type Intent =
  | 'tour_recommendation'
  | 'booking_inquiry'
  | 'history_question'
  | 'faq'
  | 'greeting'
  | 'general'

const INTENT_PATTERNS: Record<Intent, RegExp[]> = {
  tour_recommendation: [
    /recommend|suggest|best tour|which tour|what tour|looking for/i,
    /tour for|tours about|interested in/i,
    /family|kids|children|couples|romantic|history|architecture/i,
  ],
  booking_inquiry: [
    /book|booking|reserve|availability|available|price|cost|how much/i,
    /cancel|refund|reschedule|change booking/i,
    /payment|pay|credit card/i,
  ],
  history_question: [
    /history|historical|when was|who was|what happened/i,
    /old town|gamla stan|royal palace|vasa|nobel/i,
    /viking|medieval|17th century|18th century/i,
  ],
  faq: [
    /how do i|what is|where is|can i|do you/i,
    /policy|policies|rules|requirements/i,
    /wheelchair|accessible|disability/i,
  ],
  greeting: [
    /^(hi|hello|hey|good morning|good afternoon|hej|hallo)/i,
    /^(thanks|thank you|tack)/i,
  ],
  general: [],
}

/**
 * Classify user message intent for optimized retrieval
 */
export async function classifyIntent(message: string): Promise<Intent> {
  const normalizedMessage = message.toLowerCase().trim()

  // Check each intent pattern
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(normalizedMessage)) {
        return intent as Intent
      }
    }
  }

  return 'general'
}

/**
 * Extract entities from message (dates, locations, preferences)
 */
export function extractEntities(message: string): {
  dates?: string[]
  locations?: string[]
  preferences?: string[]
} {
  const entities: ReturnType<typeof extractEntities> = {}

  // Date patterns
  const dateMatches = message.match(
    /\b(today|tomorrow|next week|this weekend|\d{1,2}[\/\-]\d{1,2}|\w+ \d{1,2})\b/gi
  )
  if (dateMatches) entities.dates = dateMatches

  // Location patterns
  const locationPatterns = [
    'gamla stan', 'old town', 'djurgården', 'södermalm', 'norrmalm',
    'kungsholmen', 'city center', 'royal palace', 'city hall',
  ]
  const locations = locationPatterns.filter((loc) =>
    message.toLowerCase().includes(loc)
  )
  if (locations.length > 0) entities.locations = locations

  // Preference patterns
  const preferencePatterns = [
    'family', 'kids', 'children', 'romantic', 'couples', 'history',
    'architecture', 'food', 'outdoor', 'walking', 'boat', 'private',
  ]
  const preferences = preferencePatterns.filter((pref) =>
    message.toLowerCase().includes(pref)
  )
  if (preferences.length > 0) entities.preferences = preferences

  return entities
}
```

### Step 5: Create Chat API Endpoint

```typescript
// apps/web/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { chat, extractTourRecommendations, ChatMessage } from '@/lib/ai/chatbot/heritage-assistant'
import { cookies } from 'next/headers'
import { trackServerEvent } from '@/lib/analytics/posthog-server'

// Rate limiting
const sessionMessages = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 20 // messages per session per hour
const RATE_WINDOW = 3600000 // 1 hour

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now()
  const session = sessionMessages.get(sessionId)

  if (!session || now > session.resetAt) {
    sessionMessages.set(sessionId, { count: 1, resetAt: now + RATE_WINDOW })
    return true
  }

  if (session.count >= RATE_LIMIT) {
    return false
  }

  session.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, history = [], locale = 'en' } = body as {
      message: string
      history: ChatMessage[]
      locale: string
    }

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // Get or create session ID
    const cookieStore = await cookies()
    const sessionId = cookieStore.get('chat_session_id')?.value || crypto.randomUUID()

    // Rate limiting
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { error: 'Too many messages. Please try again later.' },
        { status: 429 }
      )
    }

    // Track event
    trackServerEvent(sessionId, 'chatbot_message_sent', {
      message_length: message.length,
      history_length: history.length,
      locale,
    })

    // Generate response
    const { stream, contexts } = await chat(message, history, { locale, sessionId })

    // Return streaming response
    const response = new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Chat-Session': sessionId,
      },
    })

    // Set session cookie if new
    if (!cookieStore.get('chat_session_id')) {
      response.headers.set(
        'Set-Cookie',
        `chat_session_id=${sessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
      )
    }

    return response
  } catch (error) {
    console.error('[Chat API]', error)
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    )
  }
}
```

### Step 6: Create Chatbot UI Component

```typescript
// apps/web/components/chatbot/heritage-chatbot.tsx
'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Send, Loader2, Bot, User, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatMessage } from './chat-message'
import { TourRecommendationCard } from './tour-recommendation-card'

interface Message {
  role: 'user' | 'assistant'
  content: string
  tourRecommendations?: any[]
}

export function HeritageChatbot() {
  const t = useTranslations('chatbot')
  const locale = useLocale()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: t('welcome'),
        },
      ])
    }
  }, [t, messages.length])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage,
          history: messages.slice(-10), // Last 10 messages for context
          locale,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      // Stream the response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ''

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }])

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          assistantMessage += chunk

          setMessages((prev) => {
            const newMessages = [...prev]
            newMessages[newMessages.length - 1] = {
              role: 'assistant',
              content: assistantMessage,
            }
            return newMessages
          })
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: t('error'),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    setMessages([{ role: 'assistant', content: t('welcome') }])
  }

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-[var(--color-primary)]" />
          <span className="font-medium">{t('title')}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-[var(--color-text-muted)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">{t('thinking')}</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-[var(--color-border)] p-4"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('placeholder')}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-[var(--color-border)] px-4 py-2 focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            maxLength={1000}
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">
          {t('disclaimer')}
        </p>
      </form>
    </div>
  )
}
```

### Step 7: Create Knowledge Base Collection

```typescript
// packages/cms/collections/knowledge-base.ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

export const KnowledgeBase: CollectionConfig = {
  slug: 'knowledge-base',
  admin: {
    useAsTitle: 'title',
    group: 'AI',
    description: 'Knowledge articles for AI chatbot',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      localized: true,
      admin: {
        description: 'Knowledge content for AI retrieval',
      },
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      options: [
        { label: 'Swedish History', value: 'history' },
        { label: 'Landmarks', value: 'landmarks' },
        { label: 'Culture', value: 'culture' },
        { label: 'Practical Info', value: 'practical' },
        { label: 'Booking Policies', value: 'policies' },
      ],
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Higher priority = more likely to be retrieved',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'published',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
      ],
      admin: { position: 'sidebar' },
    },
  ],
}
```

### Step 8: Update Find Tour Page

```typescript
// apps/web/app/[locale]/(frontend)/find-tour/page.tsx
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { HeritageChatbot } from '@/components/chatbot/heritage-chatbot'
import { isFeatureEnabled, FLAGS } from '@/lib/personalization/feature-flags'

interface FindTourPageProps {
  params: Promise<{ locale: string }>
}

export async function generateMetadata({ params }: FindTourPageProps): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'findTour' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function FindTourPage({ params }: FindTourPageProps) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'findTour' })

  // Feature flag to toggle between BubblaV and new chatbot
  const useNewChatbot = await isFeatureEnabled(FLAGS.AI_CHATBOT_ENABLED)

  return (
    <>
      <Header variant="solid" />
      <main className="flex min-h-screen flex-col bg-[var(--color-background)] pt-[var(--header-height)]">
        {/* Page Header */}
        <div className="border-b border-[var(--color-border)] bg-white px-4 py-6 lg:px-8">
          <div className="container mx-auto">
            <h1 className="font-serif text-2xl font-bold text-[var(--color-text)] md:text-3xl">
              {t('heading')}
            </h1>
            <p className="mt-2 text-[var(--color-text-muted)]">{t('subheading')}</p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1" style={{ minHeight: 'calc(100vh - var(--header-height) - 120px)' }}>
          {useNewChatbot ? (
            <HeritageChatbot />
          ) : (
            // Legacy BubblaV (fallback)
            <>
              <div id="bubblav-ai-page" className="h-full w-full" />
              <script
                src="https://www.bubblav.com/ai-page.js"
                data-site-id="ff276627-8ae7-42ab-a9e5-7ebd38613a98"
                async
              />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
```

## Todo List

- [ ] Create knowledge-retriever.ts
- [ ] Create prompt-templates.ts
- [ ] Create heritage-assistant.ts
- [ ] Create intent-classifier.ts
- [ ] Create /api/chat endpoint
- [ ] Create heritage-chatbot.tsx component
- [ ] Create chat-message.tsx component
- [ ] Create tour-recommendation-card.tsx
- [ ] Create knowledge-base collection in CMS
- [ ] Create migration for knowledge embeddings table
- [ ] Add knowledge embedding hook
- [ ] Seed initial Swedish heritage knowledge (20-30 articles)
- [ ] Add FAQ embeddings
- [ ] Create feature flag for gradual rollout
- [ ] Add chatbot translations (SV/EN/DE)
- [ ] Test RAG retrieval quality
- [ ] Test streaming performance
- [ ] Add conversation analytics
- [ ] Create fallback for API errors

## Success Criteria

- [ ] Chatbot answers tour questions accurately (>95%)
- [ ] Response time <3s for first token
- [ ] Multi-language support working
- [ ] Tour recommendations include valid links
- [ ] Graceful handling of off-topic questions
- [ ] Rate limiting prevents abuse
- [ ] Session context maintained

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Hallucinated tour info | Medium | High | RAG with verified sources only |
| Slow responses | Medium | Medium | Optimize retrieval, caching |
| Off-topic abuse | Low | Medium | Intent classification, guardrails |
| Cost overruns | Low | Medium | Rate limiting, usage monitoring |
| Privacy concerns | Low | High | No PII storage, session isolation |

## Security Considerations

1. **Input Validation**: Sanitize user messages, length limits
2. **Rate Limiting**: Per-session and global limits
3. **No PII Storage**: Don't persist conversation content
4. **Guardrails**: System prompt prevents harmful outputs
5. **Audit Logging**: Track usage without storing content

## Next Steps

After Phase 05 completion:
1. **Continuous Improvement**: Monitor and improve prompts
2. **Knowledge Expansion**: Add more Swedish heritage content
3. **Voice Interface**: Consider voice input/output
4. **Proactive Suggestions**: Chatbot initiates based on behavior

---

**Unresolved Questions:**

1. Should we persist conversation history for returning users?
2. Voice interface for accessibility?
3. Handoff to human support integration?
4. Multi-turn booking flow in chat?
