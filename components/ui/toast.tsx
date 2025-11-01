"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ToastVariant = "success" | "error";

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastRecord = ToastInput & {
  id: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((previous) => previous.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (input: ToastInput) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const record: ToastRecord = {
        id,
        title: input.title,
        description: input.description,
        variant: input.variant ?? "success",
      };

      setToasts((previous) => [...previous, record]);
      window.setTimeout(() => {
        removeToast(id);
      }, 3600);
    },
    [removeToast],
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.variant}`}>
            <div className="toast__icon" aria-hidden>
              {toast.variant === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <CircleAlert size={16} />
              )}
            </div>
            <div className="toast__content">
              <p className="toast__title">{toast.title}</p>
              {toast.description ? <p className="toast__description">{toast.description}</p> : null}
            </div>
            <button
              type="button"
              className="toast__close"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
