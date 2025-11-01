"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "../../components/ui/confirm-dialog";
import { DataTableShell } from "../../components/ui/data-table-shell";
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
        title="Orders"
        description="Create customer orders, inspect checkout variants, and monitor notification delivery."
        actions={
          <div className="actions">
            <Link href="/flags" className="button button-secondary">
              Manage Flags
            </Link>
            <Link href="/audit" className="button button-secondary">
              View Audit
            </Link>
          </div>
        }
      />

      <section className="card">
        <h3>Create Order</h3>
        <form className="form split-form" onSubmit={handleCreateOrder}>
          <label className="field">
            <span>Item Name</span>
            <input
              type="text"
              value={itemName}
              onChange={(event) => setItemName(event.target.value)}
              required
              minLength={1}
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
              {creating ? "Creating..." : "Create Order"}
            </button>
          </div>
        </form>
      </section>

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
                    <td>{order.checkout_variant}</td>
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
