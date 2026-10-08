/**
 * Dynamic ontology pack loader provider.
 *
 * Scans `.ontology-stage1/` directory for available packs and provides
 * on-demand loading through `ctx.semantic.load()`.
 *
 * @module @deepseek-ai/dsh-semantic-provider-ontology-loader
 */

import { resolve as resolvePath, join as joinPath } from 'node:path'
import { readdirSync, existsSync } from 'node:fs'
import { Context } from '@deepseek-ai/cordis'
import { FileOntologyPackProvider } from '@deepseek-ai/dsh-ontology-files'
import { legacyPackToSemanticPack } from '@deepseek-ai/dsh-domain-pe'
import type { LoadedOntologyPack, OntologyPackRef } from '@deepseek-ai/dsh-ontology'
import type { SemanticPack, SemanticPackRef } from '@deepseek-ai/dsh-semantic-core'

export const name = 'semantic-provider-ontology-loader'
export const inject: string[] = ['semantic']

/** Stage-1 ontology root directory. */
function ontologyStage1Root(): string {
  const fromEnv = process.env.ONTOLOGY_STAGE1_ROOT
  if (fromEnv !== undefined && fromEnv.length > 0) return fromEnv
  return resolvePath(process.cwd(), '.ontology-stage1')
}

/** Discover available packs from the stage-1 directory. */
export function discoverAvailablePacks(): Array<{ packId: string; version: string; root: string }> {
  const root = ontologyStage1Root()
  if (!existsSync(root)) {
    return []
  }

  const packs: Array<{ packId: string; version: string; root: string }> = []

  try {
    const entries = readdirSync(root, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue

      const packDir = joinPath(root, entry.name)
      const schemaPath = joinPath(packDir, 'pack.schema.json')

      if (existsSync(schemaPath)) {
        packs.push({
          packId: entry.name,
          version: '0.1.0', // TODO: read from schema or package.json
          root: packDir,
        })
      }
    }
  } catch (error) {
    console.warn(`[ontology-loader] Failed to scan ${root}: ${String(error)}`)
  }

  return packs
}

/** Load a specific pack from the stage-1 directory. */
export async function loadPackFromStage1(
  packId: string,
  version?: string,
): Promise<LoadedOntologyPack> {
  const root = ontologyStage1Root()
  const packDir = joinPath(root, packId)

  if (!existsSync(packDir)) {
    throw new Error(`Pack '${packId}' not found in ${root}`)
  }

  const schemaPath = joinPath(packDir, 'pack.schema.json')
  if (!existsSync(schemaPath)) {
    throw new Error(`pack.schema.json not found in ${packDir}`)
  }

  const fileProvider = new FileOntologyPackProvider(
    { signal: new AbortController().signal, invalidate: () => {} },
    { providerName: 'files', schemaPath: 'pack.schema.json' },
  )

  const ref = {
    packId,
    version: version ?? '0.1.0',
    root: packDir,
  } as unknown as OntologyPackRef

  return fileProvider.load(ref)
}

/**
 * Register the ontology loader provider and expose pack discovery.
 * @param ctx - host context (must already provide `ctx.semantic`).
 */
export function apply(ctx: Context): void {
  if (ctx.get('semantic') === undefined) return

  // Register the provider
  void ctx.semantic.registerProvider(() => ({
    name: 'ontology-loader',
    async load(ref: SemanticPackRef, _signal?: AbortSignal): Promise<SemanticPack> {
      const loaded = await loadPackFromStage1(ref.packId, ref.version)
      // Convert LoadedOntologyPack to SemanticPack using the legacy converter
      return legacyPackToSemanticPack(loaded, 'ontology-loader')
    },
  }))

  ctx.logger?.info?.(`[ontology-loader] Provider registered. Stage-1 root: ${ontologyStage1Root()}`)

  // Log available packs (but don't auto-load them)
  const available = discoverAvailablePacks()
  if (available.length > 0) {
    ctx.logger?.info?.(`[ontology-loader] Available packs: ${available.map(p => p.packId).join(', ')}`)
  } else {
    ctx.logger?.warn?.('[ontology-loader] No packs found in .ontology-stage1/')
  }
}
