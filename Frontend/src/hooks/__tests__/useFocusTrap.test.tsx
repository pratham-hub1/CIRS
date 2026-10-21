import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFocusTrap } from '../useFocusTrap';

function Trap({ active }: { active: boolean }) {
  const ref = useFocusTrap<HTMLDivElement>(active);
  return (
    <div ref={ref} tabIndex={-1} data-testid="trap">
      <button type="button">One</button>
      <button type="button">Two</button>
    </div>
  );
}

function Harness() {
  const [active, setActive] = React.useState(false);
  return (
    <>
      <button type="button" onClick={() => setActive(true)}>
        Activate
      </button>
      <button type="button" onClick={() => setActive(false)}>
        Deactivate
      </button>
      <Trap active={active} />
    </>
  );
}

describe('useFocusTrap', () => {
  it('moves focus to the first focusable element when activated', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Activate' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'One' })).toHaveFocus());
  });

  it('wraps Tab focus at the boundaries', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.click(screen.getByRole('button', { name: 'Activate' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'One' })).toHaveFocus());

    // Shift+Tab from the first element wraps to the last.
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Two' })).toHaveFocus();

    // Tab from the last element wraps back to the first.
    await user.tab();
    expect(screen.getByRole('button', { name: 'One' })).toHaveFocus();
  });

  it('restores focus to the previously focused element when deactivated', async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const activate = screen.getByRole('button', { name: 'Activate' });
    await user.click(activate);
    await waitFor(() => expect(screen.getByRole('button', { name: 'One' })).toHaveFocus());

    await user.click(screen.getByRole('button', { name: 'Deactivate' }));
    await waitFor(() => expect(activate).toHaveFocus());
  });
});
