/**
 * Client plugin body: registers the read-only ontology explorer as a
 * Conversation view tab (beside Chat / Trajectory), order 20.
 * @module @deepseek-ai/dsh-client-ui-ontology/client
 */

import type { Context } from '@deepseek-ai/cordis'
import type { SessionId } from '@deepseek-ai/dsh-client-runtime/client'
// Type-only: pulls the locale plugin's Context merge (ctx.locale).
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: the 'conversation.view' SlotMap row (declared by the slot's
// owning package) must be in the program for the register calls to type.
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { en, NS, zh } from './locales.ts'
import { OntologyApp, type OntologyInjected } from './OntologyApp.tsx'
import { OntologyClient } from './ontology-client.ts'

export type { OntologyInjected } from './OntologyApp.tsx'

/** Required services: the slot registry, the Connection carrier, and the locale service. */
export const inject = ['slots', 'connection', 'locale']

/**
 * Register the ontology view tab.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'ui-ontology: dictionaries')

  const t = ctx.locale.bind(NS)
  const client = new OntologyClient(ctx)

  ctx.slots.inject('conversation.view', () => ctx.slots.register({
    name: 'conversation.view',
    id: 'ontology',
    order: 20,
    locale: NS,
    label: () => t('view.ontology'),
    inject: (_sessionId: SessionId): OntologyInjected => ({ client }),
  }, OntologyApp))
}
