import type { RegionId } from '../types';
import type { Region } from './index';
import { SWEDEN } from './se';

/**
 * Every region, by id. This lives apart from ./index so the region files can
 * import `assertRegion` from there without the two forming a cycle — a cycle
 * would leave REGIONS holding `undefined` depending on which module the bundler
 * happened to evaluate first, and that failure is invisible until runtime.
 *
 * Adding a region is one import and one entry.
 */
export const REGIONS: Record<RegionId, Region> = { se: SWEDEN };

export const DEFAULT_REGION: RegionId = 'se';

/**
 * The region for a stored id. Falls back to the default rather than throwing: a
 * profile restored from localStorage can name a region this build does not have
 * — written by an older or newer version of the app — and losing someone's body
 * stats over it would be a poor trade.
 */
export function regionOf(id: RegionId): Region {
  return REGIONS[id] ?? REGIONS[DEFAULT_REGION];
}
