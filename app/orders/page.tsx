"use client";

import Link from "next/link";
import { Flag, PackagePlus, RefreshCcw, ShoppingCart } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { DataTableShell } from "../../components/ui/data-table-shell";
import { GlowPanel } from "../../components/ui/glow-panel";
import { PageHeader } from "../../components/ui/page-header";
import { StatusBadge } from "../../components/ui/status-badge";
import { ErrorState, EmptyState, LoadingSkeleton } from "../../components/ui/states";
import { useToast } from "../../components/ui/toast";
import {
  createOrder,
  listOrders,
  retryOrderNotification,
  type Order,
} from "../../lib/orders-client";

function formatLastError(error: string | null): string {
  if (!error) return "-";
  if (error.length <= 60) return error;
  return `${error.slice(0, 57)}...`;
}

function formatDate(value: string | null): string {
  if (!value) return "-";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString();
}

export default function OrdersPage() {
  const { showToast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [creating, setCreating] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [retryCandidate, setRetryCandidate] = useState<Order | null>(null);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await listOrders();
      setOrders(result);
      setError(null);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to load orders";
      setError(message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    const normalizedQuery = search.trim().toLowerCase();

    return orders.filter((order) => {
      const statusMatches =
        statusFilter === "all" || order.notification_status === statusFilter;
      const queryMatches =
        !normalizedQuery ||
        order.item_name.toLowerCase().includes(normalizedQuery) ||
        order.id.toLowerCase().includes(normalizedQuery);

      return statusMatches && queryMatches;
    });
  }, [orders, search, statusFilter]);

  const summary = useMemo(() => {
    const counts = {
      total: orders.length,
      sent: 0,
      pending: 0,
      retrying: 0,
      failed: 0,
    };

    for (const order of orders) {
      if (order.notification_status === "sent") counts.sent += 1;
      if (order.notification_status === "pending") counts.pending += 1;
      if (order.notification_status === "retrying") counts.retrying += 1;
      if (order.notification_status === "failed") counts.failed += 1;
    }

    return counts;
  }, [orders]);

  const handleCreateOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedItemName = itemName.trim();
    const parsedQuantity = Number(quantity);
    if (!normalizedItemName || Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      showToast({
        variant: "error",
        title: "Invalid order details",
        description: "Enter an item name and quantity of at least 1.",
      });
      return;
    }

    setCreating(true);
    try {
      await createOrder({ item_name: normalizedItemName, quantity: parsedQuantity });
      setItemName("");
      setQuantity("1");
      await loadOrders();
      showToast({ title: "Order created", description: "The order was saved successfully." });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to create order";
      showToast({ variant: "error", title: "Order creation failed", description: message });
    } finally {
      setCreating(false);
    }
  };

  const handleRetryNotification = async () => {
    if (!retryCandidate) {
      return;
    }

    setRetryingOrderId(retryCandidate.id);
    try {
      await retryOrderNotification(retryCandidate.id);
      setRetryCandidate(null);
      await loadOrders();
      showToast({
        title: "Retry enqueued",
        description: "Notification retry has been submitted.",
      });
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to retry notification";
      showToast({ variant: "error", title: "Retry failed", description: message });
    } finally {
      setRetryingOrderId(null);
    }
  };

  return (
    <main className="page">
      <PageHeader
        eyebrow="Commerce"
        icon={<ShoppingCart size={18} aria-hidden />}
        title="Orders"
        description="Create orders, inspect checkout variants, and monitor notification delivery states."
        actions={
          <div className="actions">
            <Link href="/flags" className="button button-secondary">
              <Flag size={15} aria-hidden />
              Manage Flags
            </Link>
            <Link href="/audit" className="button button-secondary">
              View Audit
            </Link>
          </div>
        }
      />

      <section className="orders-metrics-grid">
        <GlowPanel className="glow-panel-card">
          <article className="card orders-metric">
            <p className="orders-metric__label">Total orders</p>
            <h3>{summary.total}</h3>
            <p>All created orders</p>
          </article>
        </GlowPanel>
        <GlowPanel className="glow-panel-card">
          <article className="card orders-metric">
            <p className="orders-metric__label">Sent notifications</p>
            <h3>{summary.sent}</h3>
            <StatusBadge status="sent" />
          </article>
        </GlowPanel>
        <GlowPanel className="glow-panel-card">
          <article className="card orders-metric">
            <p className="orders-metric__label">Retrying / pending</p>
            <h3>{summary.pending + summary.retrying}</h3>
            <div className="orders-metric__status-row">
              <StatusBadge status="pending" />
              <StatusBadge status="retrying" />
            </div>
          </article>
        </GlowPanel>
        <GlowPanel className="glow-panel-card">
          <article className="card orders-metric">
            <p className="orders-metric__label">Failed notifications</p>
            <h3>{summary.failed}</h3>
            <StatusBadge status="failed" />
          </article>
        </GlowPanel>
      </section>

      <GlowPanel className="glow-panel-card">
        <section className="card">
          <div className="orders-create__header">
            <h3>Create Order</h3>
            <p>New orders trigger feature-flag evaluation and notification workflow events.</p>
          </div>
          <form className="form split-form" onSubmit={handleCreateOrder}>
            <label className="field">
              <span>Item Name</span>
              <input
                type="text"
                value={itemName}
                onChange={(event) => setItemName(event.target.value)}
                required
                minLength={1}
                placeholder="Starter Plan"
              />
            </label>

            <label className="field">
              <span>Quantity</span>
              <input
                type="number"
                min={1}
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
                required
              />
            </label>

            <div className="actions split-form__actions">
              <button type="submit" className="button" disabled={creating}>
                <PackagePlus size={16} aria-hidden />
                {creating ? "Creating..." : "Create Order"}
              </button>
            </div>
          </form>
        </section>
      </GlowPanel>

      {loading ? <LoadingSkeleton title="Loading orders" lines={6} /> : null}

      {error ? (
        <ErrorState
          message={error}
          action={
            <button
              type="button"
              className="button button-secondary"
              onClick={() => void loadOrders()}
            >
              Retry
            </button>
          }
        />
      ) : null}

      {!loading && !error ? (
        <DataTableShell
          title="Order List"
          description="Includes checkout variant and worker notification metadata for each order."
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by item or order ID"
          filters={
            <label className="field-inline">
              <span>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter orders by status"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="retrying">Retrying</option>
                <option value="sent">Sent</option>
                <option value="failed">Failed</option>
              </select>
            </label>
          }
          pagination={<p>{filteredOrders.length} matching orders</p>}
        >
          {filteredOrders.length === 0 ? (
            <EmptyState
              title="No orders found"
              description="Create your first order or adjust filters to see matching rows."
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Checkout Variant</th>
                  <th>Notification</th>
                  <th>Attempts</th>
                  <th>Last Attempt</th>
                  <th>Last Error</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <strong>{order.item_name}</strong>
                      <div className="muted">{order.id}</div>
                    </td>
                    <td>{order.quantity}</td>
                    <td>
                      <span className={`variant-chip variant-${order.checkout_variant}`}>
                        {order.checkout_variant}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={order.notification_status} />
                    </td>
                    <td>{order.notification_attempts}</td>
                    <td>{formatDate(order.notification_last_attempt_at)}</td>
                    <td title={order.notification_last_error ?? undefined}>
                      {formatLastError(order.notification_last_error)}
                    </td>
                    <td>
                      {order.notification_status === "failed" ? (
                        <button
                          type="button"
                          className="button button-secondary button-compact"
                          onClick={() => setRetryCandidate(order)}
                          disabled={retryingOrderId === order.id}
                        >
                          <RefreshCcw size={13} aria-hidden />
                          {retryingOrderId === order.id ? "Retrying..." : "Retry"}
                        </button>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DataTableShell>
      ) : null}

      <ConfirmDialog
        open={Boolean(retryCandidate)}
        title="Retry notification?"
        description="This re-enqueues notification delivery for the selected order."
        confirmText="Retry Notification"
        onCancel={() => setRetryCandidate(null)}
        onConfirm={() => void handleRetryNotification()}
      />
    </main>
  );
}
