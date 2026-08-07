import { describe, expect, it } from 'vitest';
import { AE_CHAINS, LULU, UNION_COOP } from './chains';

/**
 * These assert the parameter names taken from each site, checked live. They
 * cannot prove the search works — only the site does that — but they stop the
 * shape being changed by accident, which is the failure that hurts here: both
 * sites answer 200 for a parameter they do not understand.
 */
describe('the UAE chains', () => {
  it('sends Union Coop q at its Magento search path', () => {
    const url = new URL(UNION_COOP.searchUrl!('chicken breast'));
    expect(url.hostname).toBe('www.unioncoop.ae');
    expect(url.pathname).toBe('/catalogsearch/result/');
    expect(url.searchParams.get('q')).toBe('chicken breast');
  });

  it('sends Lulu search_text, not q', () => {
    // Lulu's search is client-rendered and every guessable path 404s. This URL
    // is the one Lulu publishes in its own schema.org SearchAction, and `q`
    // does nothing there.
    const url = new URL(LULU.searchUrl!('salmon'));
    expect(url.hostname).toBe('gcc.luluhypermarket.com');
    expect(url.pathname).toBe('/en-ae/list/');
    expect(url.searchParams.get('search_text')).toBe('salmon');
    expect(url.searchParams.get('q')).toBeNull();
  });

  it('leads with the chain whose search can be verified', () => {
    // Union Coop renders results server-side, so its result count is countable
    // and the storeQuery overrides in ./ingredients.ts were checked against it.
    expect(AE_CHAINS[0].id).toBe('unioncoop');
    expect(AE_CHAINS.map((c) => c.id)).toEqual(['unioncoop', 'lulu']);
  });

  it('escapes a term that would otherwise break the URL', () => {
    for (const chain of AE_CHAINS) {
      const url = new URL(chain.searchUrl!('labneh & za’atar 100%'));
      expect(url.protocol, chain.id).toBe('https:');
      expect(url.href, chain.id).toContain(encodeURIComponent('labneh & za’atar 100%'));
    }
  });
});
