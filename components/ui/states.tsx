import { AlertCircle, Inbox, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";

type LoadingSkeletonProps = {
  lines?: number;
  title?: string;
};

export function LoadingSkeleton({
  lines = 4,
  title = "Loading",
}: LoadingSkeletonProps) {
  return (
    <div className="state-card" role="status" aria-live="polite">
      <div className="state-card__title">
        <LoaderCircle size={18} className="spin" aria-hidden />
        <span>{title}</span>
      </div>
      <div className="skeleton-lines">
        {Array.from({ length: lines }).map((_, index) => (
          <span key={index} className="skeleton-line" />
        ))}
      </div>
    </div>
  );
}

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="state-card state-card-empty" role="status" aria-live="polite">
      <Inbox size={30} aria-hidden />
      <h3>{title}</h3>
      <p>{description}</p>
      {action ? <div className="state-card__actions">{action}</div> : null}
    </div>
  );
}

type ErrorStateProps = {
  title?: string;
  message: string;
  action?: ReactNode;
};

export function ErrorState({
  title = "Something went wrong",
  message,
  action,
}: ErrorStateProps) {
  return (
    <div className="state-card state-card-error" role="alert">
      <div className="state-card__title">
        <AlertCircle size={18} aria-hidden />
        <span>{title}</span>
      </div>
      <p>{message}</p>
      {action ? <div className="state-card__actions">{action}</div> : null}
    </div>
  );
}
