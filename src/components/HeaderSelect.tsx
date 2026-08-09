import { useId, useRef, useState, type ReactNode } from 'react';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';

export interface HeaderSelectOption<T extends string> {
  value: T;
  label: string;
  /** Flag or letter mark, shown before the label. Decorative — keep it aria-hidden. */
  icon?: ReactNode;
}

/**
 * The two dropdowns in the header — country and language — as one control.
 *
 * They were the same widget written twice: roving focus through an `optionRefs`
 * array, Escape, outside-click, ArrowUp/ArrowDown and Home/End, about a hundred
 * lines each and identical but for what they listed. All of that now comes from
 * MUI: `Popover` handles dismissal, the portal and returning focus to the
 * trigger; `MenuList` handles arrow keys, Home/End and focusing the selected
 * item on open.
 *
 * What is deliberately *not* MUI is the trigger. `Select` renders its own
 * combobox, which would replace a plain `<button>` — the thing the header's
 * compact styling and every existing test are built on. So the button stays
 * ours and only the menu is borrowed, which keeps the button/listbox/option
 * shape the app already exposed.
 */
export default function HeaderSelect<T extends string>({
  label,
  value,
  options,
  onSelect,
  trigger,
  menuWidth = '12rem',
}: {
  /** Names the trigger and heads the open menu. */
  label: string;
  value: T;
  options: HeaderSelectOption<T>[];
  onSelect: (value: T) => void;
  /** Trigger contents, minus the caret. Each control draws its own mark. */
  trigger: ReactNode;
  menuWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  const close = () => setOpen(false);

  return (
    <div className="no-print">
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] bg-[var(--color-raised)] px-2 py-1.5 text-xs font-semibold text-[var(--color-muted)] transition-colors pointer-coarse:min-h-11 pointer-coarse:px-3 hover:border-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        {trigger}
        <span aria-hidden className="text-[0.6rem] leading-none">
          ▾
        </span>
      </button>

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={close}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        // A dropdown this size has no business locking the page. Modal's
        // default also compensates for the vanished scrollbar by padding the
        // body, which shifts the whole layout sideways on every open.
        disableScrollLock
        slotProps={{
          paper: {
            sx: {
              mt: 0.5,
              minWidth: menuWidth,
              overflow: 'hidden',
              borderRadius: '0.5rem',
            },
          },
        }}
      >
        {/*
          Outside the listbox, not inside it: a listbox may only contain options
          and groups, so a heading in there is invalid and screen readers are
          entitled to skip or mangle it.
        */}
        <p className="border-b border-[var(--color-line)] px-3 py-1.5 text-[10px] font-bold tracking-[0.08em] text-[var(--color-muted)] uppercase">
          {label}
        </p>

        <MenuList
          id={menuId}
          role="listbox"
          aria-label={label}
          // Opens with the current value focused, so the menu is usable from
          // the keyboard without tabbing into it.
          autoFocusItem={open}
          variant="selectedMenu"
          sx={{ py: 0.5 }}
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <MenuItem
                key={o.value}
                role="option"
                selected={active}
                aria-selected={active}
                onClick={() => {
                  onSelect(o.value);
                  close();
                }}
                // MenuItem is built for 48px rows. This header is built out of
                // 11px controls, so the density has to be put back by hand.
                sx={{
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  minHeight: 0,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: active ? 'var(--color-accent)' : 'var(--color-muted)',
                  backgroundColor: active ? 'color-mix(in srgb, var(--color-accent) 12%, transparent)' : undefined,
                  '@media (pointer: coarse)': { minHeight: '2.75rem' },
                  '&.Mui-selected': {
                    backgroundColor: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                  },
                  '&:hover, &.Mui-selected:hover, &.Mui-focusVisible': {
                    backgroundColor: 'var(--color-raised)',
                    color: active ? 'var(--color-accent)' : 'var(--color-text)',
                  },
                }}
              >
                {o.icon}
                {o.label}
              </MenuItem>
            );
          })}
        </MenuList>
      </Popover>
    </div>
  );
}
