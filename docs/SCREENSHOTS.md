# Screenshot and GIF Capture Checklist

Capture these assets after running `infra` stack with real demo data. Keep browser width consistent for clean portfolio presentation.

## Output Folder

Store captures in:

```text
dashboard/docs/assets/
```

Suggested naming pattern:

```text
01-login-page.png
02-orders-empty.png
03-flags-enabled.png
...
```

## Required Screenshots

- [ ] `01-login-page.png`
  - Page: `/login`
  - State: clean login form before submit.

- [ ] `02-register-success.png`
  - Page: `/register`
  - State: registration completed (or post-register redirect evidence).

- [ ] `03-home-authenticated.png`
  - Page: `/`
  - State: shows logged-in identity.

- [ ] `04-flags-list.png`
  - Page: `/flags`
  - State: `newCheckout` visible in list.

- [ ] `05-flags-edit.png`
  - Page: `/flags`
  - State: edit form with `enabled=true`, rollout configured.

- [ ] `06-orders-list-new-variant.png`
  - Page: `/orders`
  - State: order row showing checkout variant `new` and notification status badge.

- [ ] `07-orders-failed-status.png`
  - Page: `/orders`
  - State: failure mode example (`failed` status, attempts, error, retry button visible).

- [ ] `08-audit-list.png`
  - Page: `/audit`
  - State: filtered list showing `FLAG_UPDATED` and/or `ORDER_CREATED`.

- [ ] `09-audit-detail.png`
  - Page: `/audit/[id]`
  - State: before/after JSON shown.

- [ ] `10-grafana-overview.png`
  - Page: Grafana dashboard (`http://localhost:3001`)
  - State: RudikCloud overview dashboard with active telemetry.

- [ ] `11-grafana-trace-explore.png`
  - Page: Grafana Explore (Tempo datasource)
  - State: trace view for order flow across services.

## Recommended GIFs

- [ ] `flow-login-to-order.gif`
  - Capture: login -> create order -> status visible.

- [ ] `flow-flag-toggle-impact.gif`
  - Capture: toggle `newCheckout` -> create order -> variant change.

- [ ] `flow-failure-injection.gif`
  - Capture: set worker fail mode -> create order -> status moves to `failed`.

## Capture Notes

- Hide browser bookmarks bar and unrelated tabs.
- Use same zoom level across all captures.
- Prefer realistic but non-sensitive demo emails.
- Keep timestamps visible for observability screens when possible.
