import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onCancel, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="dialog-overlay" role="presentation">
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <div className="dialog__header">
          <div className="dialog__icon" aria-hidden>
            <AlertTriangle size={18} />
          </div>
          <h3 id="confirm-dialog-title">{title}</h3>
        </div>
        <p id="confirm-dialog-description">{description}</p>
        <div className="dialog__actions">
          <button type="button" className="button button-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`button${destructive ? " button-danger" : ""}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
