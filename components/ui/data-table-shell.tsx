import type { ReactNode } from "react";

type DataTableShellProps = {
  title: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  pagination?: ReactNode;
  children: ReactNode;
};

export function DataTableShell({
  title,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search",
  filters,
  pagination,
  children,
}: DataTableShellProps) {
  return (
    <section className="card data-table-shell">
      <div className="data-table-shell__header">
        <h3 className="data-table-shell__title">{title}</h3>
        <div className="data-table-shell__controls">
          {typeof onSearchChange === "function" ? (
            <label className="data-table-shell__search" aria-label={`${title} search`}>
              <span className="sr-only">Search</span>
              <input
                type="search"
                value={searchValue ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
              />
            </label>
          ) : null}
          {filters ? <div className="data-table-shell__filters">{filters}</div> : null}
        </div>
      </div>

      <div className="data-table-shell__table-wrap">{children}</div>

      {pagination ? <div className="data-table-shell__pagination">{pagination}</div> : null}
    </section>
  );
}
