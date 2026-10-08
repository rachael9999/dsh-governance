/**
 * UI state for the read-only ontology explorer.
 *
 * Holds the live manifest/browse reads, the active filter, the current
 * selection, and the view mode. Reads are abortsafe: each effect owns an
 * AbortController that cancels the in-flight Remote call on re-render.
 */

import { useCallback, useEffect, useState } from 'react'
import type { OntologyClient } from './ontology-client.ts'
import type {
  SemanticBrowseRequest,
  SemanticBrowseResult,
  SemanticManifest,
  SemanticObjectRef,
} from '@deepseek-ai/dsh-semantic-core'
import type { PackInfo, LoadPackResponse } from '@deepseek-ai/dsh-api-ontology-rpc'

export type OntologyMode = 'browse' | 'detail' | 'graph'

export interface OntologyExplorer {
  loading: boolean
  error: string | null
  manifest: SemanticManifest | null
  browse: SemanticBrowseResult | null
  filter: SemanticBrowseRequest
  setFilter: (next: SemanticBrowseRequest) => void
  selection: SemanticObjectRef | null
  mode: OntologyMode
  setMode: (mode: OntologyMode) => void
  /** Open an object in the Detail view. */
  open: (ref: SemanticObjectRef) => void
  /** Open an object in the Graph view. */
  openGraph: (ref: SemanticObjectRef) => void
  /** Resolve a natural-language query and jump to its Detail view. */
  resolve: (query: string, signal?: AbortSignal) => Promise<SemanticObjectRef | null>
  reloadManifest: () => void
  /** List available packs. */
  packs: PackInfo[]
  packsLoading: boolean
  loadPacks: () => Promise<void>
  /** Load a specific pack. */
  loadPack: (packId: string, version?: string) => Promise<LoadPackResponse>
}

export function useOntologyExplorer(client: OntologyClient): OntologyExplorer {
  const [manifest, setManifest] = useState<SemanticManifest | null>(null)
  const [browse, setBrowse] = useState<SemanticBrowseResult | null>(null)
  const [filter, setFilter] = useState<SemanticBrowseRequest>({ limit: 50 })
  const [selection, setSelection] = useState<SemanticObjectRef | null>(null)
  const [mode, setMode] = useState<OntologyMode>('browse')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [packs, setPacks] = useState<PackInfo[]>([])
  const [packsLoading, setPacksLoading] = useState(false)

  const loadManifest = useCallback(async (signal?: AbortSignal): Promise<void> => {
    setError(null)
    try {
      setManifest(await client.manifest(signal))
    } catch (cause) {
      if ((cause as Error)?.name !== 'AbortError') setError(String(cause))
    }
  }, [client])

  const loadBrowse = useCallback(async (req: SemanticBrowseRequest, signal?: AbortSignal): Promise<void> => {
    setLoading(true)
    setError(null)
    try {
      setBrowse(await client.browse(req, signal))
    } catch (cause) {
      if ((cause as Error)?.name !== 'AbortError') setError(String(cause))
    } finally {
      setLoading(false)
    }
  }, [client])

  useEffect(() => {
    const controller = new AbortController()
    void loadManifest(controller.signal)
    return () => controller.abort()
  }, [loadManifest])

  useEffect(() => {
    const controller = new AbortController()
    void loadBrowse(filter, controller.signal)
    return () => controller.abort()
  }, [loadBrowse, filter])

  const open = useCallback((ref: SemanticObjectRef) => {
    setSelection(ref)
    setMode('detail')
  }, [])

  const openGraph = useCallback((ref: SemanticObjectRef) => {
    setSelection(ref)
    setMode('graph')
  }, [])

  const resolve = useCallback(async (query: string, signal?: AbortSignal): Promise<SemanticObjectRef | null> => {
    const result = await client.resolve({ query }, signal)
    if (result.status === 'resolved' && result.selected !== undefined) {
      open(result.selected.ref)
      return result.selected.ref
    }
    return null
  }, [client, open])

  const loadPacks = useCallback(async (): Promise<void> => {
    setPacksLoading(true)
    setError(null)
    try {
      const response = await client.listPacks({}, undefined)
      setPacks(response.packs)
    } catch (cause) {
      if ((cause as Error)?.name !== 'AbortError') setError(String(cause))
    } finally {
      setPacksLoading(false)
    }
  }, [client])

  const loadPack = useCallback(async (packId: string, version?: string): Promise<LoadPackResponse> => {
    setError(null)
    try {
      const response = await client.loadPack(version === undefined ? { packId } : { packId, version }, undefined)
      // Reload manifest after successful load
      if (response.success) {
        await loadManifest()
        await loadPacks()
      }
      return response
    } catch (cause) {
      if ((cause as Error)?.name !== 'AbortError') setError(String(cause))
      return { success: false, error: String(cause) }
    }
  }, [client, loadManifest, loadPacks])

  // Load packs on mount
  useEffect(() => {
    void loadPacks()
  }, [loadPacks])

  return {
    loading,
    error,
    manifest,
    browse,
    filter,
    setFilter,
    selection,
    mode,
    setMode,
    open,
    openGraph,
    resolve,
    reloadManifest: () => { void loadManifest() },
    packs,
    packsLoading,
    loadPacks,
    loadPack,
  }
}
