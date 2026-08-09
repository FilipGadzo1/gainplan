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
  step,
}: {
  min: number;
  max: number;
  initial?: number | null;
  allowEmpty?: boolean;
  step?: number;
}) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <>
      <NumberField
        value={value}
        min={min}
        max={max}
        step={step}
        allowEmpty={allowEmpty}
        onChange={(v) => setValue(allowEmpty ? v : (v ?? value))}
      />
      <output data-testid="value">{value === null ? 'null' : value}</output>
    </>
  );
}

/**
 * A textbox, not a spinbutton: this is a text input with `inputMode="decimal"`
 * rather than `type="number"` — see the note on NumberField for why.
 */
const field = () => screen.getByRole('textbox') as HTMLInputElement;
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

  it('holds at the maximum as you type, without waiting for blur', async () => {
    const user = userEvent.setup();
    render(<Harness min={14} max={90} />);

    await user.clear(field());
    await user.type(field(), '250');

    // No number can be rescued by typing more of it once it is over the
    // ceiling, so there is nothing to wait for.
    expect(shown()).toBe('90');
    expect(committed()).toBe('90');
  });

  it('never shows a number the parent has not been told', async () => {
    const user = userEvent.setup();
    render(<Harness min={14} max={90} />);

    await user.clear(field());
    // The regression this guards: "5" committed nothing, "50" committed 50,
    // and "500" was rejected — leaving the field reading 500 while the app
    // held 50, right up until something happened to blur it.
    await user.type(field(), '500');

    expect(shown()).toBe('90');
    expect(committed()).toBe('90');
  });

  it('still clamps a too-small number on blur rather than while typing', async () => {
    const user = userEvent.setup();
    render(<Harness min={14} max={90} />);

    await user.clear(field());
    await user.type(field(), '9');
    expect(shown()).toBe('9'); // could still be on its way to 90

    await user.tab();
    expect(committed()).toBe('14');
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

  it('takes a comma as the decimal separator', async () => {
    const user = userEvent.setup();
    render(<Harness min={35} max={200} initial={80} />);

    // Swedish and Croatian both write 82,5. Under `type="number"` the browser
    // handed back an empty string the moment the comma landed, so this was
    // simply not enterable in either of the app's two non-English languages.
    await user.clear(field());
    await user.type(field(), '82,5');
    await user.tab();

    expect(committed()).toBe('82.5');
  });

  it('does not offer the browser spinner it used to', () => {
    render(<Harness min={14} max={90} />);

    // The arrows are gone because the input is no longer type="number"; if it
    // reverts, this field answers to the spinbutton role again.
    expect(field().getAttribute('type')).not.toBe('number');
    expect(screen.queryByRole('spinbutton')).toBeNull();
  });

  it('steps with the arrow keys, which is the part of the spinner worth keeping', async () => {
    const user = userEvent.setup();
    render(<Harness min={35} max={200} initial={80} step={0.5} />);

    await user.click(field());
    await user.keyboard('{ArrowUp}');
    expect(committed()).toBe('80.5');

    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(committed()).toBe('79.5');
  });

  it('holds the step precision instead of drifting into binary fractions', async () => {
    const user = userEvent.setup();
    render(<Harness min={0.15} max={0.45} initial={0.27} step={0.01} />);

    await user.click(field());
    await user.keyboard('{ArrowUp}');

    // 0.27 + 0.01 is 0.28000000000000003 before rounding.
    expect(committed()).toBe('0.28');
  });

  it('will not step past the range', async () => {
    const user = userEvent.setup();
    render(<Harness min={14} max={90} initial={90} />);

    await user.click(field());
    await user.keyboard('{ArrowUp}');

    expect(committed()).toBe('90');
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
