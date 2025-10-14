# UI Guidelines

This document defines the dashboard design system used across RudikCloud UI pages. The goal is consistent, fast-to-extend, production-looking UX with predictable patterns.

## Design Principles

- Consistency over novelty: reuse shared primitives before adding one-off styles.
- Density with clarity: fit operational data without visual noise.
- States are first-class: every page supports loading, empty, and error states.
- Accessibility by default: strong contrast, visible focus, keyboard-friendly controls.

## Typography Scale

Use this type scale for all page content.

| Token | Size / Weight | Usage |
|---|---|---|
| `--font-display` | 32px / 700 | Product title, major hero heading |
| `--font-h1` | 26px / 700 | Page title |
| `--font-h2` | 20px / 650 | Section heading |
| `--font-h3` | 16px / 650 | Card heading, sub-sections |
| `--font-body-lg` | 16px / 500 | Important body copy |
| `--font-body` | 14px / 500 | Default text |
| `--font-caption` | 12px / 500 | Labels, helper text |
| `--font-mono` | 12-13px / 500 | IDs, JSON snippets |

## Spacing Rules

Use an 8px grid and spacing tokens only.

| Token | Value |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-10` | 40px |

Rules:

- Card internal padding: `--space-5` or `--space-6`.
- Section spacing: `--space-6` between stacked blocks.
- Form field gap: `--space-3`.
- Table cell padding: `--space-3` vertical, `--space-4` horizontal.

## Color and Token Usage

All colors are consumed through semantic CSS variables.

### Core tokens

- `--bg-app`: app background.
- `--bg-surface`: primary card/surface background.
- `--bg-elevated`: raised surface (sidebar/topbar).
- `--text-primary`: default text.
- `--text-muted`: secondary/help text.
- `--border-default`: standard border.
- `--brand-primary`: primary interactive color.
- `--brand-primary-hover`: hover for primary actions.

### State tokens

- `--state-success-bg`, `--state-success-fg`
- `--state-warning-bg`, `--state-warning-fg`
- `--state-danger-bg`, `--state-danger-fg`
- `--state-info-bg`, `--state-info-fg`

Rules:

- Never hardcode hex colors inside page components.
- Prefer semantic state tokens over service-specific status colors.
- Ensure text contrast remains readable on badges/buttons.

## Layout Patterns

## AppShell

App layout is standardized:

- Left sidebar navigation (responsive, collapsible).
- Top bar with current section title and utility actions.
- Main content region with constrained readable width.
- Sticky navigation/topbar allowed for operational dashboards.

## PageHeader

Every major page starts with `PageHeader`:

- Title + short description.
- Optional right-side actions (primary/secondary).
- Optional metadata chips (environment/service context).

## Component Usage Rules

- `PageHeader`: always at page top.
- `EmptyState`: used when dataset length is zero.
- `LoadingSkeleton`: used while async data is in-flight.
- `DataTableShell`: used for all tabular resources.
- `StatusBadge`: used for status fields only, not generic labels.
- `ConfirmDialog`: required for destructive or irreversible actions.
- Toast pattern: use transient feedback for success/errors after async actions.

## Empty / Loading / Error Patterns

## Loading

- Show skeleton placeholders matching final layout.
- Avoid large content shifts when data arrives.

## Empty

- Include title, short reason, and clear primary action.
- For filtered tables: include “clear filters” action.

## Error

- Use concise language with actionable retry.
- Keep technical detail optional (not default visible).

## Table Pattern

- Table header row is always visible and tokenized.
- First column should identify entity (name/key/item).
- Status columns use `StatusBadge`.
- Row actions aligned right; avoid crowded button stacks.
- Use compact density with readable line-height.

## Form Pattern

- Label above control.
- Helper text optional and concise.
- Validation message shown inline below field.
- Primary submit action pinned to form footer area.
- Group related controls in cards/fieldsets.

## Interaction and Motion

- Keep transitions subtle (`120ms`-`180ms`).
- Hover, focus, active states are required for all interactive controls.
- Prefer purposeful motion (panel open, toast enter) over decorative animation.

## Responsiveness

- Sidebar collapses to icon rail or drawer on small screens.
- Table containers horizontally scroll without breaking layout.
- Forms become single-column on narrow widths.
- Page actions wrap safely under title on mobile.

## 21st.dev Component Intake Checklist

When adopting a block from 21st.dev, complete this checklist before merging.

- [ ] Keep only the structural idea; remove unrelated styling defaults.
- [ ] Replace imported icon sets with `lucide-react` icons used in the dashboard.
- [ ] Convert all colors, radius, shadows, spacing, and typography to dashboard tokens.
- [ ] Wrap raw layout in existing primitives (`PageHeader`, `DataTableShell`, `EmptyState`, etc.) where applicable.
- [ ] Ensure keyboard navigation and visible focus states are preserved.
- [ ] Validate loading, empty, and error behavior (no “happy path only” blocks).
- [ ] Remove dead code, sample/mock data, and framework-specific boilerplate not used here.
- [ ] Confirm responsive behavior matches AppShell breakpoints.
- [ ] Verify visual fit beside existing pages (Orders, Flags, Audit) at desktop and mobile widths.
- [ ] Add a short note in block docs describing: source inspiration, normalization choices, and integration points.
