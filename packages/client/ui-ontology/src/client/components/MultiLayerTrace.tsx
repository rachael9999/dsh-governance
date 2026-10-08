import { useEffect, useState } from 'react'
import type { OntologyClient } from '../ontology-client.ts'
import type { SemanticObjectRef, SemanticRelation } from '@deepseek-ai/dsh-semantic-core'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { theme } from '../theme.ts'

export interface MultiLayerTraceProps {
  t: TranslateNS<'ontology'>
  client: OntologyClient
  ref: SemanticObjectRef
  onOpen: (ref: SemanticObjectRef) => void
}

/** 7-layer trace item. */
interface TraceItem {
  layer: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5' | 'L6'
  ref: SemanticObjectRef
  name: string
  type: string
  description?: string
}

/** Complete trace chain. */
interface TraceChain {
  backward: TraceItem[]  // From selected item back to L0
  forward: TraceItem[]   // From selected item forward to L6
}

/**
 * Multi-Layer Relationship Model trace visualization.
 * Shows the complete 7-layer追溯 chain from Evidence (L0) to DD Conclusion (L6).
 */
export function MultiLayerTrace({ t, client, ref, onOpen }: MultiLayerTraceProps): JSX.Element {
  const [loading, setLoading] = useState(true)
  const [trace, setTrace] = useState<TraceChain | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)

    buildTraceChain(client, ref, controller.signal)
      .then(setTrace)
      .catch((cause) => {
        if ((cause as Error)?.name !== 'AbortError') setError(String(cause))
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [client, ref])

  if (loading) {
    return (
      <div style={{ padding: 16, color: theme.muted, fontSize: 13 }}>
        {t('loading')}...
      </div>
    )
  }

  if (error !== null) {
    return (
      <div style={{ padding: 16, color: theme.danger, fontSize: 13 }}>
        {t('error')}: {error}
      </div>
    )
  }

  if (!trace) {
    return (
      <div style={{ padding: 16, color: theme.muted, fontSize: 13 }}>
        无追溯链数据
      </div>
    )
  }

  return (
    <div style={{ padding: 16, fontSize: 13 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: theme.text }}>
        7 层追溯链
      </h3>

      {/* Backward trace (to L0) */}
      {trace.backward.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, marginBottom: 8 }}>
            ← 向上追溯 (至证据层)
          </div>
          <TraceChainVisual items={trace.backward} onOpen={onOpen} />
        </div>
      )}

      {/* Forward trace (to L6) */}
      {trace.forward.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, marginBottom: 8 }}>
            向下推导 (至结论层) →
          </div>
          <TraceChainVisual items={trace.forward} onOpen={onOpen} />
        </div>
      )}
    </div>
  )
}

/**
 * Visual trace chain component.
 */
function TraceChainVisual({
  items,
  onOpen,
}: {
  items: TraceItem[]
  onOpen: (ref: SemanticObjectRef) => void
}): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {items.map(item => (
        <TraceNode
          key={`${item.layer}:${String(item.ref.id)}`}
          item={item}
          onOpen={onOpen}
        />
      ))}
    </div>
  )
}

/**
 * Single trace node.
 */
function TraceNode({
  item,
  onOpen,
}: {
  item: TraceItem
  onOpen: (ref: SemanticObjectRef) => void
}): JSX.Element {
  const layerColors = {
    L0: { bg: '#e8f5e9', border: '#4caf50', text: '#2e7d32' },      // Green - Evidence
    L1: { bg: '#e3f2fd', border: '#2196f3', text: '#1976d2' },      // Blue - Question
    L2: { bg: '#f3e5f5', border: '#9c27b0', text: '#7b1fa2' },      // Purple - Ontology
    L3: { bg: '#fff3e0', border: '#ff9800', text: '#f57c00' },      // Orange - Derived
    L4: { bg: '#ffebee', border: '#f44336', text: '#d32f2f' },      // Red - Rule
    L5: { bg: '#fce4ec', border: '#e91e63', text: '#c2185b' },      // Pink - Risk
    L6: { bg: '#e0f7fa', border: '#00bcd4', text: '#0097a7' },      // Cyan - Conclusion
  }

  const colors = layerColors[item.layer]

  return (
    <div
      onClick={() => onOpen(item.ref)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        borderRadius: 6,
        cursor: 'pointer',
        transition: 'transform 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.02)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {/* Layer badge */}
      <div
        style={{
          minWidth: 32,
          height: 32,
          borderRadius: '50%',
          background: colors.border,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        {item.layer}
      </div>

      {/* Content */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>
          {item.name}
        </div>
        {item.description && (
          <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
            {item.description}
          </div>
        )}
      </div>

      {/* Type badge */}
      <div
        style={{
          fontSize: 10,
          padding: '2px 6px',
          background: colors.border,
          color: '#fff',
          borderRadius: 3,
        }}
      >
        {item.type}
      </div>
    </div>
  )
}

/**
 * Build complete trace chain from relations.
 */
async function buildTraceChain(
  client: OntologyClient,
  startRef: SemanticObjectRef,
  signal?: AbortSignal,
): Promise<TraceChain | null> {
  try {
    const relations = await client.relations(startRef, signal)
    const backward: TraceItem[] = []
    const forward: TraceItem[] = []

    // Traverse backward (to L0)
    await traverseBackward(client, relations.incoming, backward, new Set([refKey(startRef)]), signal)

    // Traverse forward (to L6)
    await traverseForward(client, relations.outgoing, forward, new Set([refKey(startRef)]), signal)

    // Add start item
    const startItem = await resolveItem(client, startRef, signal)
    if (startItem) {
      backward.unshift(startItem)
    }

    return { backward, forward }
  } catch (error) {
    console.error('Failed to build trace chain:', error)
    return null
  }
}

/**
 * Traverse backward through incoming relations.
 */
async function traverseBackward(
  client: OntologyClient,
  incoming: SemanticRelation[],
  trace: TraceItem[],
  visited: Set<string>,
  signal?: AbortSignal,
): Promise<void> {
  for (const relation of incoming) {
    const sourceRef = relation.source
    const key = refKey(sourceRef)
    if (visited.has(key)) continue
    visited.add(key)
    const sourceItem = await resolveItem(client, sourceRef, signal)

    if (sourceItem) {
      trace.unshift(sourceItem)

      // Continue traversing if not at L0
      if (sourceItem.layer !== 'L0') {
        const sourceRelations = await client.relations(sourceRef, signal)
        await traverseBackward(client, sourceRelations.incoming, trace, visited, signal)
      }
    }
  }
}

/**
 * Traverse forward through outgoing relations.
 */
async function traverseForward(
  client: OntologyClient,
  outgoing: SemanticRelation[],
  trace: TraceItem[],
  visited: Set<string>,
  signal?: AbortSignal,
): Promise<void> {
  for (const relation of outgoing) {
    const targetRef = relation.target
    const key = refKey(targetRef)
    if (visited.has(key)) continue
    visited.add(key)
    const targetItem = await resolveItem(client, targetRef, signal)

    if (targetItem) {
      trace.push(targetItem)

      // Continue traversing if not at L6
      if (targetItem.layer !== 'L6') {
        const targetRelations = await client.relations(targetRef, signal)
        await traverseForward(client, targetRelations.outgoing, trace, visited, signal)
      }
    }
  }
}

function refKey(ref: SemanticObjectRef): string {
  return `${String(ref.packId ?? '')}:${ref.type}:${String(ref.id)}`
}

/**
 * Resolve an object reference to a trace item.
 */
async function resolveItem(
  client: OntologyClient,
  ref: SemanticObjectRef,
  signal?: AbortSignal,
): Promise<TraceItem | null> {
  try {
    const resolution = await client.get(ref, signal)

    if (resolution.status !== 'resolved' || !resolution.object) {
      return null
    }

    const obj = resolution.object as unknown as Record<string, unknown>
    const layer = inferLayer(ref.type, obj)

    return {
      layer,
      ref,
      name: String(obj.name ?? obj.title ?? obj.text ?? ref.id),
      type: ref.type,
      description: String(obj.description ?? obj.summary ?? ''),
    }
  } catch {
    return null
  }
}

/**
 * Infer layer from object type and metadata.
 */
function inferLayer(type: string, obj: Record<string, unknown>): TraceItem['layer'] {
  // Check explicit layer metadata
  const metadata = obj.typedMetadata as Record<string, unknown> | undefined
  if (metadata?.layer) {
    return metadata.layer as TraceItem['layer']
  }

  // Infer from type
  switch (type) {
    case 'evidence':
      return 'L0'
    case 'question':
      return 'L1'
    case 'concept':
      // Check if L3 derived metric
      if (metadata?.signalType) {
        return 'L3'
      }
      return 'L2'
    case 'rule':
      return 'L4'
    case 'risk':
      return 'L5'
    case 'ddConclusion':
      return 'L6'
    default:
      return 'L2'
  }
}
