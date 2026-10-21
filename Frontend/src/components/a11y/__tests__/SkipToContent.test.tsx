import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SkipToContent } from '../SkipToContent';
import { runAxe } from '../../../test/axe';

describe('SkipToContent', () => {
  it('renders an in-page link that points at the main landmark', () => {
    render(<SkipToContent targetId="main-content" />);

    const link = screen.getByRole('link', { name: 'Skip to main content' });
    expect(link).toHaveAttribute('href', '#main-content');
  });

  it('supports a custom target and label', () => {
    render(<SkipToContent targetId="content" label="Jump to content" />);
    const link = screen.getByRole('link', { name: 'Jump to content' });
    expect(link).toHaveAttribute('href', '#content');
  });

  it('has no detectable axe violations', async () => {
    const { container } = render(<SkipToContent />);
    const results = await runAxe(container);
    expect(results.violations).toEqual([]);
  });
});
