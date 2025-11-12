import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
  eyebrow?: string;
  icon?: ReactNode;
};

export function PageHeader({
  title,
  description,
  actions,
  meta,
  eyebrow,
  icon,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__content">
        {eyebrow ? <p className="page-header__eyebrow">{eyebrow}</p> : null}

        <div className="page-header__title-row">
          {icon ? <span className="page-header__icon">{icon}</span> : null}
          <h2 className="page-header__title">{title}</h2>
        </div>

        {description ? <p className="page-header__description">{description}</p> : null}
        {meta ? <div className="page-header__meta">{meta}</div> : null}
      </div>

      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
