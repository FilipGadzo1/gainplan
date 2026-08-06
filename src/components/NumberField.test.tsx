import { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { NumberField } from './ui';

afterEach(cleanup);

/** Mirrors how SetupPanel wires the field: controlled, with a clamped range. */
function Harness({
  min,
  max,
  initial = 30,
  allowEmpty = false,
}: {
  min: number;
  max: number;
  initial?: number | null;
  allowEmpty?: boolean;
}) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <>
      <NumberField
        value={value}
        min={min}
        max={max}
        allowEmpty={allowEmpty}
        onChange={(v) => setValue(allowEmpty ? v : (v ?? value))}
      />
      <output data-testid="value">{value === null ? 'null' : value}</output>
    </>
  );
}

const field = () => screen.getByRole('spinbutton') as HTMLInputElement;
/** What the input currently shows — including mid-edit text. */
const shown = () => field().value;
/** What the parent component has actually been told. */
const committed = () => screen.getByTestId('value').textContent;

describe('NumberField', () => {
  it('lets you type a number whose first digit is below the minimum', async () => {
    // The original bug: with min 14, pressing "2" on the way to "28" snapped
    // straight to 14, so a two-digit number was unreachable.
    const user = userEvent.setup();
    render(<Harness min={14} max={90} />);

    await user.clear(field());
    await user.type(field(), '28');

    expect(shown()).toBe('28');
    expect(committed()).toBe('28');
  });

  it('lets you clear the field without it snapping to the minimum', async () => {
    const user = userEvent.setup();
    render(<Harness min={130} max={230} initial={180} />);

    await user.clear(field());

    expect(shown()).toBe('');
    // Nothing out of range was pushed upstream while the field sat empty.
    expect(committed()).toBe('180');
  });

  it('keeps the last good value when you blur a cleared required field', async () => {
    const user = userEvent.setup();
    render(<Harness min={35} max={200} initial={80} />);

    await user.clear(field());
    await user.tab();

    expect(committed()).toBe('80');
    expect(shown()).toBe('80');
  });

  it('clamps out-of-range input on blur, not while typing', async () => {
    const user = userEvent.setup();
    render(<Harness min={14} max={90} />);

    await user.clear(field());
    await user.type(field(), '7');
    expect(shown()).toBe('7'); // still mid-edit, left alone

    await user.tab();
    expect(shown()).toBe('14');
    expect(committed()).toBe('14');
  });

  it('clamps values above the maximum on blur', async () => {
    const user = userEvent.setup();
    render(<Harness min={14} max={90} />);

    await user.clear(field());
    await user.type(field(), '250');
    await user.tab();

    expect(committed()).toBe('90');
  });

  it('accepts a decimal typed one character at a time', async () => {
    const user = userEvent.setup();
    render(<Harness min={35} max={200} initial={80} />);

    await user.clear(field());
    await user.type(field(), '82.5');
    await user.tab();

    expect(committed()).toBe('82.5');
  });

  it('reports null for an empty optional field, and recovers when refilled', async () => {
    const user = userEvent.setup();
    render(<Harness min={800} max={8000} initial={null} allowEmpty />);

    expect(committed()).toBe('null');

    await user.type(field(), '3200');
    expect(committed()).toBe('3200');

    await user.clear(field());
    await user.tab();
    expect(committed()).toBe('null');
  });

  it('commits on Enter as well as on blur', async () => {
    const user = userEvent.setup();
    render(<Harness min={14} max={90} />);

    await user.clear(field());
    await user.type(field(), '9{Enter}');

    expect(committed()).toBe('14');
  });

  it('shows the committed value again after editing finishes', async () => {
    const user = userEvent.setup();
    render(<Harness min={14} max={90} initial={30} />);

    await user.clear(field());
    await user.type(field(), '45');
    await user.tab();

    expect(shown()).toBe('45');
    expect(committed()).toBe('45');
  });
});
