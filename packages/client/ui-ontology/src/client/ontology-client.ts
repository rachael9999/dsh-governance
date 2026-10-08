/**
 * Browser-side caller for the `ontology` Typert Remote.
 *
 * Talks directly to the Connection carrier (the SRC loose channel), mirroring
 * the gateway client's envelope: `connection.rpc.call('/api', 'ontology/<m>',
 * { args: { request } }, signal)`. No generated remotes are required for the
 * exploration build.
 */

import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type {
  ObjectResolution,
  ResolutionResult,
  SemanticBrowseRequest,
  SemanticBrowseResult,
  SemanticExplanation,
  SemanticManifest,
  SemanticObjectRef,
  SemanticRelationResult,
  SemanticResolveRequest,
} from '@deepseek-ai/dsh-semantic-core'
import type { ListPacksRequest, ListPacksResponse, LoadPackRequest, LoadPackResponse } from '@deepseek-ai/dsh-api-ontology-rpc'

/** Typed client over the six ontology Remote methods. */
export class OntologyClient {
  constructor(private readonly ctx: ClientContext) {}

  private async call<T>(method: string, request: unknown, signal?: AbortSignal): Promise<T> {
    const connection = this.ctx.get('connection') as ConnectionHandle | undefined
    if (connection === undefined) throw new Error('ontology client: connection is unavailable')
    const result = await connection.rpc.call('/api', `ontology/${method}`, { args: { request } }, signal)
    if (!result.ok) throw new Error(`ontology/${method} failed: ${JSON.stringify(result.error)}`)
    return result.value as T
  }

  /** Aggregate manifest across admitted packs. */
  manifest(signal?: AbortSignal): Promise<SemanticManifest> {
    return this.call<SemanticManifest>('manifest', {}, signal)
  }

  /** Browse lightweight object projections. */
  browse(request: SemanticBrowseRequest, signal?: AbortSignal): Promise<SemanticBrowseResult> {
    return this.call<SemanticBrowseResult>('browse', request, signal)
  }

  /** Fetch one complete object by reference. */
  get(ref: SemanticObjectRef, signal?: AbortSignal): Promise<ObjectResolution> {
    assertObjectRef(ref)
    return this.call<ObjectResolution>('get', { ref }, signal)
  }

  /** Resolve an id or alias to a reference. */
  resolve(request: SemanticResolveRequest, signal?: AbortSignal): Promise<ResolutionResult> {
    return this.call<ResolutionResult>('resolve', request, signal)
  }

  /** Traverse incoming/outgoing relations for a reference. */
  relations(ref: SemanticObjectRef, signal?: AbortSignal): Promise<SemanticRelationResult> {
    assertObjectRef(ref)
    return this.call<SemanticRelationResult>('relations', { ref }, signal)
  }

  /** Explain one object and its provenance. */
  explain(ref: SemanticObjectRef, signal?: AbortSignal): Promise<SemanticExplanation> {
    assertObjectRef(ref)
    return this.call<SemanticExplanation>('explain', { ref }, signal)
  }

  /** List available ontology packs. */
  async listPacks(request: ListPacksRequest = {}, signal?: AbortSignal): Promise<ListPacksResponse> {
    return this.call<ListPacksResponse>('listPacks', request, signal)
  }

  /** Load a specific ontology pack. */
  async loadPack(request: LoadPackRequest, signal?: AbortSignal): Promise<LoadPackResponse> {
    return this.call<LoadPackResponse>('loadPack', request, signal)
  }
}

function assertObjectRef(ref: SemanticObjectRef): void {
  if (ref === undefined || ref === null || typeof ref !== 'object'
    || typeof ref.type !== 'string' || typeof ref.id !== 'string') {
    throw new TypeError('ontology client: object reference requires string type and id')
  }
}
