/**
 * Wire request/response types for the ontology Remote.
 *
 * These reuse the semantic-core vocabulary directly — no secondary modeling.
 * Every client call travels as `{ args: { request } }`, matching the single
 * `request` parameter each Remote method declares.
 */

export type * from '@deepseek-ai/dsh-semantic-core'

import type { SemanticObjectRef } from '@deepseek-ai/dsh-semantic-core'

/** Request shared by operations that address one semantic object. */
export interface OntologyObjectRequest {
  /** Complete object reference returned by browse or resolve. */
  ref: SemanticObjectRef
}

/**
 * Optional hint carried by `ontology/manifest`.
 * Reserved for future session-pinned snapshot scoping; the MVP ignores it and
 * aggregates across every pack the semantic service has admitted.
 */
export interface OntologyManifestRequest {
  /** Optional snapshot id to scope the read (reserved). */
  snapshotId?: string
}

/** Information about an available ontology pack. */
export interface PackInfo {
  /** Pack identifier (e.g., 'pe-dd-canonical', 'nalinwei-instance'). */
  packId: string
  /** Pack version string. */
  version: string
  /** Human-readable display name. */
  displayName?: string
  /** Optional description. */
  description?: string
  /** Whether this pack is currently loaded/admitted. */
  loaded: boolean
}

/** Request for listing available packs. */
export interface ListPacksRequest {
  /** Optional filter by packId prefix. */
  filter?: string
}

/** Response from listPacks. */
export interface ListPacksResponse {
  /** List of available packs. */
  packs: PackInfo[]
}

/** Request to load a specific pack. */
export interface LoadPackRequest {
  /** Pack identifier to load. */
  packId: string
  /** Optional version (defaults to latest). */
  version?: string
}

/** Response from loadPack. */
export interface LoadPackResponse {
  /** Whether the pack was successfully loaded. */
  success: boolean
  /** Error message if loading failed. */
  error?: string
  /** Updated manifest after loading. */
  manifest?: import('@deepseek-ai/dsh-semantic-core').SemanticManifest
}
