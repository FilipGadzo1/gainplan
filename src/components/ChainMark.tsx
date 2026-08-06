/**
 * A small coloured mark identifying a supermarket chain.
 *
 * These are deliberately *not* reproductions of the chains' logos. Drawing an
 * approximation of someone's trademark and passing it off as their logo is
 * worse than not showing one — it gets details wrong and implies an
 * association that does not exist. What these do instead is take each chain's
 * own signature colour, which is the part people actually recognise at a
 * glance, and set the chain's initial in the app's own type.
 *
 * Konzum and Kaufland are both red in reality, which would defeat the purpose
 * sitting side by side in a picker, so Kaufland takes the blue from the bar
 * under its wordmark. It stays recognisably Kaufland and stays distinguishable.
 */
const MARKS: Record<string, { bg: string; fg: string; initial: string }> = {
  ica: { bg: '#e2001a', fg: '#ffffff', initial: 'I' },
  konzum: { bg: '#e30613', fg: '#ffffff', initial: 'K' },
  kaufland: { bg: '#003d7d', fg: '#ffffff', initial: 'K' },
};

/** Falls back to the app's own muted chrome for a chain with no mark yet. */
const FALLBACK = { bg: 'var(--color-raised)', fg: 'var(--color-muted)', initial: '?' };

export default function ChainMark({
  chainId,
  name,
  className = '',
}: {
  chainId: string;
  /** Used for the accessible name, since the initial alone says little. */
  name: string;
  className?: string;
}) {
  const mark = MARKS[chainId] ?? { ...FALLBACK, initial: name.slice(0, 1).toUpperCase() };

  return (
    <span
      role="img"
      aria-label={name}
      style={{ background: mark.bg, color: mark.fg }}
      className={`inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] text-[9px] leading-none font-bold select-none ${className}`}
    >
      {mark.initial}
    </span>
  );
}
