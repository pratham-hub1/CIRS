import React from 'react';
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
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="flex flex-col items-center text-center py-2">
        <div
          className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform ${
            isDestructive
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
          }`}
        >
          {isDestructive ? (
            <AlertCircle className="w-6 h-6" />
          ) : (
            <AlertTriangle className="w-6 h-6" />
          )}
        </div>
        <p className="text-sm text-neutral-300 leading-relaxed mb-6 font-normal">{message}</p>

        <div className="flex items-center justify-end space-x-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 text-xs"
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={isDestructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            isLoading={isLoading}
            className="flex-1 text-xs font-medium"
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
