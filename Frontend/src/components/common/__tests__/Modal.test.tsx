import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Modal } from '../Modal';
import { runAxe } from '../../../test/axe';

describe('Modal accessibility', () => {
  it('exposes dialog semantics and is named by its title', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Confirm deletion">
        <p>Body</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Confirm deletion');
  });

  it('links its description with aria-describedby when provided', () => {
    render(
      <Modal isOpen onClose={() => {}} title="Title" description="Dangerous action">
        <p>Body</p>
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent('Dangerous action');
  });

  it('moves focus into the dialog on open and restores it to the trigger on close', async () => {
    function Harness() {
      const [open, setOpen] = React.useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open dialog
          </button>
          <Modal isOpen={open} onClose={() => setOpen(false)} title="Focus test">
            <button type="button">Inside</button>
          </Modal>
        </>
      );
    }

    const user = userEvent.setup();
    render(<Harness />);

    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog');
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });

    await user.keyboard('{Escape}');

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('closes on Escape', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={onClose} title="Escape test">
        <p>Body</p>
      </Modal>,
    );

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('traps Tab focus within the dialog, wrapping at the boundaries', async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={() => {}} title="Trap test">
        <button type="button">First</button>
        <button type="button">Last</button>
      </Modal>,
    );

    const closeButton = screen.getByRole('button', { name: 'Close dialog' });

    // Initial focus lands on the first focusable element (the close button).
    await waitFor(() => expect(closeButton).toHaveFocus());

    // Shift+Tab from the first element wraps to the last.
    await user.tab({ shift: true });
    expect(screen.getByRole('button', { name: 'Last' })).toHaveFocus();

    // Tab from the last element wraps back to the first.
    await user.tab();
    expect(closeButton).toHaveFocus();
  });

  it('has no detectable axe violations', async () => {
    const { container } = render(
      <Modal isOpen onClose={() => {}} title="Accessible modal" description="Described dialog">
        <button type="button">Acknowledge</button>
      </Modal>,
    );

    const results = await runAxe(container);
    expect(results.violations).toEqual([]);
  });
});
