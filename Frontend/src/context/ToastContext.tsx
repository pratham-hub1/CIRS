import React, { createContext, useContext, useCallback } from 'react';
import { Toaster, toast } from 'sonner';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (type === 'success') {
      toast.success(message);
    } else if (type === 'error') {
      toast.error(message);
    } else {
      toast.info(message);
    }
  }, []);

  const success = useCallback((message: string) => toast.success(message), []);
  const error = useCallback((message: string) => toast.error(message), []);
  const info = useCallback((message: string) => toast.info(message), []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info }}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={false}
        duration={3500}
        theme="dark"
        toastOptions={{
          style: {
            borderRadius: '0.875rem',
            backgroundColor: '#12151D',
            color: '#FFFFFF',
            boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            fontFamily: 'inherit',
          },
        }}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export { toast };
