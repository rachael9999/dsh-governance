import type { CSSProperties } from 'react'
import type {
  SemanticBrowseRequest,
  SemanticBrowseResult,
  SemanticObjectRef,
  SemanticObjectType,
} from '@deepseek-ai/dsh-semantic-core'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { theme } from '../theme.ts'

export interface BrowseTableProps {
  t: TranslateNS<'ontology'>
  loading: boolean
  browse: SemanticBrowseResult | null
  filter: SemanticBrowseRequest
  onFilter: (next: SemanticBrowseRequest) => void
  onOpen: (ref: SemanticObjectRef) => void
  onOpenGraph: (ref: SemanticObjectRef) => void
}

const TYPES: SemanticObjectType[] = ['concept', 'question', 'rule', 'action', 'constraint']

const inputStyle: CSSProperties = {
  padding: '4px 8px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 13, color: theme.text, background: theme.panel,
}
const btnStyle: CSSProperties = {
  padding: '4px 10px', border: `1px solid ${theme.border}`, borderRadius: 6, background: theme.panel, color: theme.text, cursor: 'pointer',
}
const chipBtnStyle: CSSProperties = {
  padding: '2px 8px', border: `1px solid ${theme.chip}`, borderRadius: 6, background: theme.chip, color: theme.chipText, fontSize: 12, cursor: 'pointer',
}

/**
 * Build the next filter, dropping any field left empty or undefined.
 * Required because `SemanticBrowseRequest` fields are `exactOptionalPropertyTypes`
 * optional — assigning `undefined` is a type error, so we delete instead.
 * `LoosePatch` permits `undefined` values at the call site (unlike `Partial`).
 */
type LoosePatch<T> = { [K in keyof T]?: T[K] | undefined }

function nextFilter(base: SemanticBrowseRequest, patch: LoosePatch<SemanticBrowseRequest>): SemanticBrowseRequest {
  const next = { ...base } as SemanticBrowseRequest & Record<string, unknown>
  for (const key of Object.keys(patch)) {
    const value = (patch as Record<string, unknown>)[key]
    if (value === undefined || value === '') delete next[key]
    else next[key] = value
  }
  return next
}

/** Browse view: filters + paginated object list. */
export function BrowseTable({ t, loading, browse, filter, onFilter, onOpen, onOpenGraph }: BrowseTableProps): JSX.Element {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: `1px solid ${theme.border}`, flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={filter.type ?? ''}
          onChange={e => onFilter(nextFilter(filter, e.target.value ? { type: e.target.value as SemanticObjectType } : {}))}
          style={inputStyle}
        >
          <option value="">{`${t('type')}: *`}</option>
          {TYPES.map(tp => <option key={tp} value={tp}>{tp}</option>)}
        </select>
        <input
          placeholder={t('namespace')}
          value={filter.namespace ?? ''}
          onChange={e => onFilter(nextFilter(filter, { namespace: e.target.value || undefined }))}
          style={inputStyle}
        />
        <input
          placeholder={t('query')}
          value={filter.query ?? ''}
          onChange={e => onFilter(nextFilter(filter, { query: e.target.value || undefined }))}
          style={inputStyle}
        />
        {loading && <span style={{ fontSize: 12, color: theme.muted }}>{t('loading')}</span>}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 8 }}>
        {(browse?.items ?? []).map(item => (
          <div
            key={`${item.ref.type}:${String(item.ref.id)}`}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', borderBottom: `1px solid ${theme.chip}`, borderRadius: 4 }}
          >
            <button
              type="button"
              onClick={() => onOpen(item.ref)}
              style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', color: theme.accent, fontSize: 13 }}
            >
              <span style={{ color: theme.muted, fontSize: 11 }}>{item.ref.type} · </span>
              {item.name}
              {item.namespace ? <span style={{ color: theme.muted, fontSize: 11 }}> ({item.namespace})</span> : null}
            </button>
            <button type="button" onClick={() => onOpenGraph(item.ref)} style={chipBtnStyle}>{t('graph')}</button>
          </div>
        ))}
        {browse !== null && browse.items.length === 0 && (
          <div style={{ padding: 12, color: theme.muted, fontSize: 13 }}>{t('empty')}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 12px', borderTop: `1px solid ${theme.border}` }}>
        <button type="button" onClick={() => onFilter(nextFilter(filter, { cursor: undefined }))} style={btnStyle}>{t('prev')}</button>
        <button type="button" onClick={() => onFilter(nextFilter(filter, { cursor: browse?.nextCursor }))} disabled={!browse?.nextCursor} style={btnStyle}>{t('next')}</button>
        <span style={{ fontSize: 12, color: theme.muted }}>{`${t('count')}: ${browse?.total ?? 0}`}</span>
      </div>
    </div>
  )
}
