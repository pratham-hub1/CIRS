import React, { useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FormFieldProps {
  /** Visible label text (may include markup). */
  label: React.ReactNode;
  /** A single form control (input / select / textarea) to wire up. */
  children: React.ReactElement;
  /** Explicit control id. Auto-generated when omitted. */
  id?: string;
  /** Marks the control required — adds the asterisk and `aria-required`. */
  required?: boolean;
  /** Validation message. Rendered in an assertive live region and linked via `aria-describedby`. */
  error?: string | null;
  /** Persistent helper text linked via `aria-describedby`. */
  helpText?: React.ReactNode;
  /** Decorative icon rendered inside the control shell (e.g. a leading mail icon). */
  leadingIcon?: React.ReactNode;
  /** Interactive adornment rendered inside the control shell (e.g. a password reveal toggle). */
  trailingAdornment?: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

/**
 * Accessible form field wrapper.
 *
 * Solves the four form-accessibility problems in one place:
 *  1. **Label association** — the `<label>` is bound to the control with
 *     matching `htmlFor` / `id` (auto-generated if not supplied).
 *  2. **aria-invalid** — set whenever an `error` is present.
 *  3. **aria-describedby** — points at the helper text and error message so
 *     screen readers read both when the control receives focus.
 *  4. **Live-region errors** — the error message is rendered with
 *     `role="alert"` / `aria-live="assertive"` so it is announced the moment it
 *     appears, without the user having to re-focus the field.
 */
export const FormField: React.FC<FormFieldProps> = ({
  label,
  children,
  id,
  required = false,
  error,
  helpText,
  leadingIcon,
  trailingAdornment,
  className,
  labelClassName,
}) => {
  const generatedId = useId();
  const controlId = id ?? `field-${generatedId}`;
  const helpId = helpText ? `${controlId}-help` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  const control = React.cloneElement(children as React.ReactElement<any>, {
    id: controlId,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': describedBy,
    'aria-required': required || undefined,
  });

  const hasShell = Boolean(leadingIcon || trailingAdornment);

  return (
    <div className={cn('w-full', className)}>
      <label
        htmlFor={controlId}
        className={cn(
          'block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5',
          labelClassName,
        )}
      >
        {label}
        {required && (
          <span className="text-rose-500" aria-hidden="true">
            {' *'}
          </span>
        )}
      </label>

      {hasShell ? (
        <div className="relative">
          {leadingIcon && (
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              {leadingIcon}
            </div>
          )}
          {control}
          {trailingAdornment && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center">
              {trailingAdornment}
            </div>
          )}
        </div>
      ) : (
        control
      )}

      {helpText && (
        <p id={helpId} className="mt-1.5 text-[11px] text-slate-400 font-normal">
          {helpText}
        </p>
      )}

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="assertive"
          className="mt-1.5 text-[11px] font-semibold text-rose-600 flex items-center gap-1"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};
