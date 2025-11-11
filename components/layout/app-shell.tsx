"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserCircle2,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { authRequest, type User } from "../../lib/auth-client";
import {
  getPageTitle,
  isItemActive,
  navigationGroups,
  type NavigationItem,
} from "./navigation";

type AppShellProps = {
  children: React.ReactNode;
};

const AUTH_ROUTES = new Set(["/login", "/register"]);

function NavItem({
  item,
  pathname,
  onNavigate,
}: {
  item: NavigationItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const className = `app-nav__item${isItemActive(pathname, item) ? " is-active" : ""}${
    item.disabled ? " is-disabled" : ""
  }`;

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className={className}
        onClick={onNavigate}
      >
        <Icon size={17} aria-hidden />
        <span>{item.label}</span>
        <ArrowUpRight size={14} aria-hidden className="app-nav__external-icon" />
      </a>
    );
  }

  if (item.disabled) {
    return (
      <span className={className} aria-disabled>
        <Icon size={17} aria-hidden />
        <span>{item.label}</span>
      </span>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      <Icon size={17} aria-hidden />
      <span>{item.label}</span>
    </Link>
  );
}

function UserMenu() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const current = await authRequest<User>("/me");
        if (!active) return;
        setUser(current);
      } catch {
        if (!active) return;
        setUser(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleLogout = async () => {
    try {
      await authRequest<{ status: string }>("/auth/logout", { method: "POST" });
    } catch {
    } finally {
      window.location.href = "/login";
    }
  };

  return (
    <div className="user-menu" ref={menuRef}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setOpen((previous) => !previous)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Open user menu"
      >
        <UserCircle2 size={19} aria-hidden />
        <span className="user-menu__text">
          {loading ? "Loading" : user?.email ?? "Guest"}
        </span>
      </button>

      {open ? (
        <div className="user-menu__dropdown" role="menu">
          <p className="user-menu__email">{user?.email ?? "Not signed in"}</p>
          <Link href="/login" className="user-menu__item" role="menuitem">
            <Settings size={16} aria-hidden />
            Account
          </Link>
          <button
            type="button"
            className="user-menu__item"
            role="menuitem"
            onClick={handleLogout}
          >
            <LogOut size={16} aria-hidden />
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  const isAuthRoute = AUTH_ROUTES.has(pathname);
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1081px)");
    const applyViewport = () => {
      setIsDesktop(mediaQuery.matches);
      if (mediaQuery.matches) {
        setMobileOpen(false);
      }
    };

    applyViewport();
    mediaQuery.addEventListener("change", applyViewport);
    return () => {
      mediaQuery.removeEventListener("change", applyViewport);
    };
  }, []);

  if (isAuthRoute) {
    return <div className="auth-layout">{children}</div>;
  }

  return (
    <div className={`app-shell${collapsed ? " is-collapsed" : ""}`}>
      <aside className={`app-sidebar${mobileOpen ? " is-open" : ""}`}>
        <div className="app-sidebar__header">
          <div className="app-sidebar__brand">
            <div className="app-sidebar__logo">RC</div>
            <div className="app-sidebar__brand-text">
              <strong>RudikCloud</strong>
              <span>Platform Console</span>
            </div>
          </div>

          {isDesktop ? (
            <button
              type="button"
              className="icon-button app-sidebar__collapse-toggle"
              onClick={() => setCollapsed((previous) => !previous)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? (
                <PanelLeftOpen size={18} aria-hidden />
              ) : (
                <PanelLeftClose size={18} aria-hidden />
              )}
            </button>
          ) : (
            <button
              type="button"
              className="icon-button app-sidebar__collapse-toggle"
              onClick={() => setMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X size={18} aria-hidden />
            </button>
          )}
        </div>

        <nav className="app-nav" aria-label="Sidebar navigation">
          {navigationGroups.map((group) => (
            <div key={group.label} className="app-nav__group">
              <p className="app-nav__group-label">{group.label}</p>
              <div className="app-nav__group-items">
                {group.items.map((item) => (
                  <NavItem
                    key={item.label}
                    item={item}
                    pathname={pathname}
                    onNavigate={() => setMobileOpen(false)}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="app-sidebar__footer">
          <span className="app-sidebar__footer-label">Local Development</span>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="app-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-label="Close sidebar"
        />
      ) : null}

      <div className="app-main">
        <header className="app-topbar">
          <div className="app-topbar__left">
            {!isDesktop ? (
              <button
                type="button"
                className="icon-button app-topbar__mobile-toggle"
                onClick={() => setMobileOpen(true)}
                aria-label="Open sidebar menu"
              >
                <Menu size={18} aria-hidden />
              </button>
            ) : null}

            <div>
              <p className="app-topbar__label">RudikCloud Control Plane</p>
              <h1 className="app-topbar__title">{pageTitle}</h1>
            </div>
          </div>

          <div className="app-topbar__right">
            <UserMenu />
          </div>
        </header>

        <div className="app-content">{children}</div>
      </div>
    </div>
  );
}
