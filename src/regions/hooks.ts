import type { Chain, Region } from './index';
import { SWEDEN } from './se';

/**
 * The region the app is currently shopping in, and the chain within it.
 *
 * Sweden is the only region and ICA its only chain, so this is a constant
 * today. It exists as a hook rather than a bare import so that adding Croatia
 * means changing this file and nothing else — every consumer already asks
 * "which region?" instead of assuming.
 */
export function useRegion(): { region: Region; chain: Chain } {
  return { region: SWEDEN, chain: SWEDEN.chains[0] };
}
