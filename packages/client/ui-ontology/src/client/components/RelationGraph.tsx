import { useEffect, useState } from 'react'
import type { OntologyClient } from '../ontology-client.ts'
import type { SemanticObjectRef, SemanticRelation, SemanticRelationResult } from '@deepseek-ai/dsh-semantic-core'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { theme } from '../theme.ts'

export interface RelationGraphProps {
  t: TranslateNS<'ontology'>
  client: OntologyClient
  ref: SemanticObjectRef
  onOpen: (ref: SemanticObjectRef) => void
}

/** Lightweight relations view: the focused node plus its incoming/outgoing edges. */
export function RelationGraph({ t, client, ref, onOpen }: RelationGraphProps): JSX.Element {
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<SemanticRelationResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    client.relations(ref, controller.signal)
      .then(value => setResult(value))
      .catch((cause) => { if ((cause as Error)?.name !== 'AbortError') setError(String(cause)) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [client, ref])

  if (loading) return <div style={{ padding: 16, color: theme.muted, fontSize: 13 }}>{t('loading')}</div>
  if (error !== null) return <div style={{ padding: 16, color: theme.danger, fontSize: 13 }}>{t('error')}: {error}</div>

  const otherOf = (relation: SemanticRelation): SemanticObjectRef =>
    sameRef(relation.source, ref) ? relation.target : relation.source

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <Column
        title={`${t('incoming')} (${result?.incoming.length ?? 0})`}
        relations={result?.incoming ?? []}
        otherOf={otherOf}
        onOpen={onOpen}
      />
      <Column
        title={`${t('outgoing')} (${result?.outgoing.length ?? 0})`}
        relations={result?.outgoing ?? []}
        otherOf={otherOf}
        onOpen={onOpen}
      />
    </div>
  )
}

function Column(
  { title, relations, otherOf, onOpen }: {
    title: string
    relations: SemanticRelation[]
    otherOf: (relation: SemanticRelation) => SemanticObjectRef
    onOpen: (ref: SemanticObjectRef) => void
  },
): JSX.Element {
  return (
    <div>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>{title}</div>
      {relations.length === 0 && <div style={{ fontSize: 13, color: theme.muted }}>{'-'}</div>}
      <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
        {relations.map((relation, index) => {
          const other = otherOf(relation)
          return (
            <li key={`${relation.kind ?? 'rel'}:${String(relation.id ?? index)}`} style={{ fontSize: 13 }}>
              <span style={{ color: theme.muted, fontSize: 11 }}>{relation.kind ?? 'rel'} · </span>
              <button
                type="button"
                onClick={() => onOpen(other)}
                style={{ background: 'none', border: 'none', padding: 0, color: theme.accent, cursor: 'pointer', fontSize: 13 }}
              >
                {String(other.id)}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function sameRef(left: SemanticObjectRef, right: SemanticObjectRef): boolean {
  if (left.type !== right.type || left.id !== right.id) return false
  if (left.packId === undefined || right.packId === undefined) return true
  return left.packId === right.packId
}
