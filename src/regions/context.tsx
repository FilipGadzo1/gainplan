import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { RegionId } from '../types';
import type { Chain, Region } from './index';
import { DEFAULT_REGION, regionOf } from './registry';

interface RegionContextValue {
  region: Region;
  /** The chain being shopped. Sweden has one; Croatia has several. */
  chain: Chain;
}

/**
 * The active region, as context rather than a prop.
 *
 * `StoreLink` and `RecipeModal` need it and are rendered several layers down
 * from anything holding the profile, so passing it by hand would mean threading
 * a region through components that have no other use for one. Pure functions —
 * the planner, the shopping list — still take their region as an argument; only
 * components read it from here.
 */
const RegionContext = createContext<RegionContextValue>({
  region: regionOf(DEFAULT_REGION),
  chain: regionOf(DEFAULT_REGION).chains[0],
});

export function RegionProvider({
  regionId,
  chainId,
  children,
}: {
  regionId: RegionId;
  /** Unset, or naming a chain this region does not have, falls back to its first. */
  chainId?: string;
  children: ReactNode;
}) {
  const value = useMemo(() => {
    const region = regionOf(regionId);
    return {
      region,
      chain: region.chains.find((c) => c.id === chainId) ?? region.chains[0],
    };
  }, [regionId, chainId]);

  return <RegionContext.Provider value={value}>{children}</RegionContext.Provider>;
}

export function useRegion(): RegionContextValue {
  return useContext(RegionContext);
}
