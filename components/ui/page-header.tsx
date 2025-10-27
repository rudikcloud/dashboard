import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
};

export function PageHeader({
  title,
  description,
  actions,
  meta,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__content">
        <h2 className="page-header__title">{title}</h2>
        {description ? <p className="page-header__description">{description}</p> : null}
        {meta ? <div className="page-header__meta">{meta}</div> : null}
      </div>

      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
