import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormField } from '../FormField';
import { runAxe } from '../../../test/axe';

describe('FormField accessibility', () => {
  it('associates its label with the control', () => {
    render(
      <FormField label="University Email" id="email">
        <input type="email" />
      </FormField>,
    );

    const input = screen.getByLabelText('University Email');
    expect(input).toHaveAttribute('id', 'email');
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('marks the control required and shows the asterisk when required', () => {
    render(
      <FormField label="Password" id="pwd" required>
        <input type="password" />
      </FormField>,
    );

    const input = screen.getByLabelText(/Password/);
    expect(input).toHaveAttribute('aria-required', 'true');
  });

  it('wires helper text through aria-describedby', () => {
    render(
      <FormField label="Email" id="email" helpText="Must end with @gsfcuniversity.ac.in">
        <input type="email" />
      </FormField>,
    );

    const input = screen.getByLabelText('Email');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent(
      '@gsfcuniversity.ac.in',
    );
  });

  it('sets aria-invalid and announces the error in an assertive live region', () => {
    render(
      <FormField label="Email" id="email" error="Enter a valid university email">
        <input type="email" />
      </FormField>,
    );

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');

    const describedBy = input.getAttribute('aria-describedby') as string;
    expect(describedBy).toBeTruthy();

    const error = document.getElementById(describedBy);
    expect(error).toHaveTextContent('Enter a valid university email');
    expect(error).toHaveAttribute('role', 'alert');
    expect(error).toHaveAttribute('aria-live', 'assertive');
  });

  it('has no detectable axe violations', async () => {
    const { container } = render(
      <FormField label="Email" id="email" helpText="Helper" error="Invalid">
        <input type="email" />
      </FormField>,
    );

    const results = await runAxe(container);
    expect(results.violations).toEqual([]);
  });
});
