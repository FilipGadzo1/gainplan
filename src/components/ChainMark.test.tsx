import { existsSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { REGIONS } from '../regions/registry';
import ChainMark from './ChainMark';

afterEach(cleanup);

const allChains = Object.values(REGIONS).flatMap((r) => r.chains);

describe('ChainMark', () => {
  /**
   * A logo path that does not resolve renders as a broken image and nothing
   * complains — no console error, no failing render, just a gap in the header.
   * This is the only thing standing between a renamed file and that gap.
   */
  it.each(allChains.map((c) => [c.id, c.name] as const))(
    '%s has a logo file that exists on disk',
    (id, name) => {
      render(<ChainMark chainId={id} name={name} />);
      const img = screen.getByRole('img', { name });
      const src = img.getAttribute('src');

      // The fallback renders a <span>, not an <img>, so reaching here at all
      // means a path was claimed. It has to point at something.
      expect(src, `${id} fell back instead of using a logo`).toBeTruthy();
      expect(existsSync(`public${src}`), `public${src} is missing`).toBe(true);
    },
  );

  it('names the shop, since a logo does not read aloud', () => {
    render(<ChainMark chainId="konzum" name="Konzum" />);
    expect(screen.getByRole('img', { name: 'Konzum' })).toBeTruthy();
  });

  it('falls back to an initial rather than a broken image', () => {
    render(<ChainMark chainId="nonesuch" name="Netto" />);
    const mark = screen.getByRole('img', { name: 'Netto' });

    expect(mark.tagName).toBe('SPAN');
    expect(mark.textContent).toBe('N');
  });
});
