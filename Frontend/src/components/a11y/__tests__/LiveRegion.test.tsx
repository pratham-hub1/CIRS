import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveRegion } from '../LiveRegion';

describe('LiveRegion', () => {
  it('renders a polite status region by default', () => {
    render(<LiveRegion message="Report saved" />);
    const region = screen.getByRole('status');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('aria-atomic', 'true');
    expect(region).toHaveTextContent('Report saved');
  });

  it('renders an assertive alert region when requested', () => {
    render(<LiveRegion message="Something failed" politeness="assertive" />);
    const region = screen.getByRole('alert');
    expect(region).toHaveAttribute('aria-live', 'assertive');
    expect(region).toHaveTextContent('Something failed');
  });
});
