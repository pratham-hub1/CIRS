import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileUpload } from '../FileUpload';
import { runAxe } from '../../../test/axe';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('FileUpload accessibility', () => {
  it('associates its visible label with the file input', () => {
    render(<FileUpload onUploadSuccess={() => {}} label="Upload Clear Photographs" />);

    const input = screen.getByLabelText('Upload Clear Photographs');
    expect(input).toBeInstanceOf(HTMLInputElement);
    expect(input).toHaveAttribute('type', 'file');
  });

  it('exposes the drop zone as a keyboard-operable button', async () => {
    const user = userEvent.setup();
    const clickSpy = vi
      .spyOn(HTMLInputElement.prototype, 'click')
      .mockImplementation(() => undefined);

    render(<FileUpload onUploadSuccess={() => {}} label="Upload" />);

    const dropzone = screen.getByRole('button', { name: /click to upload/i });
    dropzone.focus();
    await user.keyboard('{Enter}');

    expect(clickSpy).toHaveBeenCalled();
  });

  it('has no detectable axe violations', async () => {
    const { container } = render(<FileUpload onUploadSuccess={() => {}} label="Upload" />);
    const results = await runAxe(container);
    expect(results.violations).toEqual([]);
  });
});
