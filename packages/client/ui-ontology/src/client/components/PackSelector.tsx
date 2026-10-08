import { useState } from 'react'
import type { PackInfo } from '@deepseek-ai/dsh-api-ontology-rpc'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { theme } from '../theme.ts'

export interface PackSelectorProps {
  t: TranslateNS<'ontology'>
  packs: PackInfo[]
  loading: boolean
  onLoad: (packId: string, version?: string) => Promise<void>
  onRefresh: () => void
}

/** Pack selector: lists available packs and allows loading them. */
export function PackSelector({ t, packs, loading, onLoad, onRefresh }: PackSelectorProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const handleLoad = async (pack: PackInfo): Promise<void> => {
    if (pack.loaded) return
    setBusy(pack.packId)
    try {
      await onLoad(pack.packId, pack.version)
    } finally {
      setBusy(null)
    }
  }

  const toggle = () => setOpen(!open)

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={toggle}
        style={{
          padding: '6px 12px',
          border: `1px solid ${theme.border}`,
          borderRadius: 6,
          background: theme.panel,
          color: theme.text,
          cursor: 'pointer',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span>📦</span>
        <span>{t('packs.select')}</span>
        <span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: 4,
            padding: 8,
            minWidth: 280,
            maxHeight: 400,
            overflowY: 'auto',
            background: theme.panel,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: 1000,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 8, borderBottom: `1px solid ${theme.border}` }}>
            <span style={{ fontWeight: 600, fontSize: 13, color: theme.text }}>{t('packs.available')}</span>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              style={{
                padding: '4px 8px',
                border: 'none',
                background: 'transparent',
                color: theme.accent,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: 12,
                opacity: loading ? 0.5 : 1,
              }}
            >
              🔄 {loading ? t('loading') : t('refresh')}
            </button>
          </div>

          {packs.length === 0 && !loading && (
            <div style={{ padding: 12, color: theme.muted, fontSize: 13, textAlign: 'center' }}>
              {t('packs.none')}
            </div>
          )}

          {loading && (
            <div style={{ padding: 12, color: theme.muted, fontSize: 13, textAlign: 'center' }}>
              {t('loading')}...
            </div>
          )}

          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: 6 }}>
            {packs.map(pack => (
              <li
                key={pack.packId}
                style={{
                  padding: 10,
                  border: `1px solid ${pack.loaded ? theme.accent : theme.border}`,
                  borderRadius: 6,
                  background: pack.loaded ? `${theme.accent}10` : theme.panelAlt,
                  cursor: pack.loaded ? 'default' : 'pointer',
                  opacity: busy !== null && busy !== pack.packId ? 0.6 : 1,
                }}
                onClick={() => void handleLoad(pack)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: theme.text }}>
                      {pack.displayName || pack.packId}
                      {pack.loaded && (
                        <span style={{ marginLeft: 6, padding: '2px 6px', background: theme.accent, color: '#fff', borderRadius: 4, fontSize: 10 }}>
                          {t('packs.loaded')}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: theme.muted, marginTop: 2 }}>
                      {pack.packId} · v{pack.version}
                    </div>
                    {pack.description && (
                      <div style={{ fontSize: 12, color: theme.muted, marginTop: 4 }}>
                        {pack.description}
                      </div>
                    )}
                  </div>
                  {!pack.loaded && busy === pack.packId && (
                    <span style={{ fontSize: 12, color: theme.accent }}>⏳</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Click outside to close */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 999 }}
          onClick={() => setOpen(false)}
        />
      )}
    </div>
  )
}
