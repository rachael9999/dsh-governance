import type { SemanticManifest } from '@deepseek-ai/dsh-semantic-core'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { theme } from '../theme.ts'

export interface PackListProps {
  t: TranslateNS<'ontology'>
  manifest: SemanticManifest | null
}

/** Left rail: manifest snapshot, object counts, namespaces and capabilities. */
export function PackList({ t, manifest }: PackListProps): JSX.Element {
  if (manifest === null) {
    return <div style={{ padding: 12, color: theme.muted, fontSize: 13, background: theme.panelAlt, minWidth: 220 }}>{t('loading')}</div>
  }
  const counts = manifest.counts
  const row = (label: string, value: number): JSX.Element => (
    <li style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: theme.muted }}>{label}</span>
      <span>{value}</span>
    </li>
  )
  return (
    <div style={{ padding: 12, borderRight: `1px solid ${theme.border}`, background: theme.panelAlt, minWidth: 220, overflowY: 'auto' }}>
      <div style={{ fontWeight: 600, marginBottom: 8, color: theme.text }}>{t('packs')}</div>
      <div style={{ fontSize: 12, color: theme.muted, marginBottom: 10 }}>
        {t('snapshot')}: {String(manifest.snapshotId)}
      </div>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 13, color: theme.text, display: 'grid', gap: 4 }}>
        {row('concepts', counts.concepts)}
        {row('questions', counts.questions)}
        {row('rules', counts.rules)}
        {row('actions', counts.actions)}
        {row('constraints', counts.constraints)}
        {row('relations', counts.relations)}
        {row('evidence', counts.evidenceRequirements)}
      </ul>
      <div style={{ marginTop: 12, fontSize: 12, color: theme.muted }}>
        <div style={{ marginBottom: 4 }}>namespaces</div>
        <div>{(manifest.namespaces ?? []).join(', ') || '—'}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: theme.muted }}>
        <div style={{ marginBottom: 4 }}>capabilities</div>
        <div>{(manifest.capabilities ?? []).join(', ') || '—'}</div>
      </div>
    </div>
  )
}
