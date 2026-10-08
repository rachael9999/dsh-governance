import { useEffect, useState } from 'react'
import type { OntologyClient } from '../ontology-client.ts'
import type { SemanticObjectRef } from '@deepseek-ai/dsh-semantic-core'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { theme } from '../theme.ts'
import { MultiLayerTrace } from './MultiLayerTrace.tsx'

export interface ObjectDetailProps {
  t: TranslateNS<'ontology'>
  client: OntologyClient
  ref: SemanticObjectRef
  onOpen: (ref: SemanticObjectRef) => void
}

/** Detail view: complete object + provenance + linked questions/rules + evidence + 7-layer trace. */
export function ObjectDetail({ t, client, ref, onOpen }: ObjectDetailProps): JSX.Element {
  const [loading, setLoading] = useState(true)
  const [resolution, setResolution] = useState<unknown>(null)
  const [explain, setExplain] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    Promise.all([client.get(ref, controller.signal), client.explain(ref, controller.signal)])
      .then(([getResult, explainResult]) => {
        setResolution(getResult)
        setExplain(explainResult)
      })
      .catch((cause) => { if ((cause as Error)?.name !== 'AbortError') setError(String(cause)) })
      .finally(() => setLoading(false))
    return () => controller.abort()
  }, [client, ref])

  if (loading) return <div style={{ padding: 16, color: theme.muted, fontSize: 13 }}>{t('loading')}</div>
  if (error !== null) return <div style={{ padding: 16, color: theme.danger, fontSize: 13 }}>{t('error')}: {error}</div>

  const get = resolution as { status: string; object?: Record<string, unknown>; reason?: string }
  const exp = explain as {
    name?: string
    definition?: string
    aliases?: string[]
    sections?: Array<{ title: string; content: string }>
    questions?: Array<{ ref: SemanticObjectRef; name: string }>
    rules?: Array<{ ref: SemanticObjectRef; name: string }>
    evidenceRequirements?: Array<{ id: string; description?: string }>
  }

  if (get?.status !== 'resolved' || get?.object === undefined) {
    return (
      <div style={{ padding: 16, color: theme.muted, fontSize: 13 }}>
        {t('unresolved')}: {String(ref.id)} {get?.reason ? `— ${get.reason}` : ''}
      </div>
    )
  }

  const object = get.object as Record<string, unknown>

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
      <div style={{ fontSize: 18, fontWeight: 600, color: theme.text }}>{exp?.name ?? String(object.name ?? ref.id)}</div>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 12 }}>
        {ref.type} · {String(ref.id)} {ref.packId ? `· ${ref.packId}` : ''}
      </div>

      {exp?.definition && <Section title={t('detail')} body={exp.definition} />}
      {Array.isArray(exp?.aliases) && exp.aliases.length > 0 && (
        <Section title={t('aliases')} body={exp.aliases.join(', ')} />
      )}

      {(exp?.sections ?? []).map(section => (
        <Section key={section.title} title={section.title} body={section.content} />
      ))}

      {Array.isArray(exp?.questions) && exp.questions.length > 0 && (
        <ListSection title={t('questions')} items={exp.questions.map(q => ({ key: `${q.ref.type}:${String(q.ref.id)}`, label: q.name, onClick: () => onOpen(q.ref) }))} />
      )}
      {Array.isArray(exp?.rules) && exp.rules.length > 0 && (
        <ListSection title={t('rules')} items={exp.rules.map(r => ({ key: `${r.ref.type}:${String(r.ref.id)}`, label: r.name, onClick: () => onOpen(r.ref) }))} />
      )}
      {Array.isArray(exp?.evidenceRequirements) && exp.evidenceRequirements.length > 0 && (
        <ListSection
          title={t('evidence')}
          items={exp.evidenceRequirements.map(e => ({ key: e.id, label: `${e.id}${e.description ? ` — ${e.description}` : ''}` }))}
        />
      )}

      {/* 7-Layer Trace Visualization */}
      <div style={{ marginTop: 20, borderTop: `1px solid ${theme.border}`, paddingTop: 16 }}>
        <MultiLayerTrace t={t} client={client} ref={ref} onOpen={onOpen} />
      </div>
    </div>
  )
}

function Section({ title, body }: { title: string; body: string }): JSX.Element {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 14, color: theme.text, lineHeight: 1.5 }}>{body}</div>
    </div>
  )
}

function ListSection({ title, items }: { title: string; items: Array<{ key: string; label: string; onClick?: () => void }> }): JSX.Element {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: theme.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>{title}</div>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14, color: theme.text }}>
        {items.map(item => (
          <li key={item.key}>
            {item.onClick
              ? <button type="button" onClick={item.onClick} style={{ background: 'none', border: 'none', padding: 0, color: theme.accent, cursor: 'pointer', fontSize: 14 }}>{item.label}</button>
              : item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
