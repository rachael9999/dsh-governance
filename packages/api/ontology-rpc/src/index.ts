/**
 * Host Remote surface for the read-only ontology explorer.
 *
 * Wraps the context-pinned `ctx.semantic` runtime and exposes six Typert
 * Remote methods under the `ontology` namespace. Every read pins a default
 * SemanticContext built from the packs currently admitted by the semantic
 * service; the client may later override the context for session pinning.
 *
 * The service performs no writes and no pack admission — the semantic service
 * owns admission, and `requireApproved` is set to `false` on the exploration
 * build so the still-`candidate` PE canonical pack can be browsed.
 *
 * @module @deepseek-ai/dsh-api-ontology-rpc
 */

import { Context } from '@deepseek-ai/cordis'
import { TypertGatewayError } from '@deepseek-ai/dsh-api-gateway'
import {
  Remote,
  TypertRemoteService,
} from '@deepseek-ai/dsh-typert-protocol'
import {
  createSemanticContext,
  type SemanticBrowseRequest,
  type SemanticBrowseResult,
  type SemanticContext,
  type SemanticExplanation,
  type SemanticManifest,
  type SemanticRelationResult,
  type SemanticResolveRequest,
  type SemanticSnapshotId,
  type ObjectResolution,
  type ResolutionResult,
  type PackId,
} from '@deepseek-ai/dsh-semantic-core'

import type { OntologyManifestRequest, OntologyObjectRequest, ListPacksRequest, ListPacksResponse, LoadPackRequest, LoadPackResponse, PackInfo } from './types.ts'

export type * from './types.ts'

/** Plugin configuration (none required for the exploration MVP). */
export interface Config {}

declare module '@deepseek-ai/cordis' {
  interface Context {
    ontologyRpc: OntologyRpcService
  }
}

/**
 * Read-only ontology Remote: a thin, context-pinning façade over `ctx.semantic`.
 */
export class OntologyRpcService extends TypertRemoteService {
  static inject = ['semantic']

  constructor(ctx: Context, config: Config = {}) {
    // Service key stays `ontologyRpc` (Cordis Context augmentation), but the
    // wire namespace is pinned to `ontology` so the client calls
    // `ontology/<method>` and matches the design doc's endpoint surface.
    super(ctx, 'ontologyRpc', { namespace: 'ontology' })
    void config
  }

  /**
   * Build a default context spanning every pack the semantic service has admitted.
   * `resolveFromContext` resolves purely by `packRefs`, so the synthesized
   * `snapshotId` is metadata only.
   */
  private defaultContext(): SemanticContext {
    const packs = this.ctx.semantic.loaded()
    const packRefs = packs.map(pack => ({ packId: pack.packId, version: pack.version }))
    return createSemanticContext({
      snapshotId: 'explorer' as SemanticSnapshotId,
      packRefs,
      mappingVersion: 'explorer',
      groundingVersion: 'explorer',
      resolverVersions: {},
      createdBy: 'ontology-rpc',
    })
  }

  /** Aggregate manifest across admitted packs. */
  @Remote('manifest')
  manifest(request: OntologyManifestRequest): SemanticManifest {
    void request
    return this.ctx.semantic.manifest(this.defaultContext())
  }

  /** Browse lightweight object projections. */
  @Remote('browse')
  browse(request: SemanticBrowseRequest): SemanticBrowseResult {
    return this.ctx.semantic.browse(request, this.defaultContext())
  }

  /** Fetch one complete object by reference. */
  @Remote('get')
  get(request: OntologyObjectRequest): ObjectResolution {
    return this.ctx.semantic.get(requireObjectRef(request, 'get'), this.defaultContext())
  }

  /** Resolve an id or alias to a reference. */
  @Remote('resolve')
  resolve(request: SemanticResolveRequest): ResolutionResult {
    return this.ctx.semantic.resolve(request, this.defaultContext())
  }

  /** Traverse incoming/outgoing relations for a reference. */
  @Remote('relations')
  relations(request: OntologyObjectRequest): SemanticRelationResult {
    return this.ctx.semantic.relations(requireObjectRef(request, 'relations'), this.defaultContext())
  }

  /** Explain one object and its provenance. */
  @Remote('explain')
  explain(request: OntologyObjectRequest): SemanticExplanation {
    return this.ctx.semantic.explain(requireObjectRef(request, 'explain'), this.defaultContext())
  }

  /** List available ontology packs (both loaded and unloaded). */
  @Remote('listPacks')
  async listPacks(request: ListPacksRequest): Promise<ListPacksResponse> {
    void request
    // Get currently loaded packs
    const loadedPacks = this.ctx.semantic.loaded()
    const loadedIds = new Set(loadedPacks.map(p => p.packId))

    // TODO: In production, discover available packs from a registry or filesystem
    // For now, return loaded packs + known stage-1 packs
    const packs: PackInfo[] = loadedPacks.map(pack => ({
      packId: pack.packId,
      version: pack.version,
      displayName: pack.packId,
      description: `Loaded pack with ${pack.manifest.counts.concepts} concepts`,
      loaded: true,
    }))

    // Add known stage-1 packs that aren't loaded yet
    const stage1Packs: Array<{ packId: string; version: string; displayName: string }> = [
      { packId: 'nalinwei-instance', version: '0.1.0', displayName: '纳琳薇实例' },
      { packId: 'pe-dd-canonical', version: '1.0.0', displayName: 'PE 尽调标准本体' },
    ]

    for (const stage1 of stage1Packs) {
      if (!loadedIds.has(stage1.packId as PackId)) {
        packs.push({
          packId: stage1.packId,
          version: stage1.version,
          displayName: stage1.displayName,
          description: 'Available from .ontology-stage1/',
          loaded: false,
        })
      }
    }

    // Apply filter if provided
    if (request.filter) {
      const filter = request.filter.toLowerCase()
      return {
        packs: packs.filter(p =>
          p.packId.toLowerCase().includes(filter) ||
          p.displayName?.toLowerCase().includes(filter),
        ),
      }
    }

    return { packs }
  }

  /** Load and admit a specific ontology pack. */
  @Remote('loadPack')
  async loadPack(request: LoadPackRequest): Promise<LoadPackResponse> {
    try {
      // Check if already loaded
      const loaded = this.ctx.semantic.loaded()
      if (loaded.some(p => p.packId === request.packId)) {
        return {
          success: true,
          manifest: this.ctx.semantic.manifest(this.defaultContext()),
        }
      }

      // TODO: Implement actual pack loading from filesystem or registry
      // For now, this is a placeholder that will be implemented by the provider
      // The actual loading should be done through ctx.semantic.load()

      return {
        success: false,
        error: `Pack loading not yet implemented. Pack '${request.packId}' must be registered by a provider plugin.`,
      }
    } catch (error) {
      return {
        success: false,
        error: String(error),
      }
    }
  }
}

function requireObjectRef(request: OntologyObjectRequest, method: string): OntologyObjectRequest['ref'] {
  const ref = request?.ref
  if (ref === undefined || ref === null || typeof ref !== 'object'
    || typeof ref.type !== 'string' || typeof ref.id !== 'string') {
    throw new TypertGatewayError(
      'input-invalid',
      `ontology/${method}`,
      'request.ref requires string type and id',
      { field: 'request' },
    )
  }
  return ref
}

export default OntologyRpcService
