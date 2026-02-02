# Phase 07: Knowledge Graph

## Context Links

- [Phase 01 - Semantic Search](./phase-01-semantic-search-foundation.md) - Embeddings infrastructure
- [Phase 03 - Recommendation Engine](./phase-03-recommendation-engine.md) - Recommendation patterns
- [Phase 05 - Domain-Specific LLM](./phase-05-domain-specific-llm.md) - Knowledge retrieval
- [Tours Collection](../../packages/cms/collections/tours.ts)
- [Guides Collection](../../packages/cms/collections/guides.ts)
- [Neo4j Graph Database](https://neo4j.com/docs/)
- [PostgreSQL JSONB Patterns](https://www.postgresql.org/docs/current/datatype-json.html)

## Overview

| Priority | Status | Effort |
|----------|--------|--------|
| P3 - Medium | pending | 16-20h |

Build a knowledge graph connecting guides, tours, places, historical events, and categories. Enable complex relationship queries for advanced recommendations and provide admin visualization of entity connections.

## Key Insights

1. **PostgreSQL JSONB first**: Start with JSONB for simplicity, migrate to Neo4j if needed
2. **Relationship types**: guides↔tours, tours↔places, places↔events, events↔categories
3. **Bidirectional traversal**: Query from any entity type
4. **Admin value**: Visualize connections to identify content gaps
5. **RAG enhancement**: Graph queries provide richer context for LLM

## Requirements

### Functional

- Store entities: guides, tours, places, historical_events, categories
- Define relationships with properties (e.g., "led_by" with years of experience)
- Query by relationship depth (1-hop, 2-hop, n-hop)
- Visualize graph in CMS admin
- Suggest missing connections
- Support time-based queries (events by era)
- Export subgraphs for analysis

### Non-Functional

- Graph queries <500ms for 3-hop traversals
- Support 10K+ entities
- Incremental updates (no full rebuild)
- Backup/restore capabilities
- ACID compliance for updates
- Real-time sync with CMS changes

## Architecture

### Graph Data Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    Knowledge Graph Schema                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ENTITIES (Nodes)                                                │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐         │
│  │   GUIDE     │    │    TOUR     │    │   PLACE     │         │
│  │ - id        │    │ - id        │    │ - id        │         │
│  │ - name      │    │ - title     │    │ - name      │         │
│  │ - expertise │    │ - duration  │    │ - lat/lng   │         │
│  │ - languages │    │ - price     │    │ - type      │         │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘         │
│         │                  │                  │                 │
│         │    RELATIONSHIPS │                  │                 │
│         │    (Edges)       │                  │                 │
│         │                  │                  │                 │
│  ┌──────▼──────────────────▼──────────────────▼──────┐         │
│  │                                                    │         │
│  │  GUIDE -[LEADS]-> TOUR                            │         │
│  │    props: since_year, tour_count                  │         │
│  │                                                    │         │
│  │  TOUR -[VISITS]-> PLACE                           │         │
│  │    props: duration_minutes, order                 │         │
│  │                                                    │         │
│  │  PLACE -[WITNESSED]-> EVENT                       │         │
│  │    props: date, significance                      │         │
│  │                                                    │         │
│  │  EVENT -[BELONGS_TO]-> CATEGORY                   │         │
│  │    props: relevance_score                         │         │
│  │                                                    │         │
│  │  TOUR -[TAGGED_WITH]-> CATEGORY                   │         │
│  │    props: primary                                 │         │
│  │                                                    │         │
│  │  GUIDE -[SPECIALIZES_IN]-> CATEGORY               │         │
│  │    props: years_experience, certified             │         │
│  │                                                    │         │
│  └────────────────────────────────────────────────────┘         │
│                                                                  │
│  ┌─────────────┐    ┌─────────────┐                             │
│  │   EVENT     │    │  CATEGORY   │                             │
│  │ - id        │    │ - id        │                             │
│  │ - title     │    │ - name      │                             │
│  │ - date      │    │ - slug      │                             │
│  │ - era       │    │ - type      │                             │
│  └─────────────┘    └─────────────┘                             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Database Schema (PostgreSQL JSONB)

```sql
-- Graph nodes
CREATE TABLE graph_nodes (
  id SERIAL PRIMARY KEY,
  node_type TEXT NOT NULL,  -- 'guide', 'tour', 'place', 'event', 'category'
  entity_id INTEGER NOT NULL,  -- Reference to source table
  properties JSONB DEFAULT '{}',
  embedding vector(1536),  -- For semantic similarity
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(node_type, entity_id)
);

CREATE INDEX idx_nodes_type ON graph_nodes(node_type);
CREATE INDEX idx_nodes_properties ON graph_nodes USING GIN(properties);

-- Graph edges (relationships)
CREATE TABLE graph_edges (
  id SERIAL PRIMARY KEY,
  source_id INTEGER REFERENCES graph_nodes(id) ON DELETE CASCADE,
  target_id INTEGER REFERENCES graph_nodes(id) ON DELETE CASCADE,
  edge_type TEXT NOT NULL,  -- 'LEADS', 'VISITS', 'WITNESSED', etc.
  properties JSONB DEFAULT '{}',
  weight FLOAT DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(source_id, target_id, edge_type)
);

CREATE INDEX idx_edges_source ON graph_edges(source_id);
CREATE INDEX idx_edges_target ON graph_edges(target_id);
CREATE INDEX idx_edges_type ON graph_edges(edge_type);

-- Materialized view for fast traversals
CREATE MATERIALIZED VIEW graph_adjacency AS
SELECT
  source_id,
  edge_type,
  array_agg(target_id) as targets,
  array_agg(weight) as weights
FROM graph_edges
GROUP BY source_id, edge_type;

CREATE UNIQUE INDEX idx_adjacency ON graph_adjacency(source_id, edge_type);

-- Historical events (new collection)
CREATE TABLE historical_events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  title_sv TEXT,
  title_de TEXT,
  description TEXT,
  date_start DATE,
  date_end DATE,
  era TEXT,  -- 'viking', 'medieval', 'renaissance', 'modern'
  significance INTEGER DEFAULT 5,  -- 1-10 scale
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Related Code Files

### Create

| File | Purpose |
|------|---------|
| `apps/web/lib/knowledge-graph/graph-service.ts` | Core graph operations |
| `apps/web/lib/knowledge-graph/graph-queries.ts` | Query builders |
| `apps/web/lib/knowledge-graph/graph-sync.ts` | CMS sync hooks |
| `apps/web/lib/knowledge-graph/graph-visualizer.ts` | D3.js visualization data |
| `apps/web/app/api/graph/query/route.ts` | Graph query API |
| `apps/web/app/api/graph/visualize/route.ts` | Visualization API |
| `packages/cms/collections/historical-events.ts` | Events collection |
| `packages/cms/collections/places.ts` | Places collection |
| `packages/cms/components/graph-visualization.tsx` | Admin graph viewer |
| `packages/cms/migrations/add-graph-tables.ts` | Database migration |

### Modify

| File | Change |
|------|--------|
| `packages/cms/collections/tours.ts` | Add places relationship |
| `packages/cms/collections/guides.ts` | Add graph sync hook |
| `packages/cms/payload.config.ts` | Add new collections |
| `apps/web/lib/ai/chatbot/knowledge-retriever.ts` | Use graph for context |

## Implementation Steps

### Step 1: Create Graph Service

```typescript
// apps/web/lib/knowledge-graph/graph-service.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'

export type NodeType = 'guide' | 'tour' | 'place' | 'event' | 'category'
export type EdgeType = 'LEADS' | 'VISITS' | 'WITNESSED' | 'BELONGS_TO' | 'TAGGED_WITH' | 'SPECIALIZES_IN'

export interface GraphNode {
  id: number
  nodeType: NodeType
  entityId: number
  properties: Record<string, unknown>
}

export interface GraphEdge {
  id: number
  sourceId: number
  targetId: number
  edgeType: EdgeType
  properties: Record<string, unknown>
  weight: number
}

/**
 * Create or update a graph node
 */
export async function upsertNode(
  nodeType: NodeType,
  entityId: number,
  properties: Record<string, unknown> = {}
): Promise<GraphNode> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    INSERT INTO graph_nodes (node_type, entity_id, properties)
    VALUES (${nodeType}, ${entityId}, ${JSON.stringify(properties)}::jsonb)
    ON CONFLICT (node_type, entity_id)
    DO UPDATE SET
      properties = EXCLUDED.properties,
      updated_at = NOW()
    RETURNING *
  `)

  const row = result.rows[0] as any
  return {
    id: row.id,
    nodeType: row.node_type,
    entityId: row.entity_id,
    properties: row.properties,
  }
}

/**
 * Create or update a graph edge
 */
export async function upsertEdge(
  sourceNodeType: NodeType,
  sourceEntityId: number,
  targetNodeType: NodeType,
  targetEntityId: number,
  edgeType: EdgeType,
  properties: Record<string, unknown> = {},
  weight: number = 1.0
): Promise<GraphEdge> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Get node IDs
  const sourceNode = await getNodeByEntity(sourceNodeType, sourceEntityId)
  const targetNode = await getNodeByEntity(targetNodeType, targetEntityId)

  if (!sourceNode || !targetNode) {
    throw new Error('Source or target node not found')
  }

  const result = await db.execute(sql`
    INSERT INTO graph_edges (source_id, target_id, edge_type, properties, weight)
    VALUES (${sourceNode.id}, ${targetNode.id}, ${edgeType}, ${JSON.stringify(properties)}::jsonb, ${weight})
    ON CONFLICT (source_id, target_id, edge_type)
    DO UPDATE SET
      properties = EXCLUDED.properties,
      weight = EXCLUDED.weight
    RETURNING *
  `)

  const row = result.rows[0] as any
  return {
    id: row.id,
    sourceId: row.source_id,
    targetId: row.target_id,
    edgeType: row.edge_type,
    properties: row.properties,
    weight: row.weight,
  }
}

/**
 * Get node by entity reference
 */
export async function getNodeByEntity(
  nodeType: NodeType,
  entityId: number
): Promise<GraphNode | null> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    SELECT * FROM graph_nodes
    WHERE node_type = ${nodeType} AND entity_id = ${entityId}
    LIMIT 1
  `)

  if (result.rows.length === 0) return null

  const row = result.rows[0] as any
  return {
    id: row.id,
    nodeType: row.node_type,
    entityId: row.entity_id,
    properties: row.properties,
  }
}

/**
 * Delete node and all connected edges
 */
export async function deleteNode(
  nodeType: NodeType,
  entityId: number
): Promise<void> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  await db.execute(sql`
    DELETE FROM graph_nodes
    WHERE node_type = ${nodeType} AND entity_id = ${entityId}
  `)
}

/**
 * Refresh materialized view for fast traversals
 */
export async function refreshAdjacencyView(): Promise<void> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  await db.execute(sql`
    REFRESH MATERIALIZED VIEW CONCURRENTLY graph_adjacency
  `)
}
```

### Step 2: Create Graph Queries

```typescript
// apps/web/lib/knowledge-graph/graph-queries.ts
import { sql } from 'drizzle-orm'
import { getPayload } from 'payload'
import config from '@payload-config'
import { NodeType, EdgeType, GraphNode } from './graph-service'

export interface TraversalResult {
  path: GraphNode[]
  totalWeight: number
}

export interface SubgraphResult {
  nodes: GraphNode[]
  edges: { source: number; target: number; type: EdgeType; weight: number }[]
}

/**
 * Find connected nodes within N hops
 */
export async function findConnected(
  startNodeType: NodeType,
  startEntityId: number,
  options: {
    maxDepth?: number
    edgeTypes?: EdgeType[]
    targetNodeTypes?: NodeType[]
    limit?: number
  } = {}
): Promise<GraphNode[]> {
  const {
    maxDepth = 2,
    edgeTypes,
    targetNodeTypes,
    limit = 50,
  } = options

  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Recursive CTE for graph traversal
  const result = await db.execute(sql`
    WITH RECURSIVE connected AS (
      -- Base case: start node
      SELECT
        n.id,
        n.node_type,
        n.entity_id,
        n.properties,
        0 as depth,
        ARRAY[n.id] as path
      FROM graph_nodes n
      WHERE n.node_type = ${startNodeType}
        AND n.entity_id = ${startEntityId}

      UNION ALL

      -- Recursive case: traverse edges
      SELECT
        n2.id,
        n2.node_type,
        n2.entity_id,
        n2.properties,
        c.depth + 1,
        c.path || n2.id
      FROM connected c
      JOIN graph_edges e ON (e.source_id = c.id OR e.target_id = c.id)
      JOIN graph_nodes n2 ON (
        n2.id = CASE WHEN e.source_id = c.id THEN e.target_id ELSE e.source_id END
      )
      WHERE c.depth < ${maxDepth}
        AND NOT (n2.id = ANY(c.path))  -- Prevent cycles
        ${edgeTypes ? sql`AND e.edge_type = ANY(${edgeTypes})` : sql``}
    )
    SELECT DISTINCT ON (id)
      id, node_type, entity_id, properties, depth
    FROM connected
    WHERE depth > 0
      ${targetNodeTypes ? sql`AND node_type = ANY(${targetNodeTypes})` : sql``}
    ORDER BY id, depth
    LIMIT ${limit}
  `)

  return result.rows.map((row: any) => ({
    id: row.id,
    nodeType: row.node_type,
    entityId: row.entity_id,
    properties: row.properties,
  }))
}

/**
 * Get subgraph around a node for visualization
 */
export async function getSubgraph(
  centerNodeType: NodeType,
  centerEntityId: number,
  depth: number = 2
): Promise<SubgraphResult> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  // Get all nodes within depth
  const nodes = await findConnected(centerNodeType, centerEntityId, {
    maxDepth: depth,
    limit: 100,
  })

  // Add center node
  const centerResult = await db.execute(sql`
    SELECT * FROM graph_nodes
    WHERE node_type = ${centerNodeType} AND entity_id = ${centerEntityId}
  `)

  const allNodes = [
    ...centerResult.rows.map((row: any) => ({
      id: row.id,
      nodeType: row.node_type,
      entityId: row.entity_id,
      properties: row.properties,
    })),
    ...nodes,
  ]

  const nodeIds = allNodes.map((n) => n.id)

  // Get edges between these nodes
  const edgesResult = await db.execute(sql`
    SELECT source_id, target_id, edge_type, weight
    FROM graph_edges
    WHERE source_id = ANY(${nodeIds})
      AND target_id = ANY(${nodeIds})
  `)

  return {
    nodes: allNodes,
    edges: edgesResult.rows.map((row: any) => ({
      source: row.source_id,
      target: row.target_id,
      type: row.edge_type,
      weight: row.weight,
    })),
  }
}

/**
 * Find shortest path between two nodes
 */
export async function findShortestPath(
  startNodeType: NodeType,
  startEntityId: number,
  endNodeType: NodeType,
  endEntityId: number
): Promise<TraversalResult | null> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    WITH RECURSIVE paths AS (
      SELECT
        n.id,
        n.node_type,
        n.entity_id,
        n.properties,
        0 as depth,
        0.0 as total_weight,
        ARRAY[n.id] as path
      FROM graph_nodes n
      WHERE n.node_type = ${startNodeType}
        AND n.entity_id = ${startEntityId}

      UNION ALL

      SELECT
        n2.id,
        n2.node_type,
        n2.entity_id,
        n2.properties,
        p.depth + 1,
        p.total_weight + e.weight,
        p.path || n2.id
      FROM paths p
      JOIN graph_edges e ON (e.source_id = p.id OR e.target_id = p.id)
      JOIN graph_nodes n2 ON (
        n2.id = CASE WHEN e.source_id = p.id THEN e.target_id ELSE e.source_id END
      )
      WHERE p.depth < 6  -- Max depth
        AND NOT (n2.id = ANY(p.path))
    )
    SELECT path, total_weight
    FROM paths
    WHERE node_type = ${endNodeType}
      AND entity_id = ${endEntityId}
    ORDER BY depth, total_weight
    LIMIT 1
  `)

  if (result.rows.length === 0) return null

  const row = result.rows[0] as any

  // Fetch full node data for path
  const nodeIds = row.path
  const nodesResult = await db.execute(sql`
    SELECT * FROM graph_nodes WHERE id = ANY(${nodeIds})
    ORDER BY array_position(${nodeIds}, id)
  `)

  return {
    path: nodesResult.rows.map((r: any) => ({
      id: r.id,
      nodeType: r.node_type,
      entityId: r.entity_id,
      properties: r.properties,
    })),
    totalWeight: row.total_weight,
  }
}

/**
 * Find tours that cover specific historical events
 */
export async function findToursByEvents(
  eventIds: number[],
  minCoverage: number = 0.5
): Promise<{ tourId: number; coverage: number; events: number[] }[]> {
  const payload = await getPayload({ config })
  const db = payload.db.drizzle

  const result = await db.execute(sql`
    WITH tour_events AS (
      SELECT
        tn.entity_id as tour_id,
        array_agg(DISTINCT en.entity_id) as covered_events
      FROM graph_nodes tn
      JOIN graph_edges e1 ON e1.source_id = tn.id
      JOIN graph_nodes pn ON pn.id = e1.target_id AND pn.node_type = 'place'
      JOIN graph_edges e2 ON e2.source_id = pn.id
      JOIN graph_nodes en ON en.id = e2.target_id AND en.node_type = 'event'
      WHERE tn.node_type = 'tour'
        AND e1.edge_type = 'VISITS'
        AND e2.edge_type = 'WITNESSED'
        AND en.entity_id = ANY(${eventIds})
      GROUP BY tn.entity_id
    )
    SELECT
      tour_id,
      array_length(covered_events, 1)::float / ${eventIds.length} as coverage,
      covered_events
    FROM tour_events
    WHERE array_length(covered_events, 1)::float / ${eventIds.length} >= ${minCoverage}
    ORDER BY coverage DESC
  `)

  return result.rows.map((row: any) => ({
    tourId: row.tour_id,
    coverage: row.coverage,
    events: row.covered_events,
  }))
}
```

### Step 3: Create Graph Sync Hooks

```typescript
// apps/web/lib/knowledge-graph/graph-sync.ts
import { upsertNode, upsertEdge, deleteNode, NodeType, EdgeType } from './graph-service'

/**
 * Sync tour to graph after CMS update
 */
export async function syncTourToGraph(tourId: number, tourData: any): Promise<void> {
  // Create/update tour node
  await upsertNode('tour', tourId, {
    title: tourData.title,
    slug: tourData.slug,
    price: tourData.pricing?.basePrice,
    duration: tourData.durationHours,
  })

  // Sync guide relationship
  if (tourData.guide) {
    const guideId = typeof tourData.guide === 'number' ? tourData.guide : tourData.guide.id
    await upsertEdge('guide', guideId, 'tour', tourId, 'LEADS', {
      since: tourData.guideSince || new Date().getFullYear(),
    })
  }

  // Sync category relationships
  if (tourData.categories?.length > 0) {
    for (let i = 0; i < tourData.categories.length; i++) {
      const catId = typeof tourData.categories[i] === 'number'
        ? tourData.categories[i]
        : tourData.categories[i].id

      await upsertEdge('tour', tourId, 'category', catId, 'TAGGED_WITH', {
        primary: i === 0,
      })
    }
  }

  // Sync place relationships
  if (tourData.places?.length > 0) {
    for (let i = 0; i < tourData.places.length; i++) {
      const place = tourData.places[i]
      const placeId = typeof place === 'number' ? place : place.id

      await upsertEdge('tour', tourId, 'place', placeId, 'VISITS', {
        order: i + 1,
        durationMinutes: place.durationMinutes || 15,
      })
    }
  }
}

/**
 * Sync guide to graph
 */
export async function syncGuideToGraph(guideId: number, guideData: any): Promise<void> {
  await upsertNode('guide', guideId, {
    name: guideData.name,
    languages: guideData.languages,
    yearsExperience: guideData.yearsExperience,
  })

  // Sync specialization relationships
  if (guideData.specializations?.length > 0) {
    for (const spec of guideData.specializations) {
      const catId = typeof spec.category === 'number' ? spec.category : spec.category.id

      await upsertEdge('guide', guideId, 'category', catId, 'SPECIALIZES_IN', {
        yearsExperience: spec.years || 1,
        certified: spec.certified || false,
      })
    }
  }
}

/**
 * Sync place to graph
 */
export async function syncPlaceToGraph(placeId: number, placeData: any): Promise<void> {
  await upsertNode('place', placeId, {
    name: placeData.name,
    type: placeData.type,  // 'landmark', 'museum', 'street', etc.
    latitude: placeData.location?.latitude,
    longitude: placeData.location?.longitude,
  })

  // Sync historical events witnessed at this place
  if (placeData.historicalEvents?.length > 0) {
    for (const event of placeData.historicalEvents) {
      const eventId = typeof event === 'number' ? event : event.id

      await upsertEdge('place', placeId, 'event', eventId, 'WITNESSED', {
        significance: event.significance || 5,
      })
    }
  }
}

/**
 * Sync historical event to graph
 */
export async function syncEventToGraph(eventId: number, eventData: any): Promise<void> {
  await upsertNode('event', eventId, {
    title: eventData.title,
    era: eventData.era,
    dateStart: eventData.dateStart,
    dateEnd: eventData.dateEnd,
    significance: eventData.significance,
  })

  // Sync category relationships
  if (eventData.categories?.length > 0) {
    for (const cat of eventData.categories) {
      const catId = typeof cat === 'number' ? cat : cat.id

      await upsertEdge('event', eventId, 'category', catId, 'BELONGS_TO', {
        relevance: cat.relevance || 1.0,
      })
    }
  }
}

/**
 * Sync category to graph
 */
export async function syncCategoryToGraph(categoryId: number, categoryData: any): Promise<void> {
  await upsertNode('category', categoryId, {
    name: categoryData.name,
    slug: categoryData.slug,
    type: categoryData.type,
  })
}

/**
 * Remove entity from graph
 */
export async function removeFromGraph(nodeType: NodeType, entityId: number): Promise<void> {
  await deleteNode(nodeType, entityId)
}
```

### Step 4: Create Graph Visualization API

```typescript
// apps/web/app/api/graph/visualize/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getSubgraph } from '@/lib/knowledge-graph/graph-queries'
import { NodeType } from '@/lib/knowledge-graph/graph-service'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const nodeType = searchParams.get('nodeType') as NodeType
  const entityId = parseInt(searchParams.get('entityId') || '')
  const depth = parseInt(searchParams.get('depth') || '2')

  if (!nodeType || !entityId) {
    return NextResponse.json(
      { error: 'nodeType and entityId required' },
      { status: 400 }
    )
  }

  try {
    const subgraph = await getSubgraph(nodeType, entityId, Math.min(depth, 3))

    // Transform for D3.js visualization
    const d3Data = {
      nodes: subgraph.nodes.map((n) => ({
        id: n.id,
        type: n.nodeType,
        entityId: n.entityId,
        label: n.properties.title || n.properties.name || `${n.nodeType}-${n.entityId}`,
        ...n.properties,
      })),
      links: subgraph.edges.map((e) => ({
        source: e.source,
        target: e.target,
        type: e.type,
        weight: e.weight,
      })),
    }

    return NextResponse.json(d3Data)
  } catch (error) {
    console.error('[Graph Visualize]', error)
    return NextResponse.json(
      { error: 'Failed to get subgraph' },
      { status: 500 }
    )
  }
}
```

### Step 5: Create Historical Events Collection

```typescript
// packages/cms/collections/historical-events.ts
import type { CollectionConfig } from 'payload'
import { isAdmin } from '../access'

export const HistoricalEvents: CollectionConfig = {
  slug: 'historical-events',
  admin: {
    useAsTitle: 'title',
    group: 'Knowledge',
    description: 'Historical events for knowledge graph',
  },
  access: {
    read: () => true,
    create: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  hooks: {
    afterChange: [
      async ({ doc, operation }) => {
        const { syncEventToGraph } = await import(
          '../../apps/web/lib/knowledge-graph/graph-sync'
        )
        await syncEventToGraph(doc.id, doc)
      },
    ],
    afterDelete: [
      async ({ doc }) => {
        const { removeFromGraph } = await import(
          '../../apps/web/lib/knowledge-graph/graph-sync'
        )
        await removeFromGraph('event', doc.id)
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'richText',
      localized: true,
    },
    {
      name: 'dateStart',
      type: 'date',
      admin: {
        description: 'When the event started',
      },
    },
    {
      name: 'dateEnd',
      type: 'date',
      admin: {
        description: 'When the event ended (leave blank for single-day events)',
      },
    },
    {
      name: 'era',
      type: 'select',
      required: true,
      options: [
        { label: 'Viking Age (793-1066)', value: 'viking' },
        { label: 'Medieval (1066-1500)', value: 'medieval' },
        { label: 'Vasa Era (1523-1654)', value: 'vasa' },
        { label: 'Swedish Empire (1611-1721)', value: 'empire' },
        { label: 'Age of Liberty (1718-1772)', value: 'liberty' },
        { label: 'Gustavian Era (1772-1809)', value: 'gustavian' },
        { label: 'Modern (1809-present)', value: 'modern' },
      ],
    },
    {
      name: 'significance',
      type: 'number',
      min: 1,
      max: 10,
      defaultValue: 5,
      admin: {
        description: 'Historical significance (1-10)',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
    },
  ],
}
```

## Todo List

- [ ] Create database migration for graph tables
- [ ] Implement graph-service.ts
- [ ] Implement graph-queries.ts
- [ ] Implement graph-sync.ts hooks
- [ ] Create /api/graph/query endpoint
- [ ] Create /api/graph/visualize endpoint
- [ ] Create historical-events collection
- [ ] Create places collection
- [ ] Add graph sync hooks to existing collections
- [ ] Create admin graph visualization component
- [ ] Build D3.js force-directed graph UI
- [ ] Add "find related" feature to tour detail
- [ ] Integrate graph queries with RAG retriever
- [ ] Create materialized view refresh cron job
- [ ] Seed initial historical events (20+ events)
- [ ] Seed Swedish places (30+ landmarks)

## Success Criteria

- [ ] Graph traversal queries <500ms
- [ ] All tours connected to categories and guides
- [ ] Admin can visualize connections
- [ ] RAG retriever uses graph for context
- [ ] Historical events linked to places
- [ ] No orphan nodes in graph

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Complex queries slow | Medium | High | Materialized views, query caching |
| Data sync issues | Medium | Medium | Transactional updates, integrity checks |
| Graph grows too large | Low | Medium | Pagination, depth limits |
| Neo4j migration needed | Low | Medium | Abstract query layer for portability |
| Admin UI complexity | Medium | Low | Start simple, iterate based on feedback |

## Security Considerations

1. **Read-only for public**: Graph queries are read-only for visitors
2. **Admin-only mutations**: Only admins can modify graph structure
3. **Query depth limits**: Prevent DoS with deep traversals
4. **Rate limiting**: Protect visualization endpoint
5. **No sensitive data**: Graph properties are public info

## Next Steps

After Phase 07 completion:
1. **Neo4j Migration**: If JSONB performance insufficient
2. **Graph ML**: Node embeddings for similarity
3. **Auto-suggestions**: Recommend missing connections
4. **Timeline View**: Visualize events chronologically

---

**Unresolved Questions:**

1. PostgreSQL JSONB vs. Neo4j - when to migrate?
2. How to handle conflicting historical dates?
3. Should places include non-tour-related locations?
4. Graph embedding strategy for semantic queries?
