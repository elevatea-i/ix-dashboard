import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
}

interface ToastContextType {
  showToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              layout
              className="pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded border border-elevated-gold bg-light-ivory/85 dark:bg-enchanted-green/85 backdrop-blur-md text-enchanted-green dark:text-light-ivory shadow-lg"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-elevated-gold/15 dark:bg-light-ivory/10 flex items-center justify-center text-elevated-gold dark:text-elevated-gold">
                  <Check size={14} strokeWidth={3} />
                </div>
                <span className="text-sm font-medium leading-normal truncate">{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-rocky-gray hover:text-cranberry dark:hover:text-cranberry transition-colors p-1 rounded hover:bg-black/5 dark:hover:bg-white/5"
                title="Cerrar"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
