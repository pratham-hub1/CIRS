import React, { useId } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  isLoading = false,
}) => {
  const messageId = useId();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="sm"
      describedById={messageId}
      closeLabel="Close confirmation dialog"
    >
      <div className="flex flex-col items-center text-center py-2">
        <div
          aria-hidden="true"
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform shadow-subtle ${
            isDestructive
              ? 'bg-rose-50 border border-rose-200 text-rose-600'
              : 'bg-amber-50 border border-amber-200 text-amber-600'
          }`}
        >
          {isDestructive ? (
            <AlertCircle className="w-7 h-7" />
          ) : (
            <AlertTriangle className="w-7 h-7" />
          )}
        </div>
        <p id={messageId} className="text-sm text-slate-600 leading-relaxed mb-6 font-normal">
          {message}
        </p>

        <div className="flex items-center justify-end space-x-3 w-full">
          {/* Cancel is rendered first so it receives initial focus — the safe
              default for a destructive confirmation. */}
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
