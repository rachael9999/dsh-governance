import type { ConvViewProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { InjectFace, PropsLocale, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { OntologyClient } from './ontology-client.ts'
import { useOntologyExplorer, type OntologyMode } from './ontology-store.ts'
import { theme } from './theme.ts'
import { SearchBar } from './components/SearchBar.tsx'
import { PackList } from './components/PackList.tsx'
import { BrowseTable } from './components/BrowseTable.tsx'
import { ObjectDetail } from './components/ObjectDetail.tsx'
import { RelationGraph } from './components/RelationGraph.tsx'
import { PackSelector } from './components/PackSelector.tsx'

export interface OntologyInjected {
  /** Pre-built ontology Remote client (per client root context). */
  client: OntologyClient
}

/** Read-only ontology explorer mounted as a Conversation view tab. */
export function OntologyApp(
  { client, t }: ConvViewProps & InjectFace<OntologyInjected> & PropsLocale<'ontology'>,
): JSX.Element {
  const ex = useOntologyExplorer(client)
  const empty = ex.manifest !== null
    && (ex.manifest.counts?.concepts ?? 0) === 0
    && (ex.manifest.counts?.questions ?? 0) === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: theme.panel, color: theme.text }}>
      <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, background: theme.panel, alignItems: 'center' }}>
        <SearchBar t={t} onResolve={ex.resolve} />
        <PackSelector
          t={t}
          packs={ex.packs}
          loading={ex.packsLoading}
          onLoad={async (packId, version) => { await ex.loadPack(packId, version) }}
          onRefresh={ex.loadPacks}
        />
      </div>
      {ex.error !== null && (
        <div style={{ padding: '6px 12px', color: theme.danger, fontSize: 12, background: theme.accentSoft }}>
          {t('error')}: {ex.error}
        </div>
      )}
      {empty && (
        <div style={{ padding: 16, color: theme.muted, fontSize: 13 }}>{t('noPacks')}</div>
      )}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <PackList t={t} manifest={ex.manifest} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <ModeTabs t={t} mode={ex.mode} onMode={ex.setMode} />
          {ex.mode === 'browse' && (
            <BrowseTable
              t={t}
              loading={ex.loading}
              browse={ex.browse}
              filter={ex.filter}
              onFilter={ex.setFilter}
              onOpen={ex.open}
              onOpenGraph={ex.openGraph}
            />
          )}
          {ex.mode === 'detail' && ex.selection !== null && (
            <ObjectDetail t={t} client={client} ref={ex.selection} onOpen={ex.open} />
          )}
          {ex.mode === 'graph' && ex.selection !== null && (
            <RelationGraph t={t} client={client} ref={ex.selection} onOpen={ex.open} />
          )}
        </div>
      </div>
    </div>
  )
}

function ModeTabs(
  { t, mode, onMode }: { t: TranslateNS<'ontology'>; mode: OntologyMode; onMode: (mode: OntologyMode) => void },
): JSX.Element {
  const tab = (id: OntologyMode, label: string): JSX.Element => (
    <button
      type="button"
      onClick={() => onMode(id)}
      style={{
        padding: '8px 14px',
        border: 'none',
        borderBottom: mode === id ? `2px solid ${theme.accent}` : '2px solid transparent',
        background: 'none',
        color: mode === id ? theme.text : theme.muted,
        cursor: 'pointer',
        fontSize: 13,
        fontWeight: mode === id ? 600 : 400,
      }}
    >
      {label}
    </button>
  )
  return (
    <div style={{ display: 'flex', gap: 4, paddingLeft: 12, borderBottom: `1px solid ${theme.border}`, background: theme.panel }}>
      {tab('browse', t('browse'))}
      {tab('detail', t('detail'))}
      {tab('graph', t('graph'))}
    </div>
  )
}
