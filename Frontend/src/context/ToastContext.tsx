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
        duration={4200}
        theme="light"
        toastOptions={{
          style: {
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.08)',
            border: '1px solid #e2e8f0',
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
