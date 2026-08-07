/**
 * A supermarket chain's own logo, used to identify the shop you are buying
 * from. Files live in public/icons and are served as static assets rather than
 * bundled, so adding a chain is a file and a line here.
 *
 * These replaced hand-drawn colour badges. Approximating someone's trademark
 * gets the details wrong; using the real mark to name the real shop does not.
 *
 * A chain with no file falls back to its initial on the app's own chrome, so a
 * new chain is never blocked on artwork.
 */
const LOGOS: Record<string, string> = {
  ica: '/icons/ica_icon.webp',
  konzum: '/icons/konzum_icon.png',
  kaufland: '/icons/kaufland_icon.webp',
};

export default function ChainMark({
  chainId,
  name,
  className = '',
}: {
  chainId: string;
  /** The accessible name. The logo alone does not read aloud. */
  name: string;
  className?: string;
}) {
  const src = LOGOS[chainId];

  if (!src) {
    return (
      <span
        role="img"
        aria-label={name}
        className={`inline-flex size-4 shrink-0 items-center justify-center rounded-[3px] bg-[var(--color-raised)] text-[9px] leading-none font-bold text-[var(--color-muted)] select-none ${className}`}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      width={16}
      height={16}
      loading="lazy"
      decoding="async"
      // Several of these logos are drawn on white or near-white, which floats
      // as a bright tile on a dark interface. The rounded corner and the hairline
      // give it an edge to sit against instead.
      className={`inline-block size-4 shrink-0 rounded-[3px] border border-[var(--color-line)] object-contain ${className}`}
    />
  );
}
