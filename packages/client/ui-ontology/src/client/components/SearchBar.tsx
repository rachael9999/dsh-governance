import { useState } from 'react'
import type { SemanticObjectRef } from '@deepseek-ai/dsh-semantic-core'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { theme } from '../theme.ts'

export interface SearchBarProps {
  t: TranslateNS<'ontology'>
  onResolve: (query: string) => Promise<SemanticObjectRef | null>
}

/** Resolve bar: alias/keyword query -> jump to the resolved object's Detail. */
export function SearchBar({ t, onResolve }: SearchBarProps): JSX.Element {
  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  const submit = async (): Promise<void> => {
    const q = query.trim()
    if (q === '') return
    setBusy(true)
    setNote(null)
    try {
      const ref = await onResolve(q)
      if (ref === null) setNote(t('search.unresolved'))
    } catch (error) {
      setNote(String(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, background: theme.panel }}>
      <input
        value={query}
        placeholder={t('search.placeholder')}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') void submit() }}
        style={{ flex: 1, padding: '6px 8px', border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 13, color: theme.text, background: theme.panel }}
      />
      <button
        type="button"
        onClick={() => void submit()}
        disabled={busy}
        style={{ padding: '6px 12px', border: `1px solid ${theme.accent}`, borderRadius: 6, background: theme.accent, color: '#fff', cursor: 'pointer', fontSize: 13 }}
      >
        {t('search.button')}
      </button>
      {note !== null && <span style={{ alignSelf: 'center', color: theme.danger, fontSize: 12 }}>{note}</span>}
    </div>
  )
}
