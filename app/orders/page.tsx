"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import {
  createOrder,
  listOrders,
  retryOrderNotification,
  type Order,
} from "../../lib/orders-client";

function getStatusBadgeClass(status: string): string {
  if (status === "sent") return "status-badge status-sent";
  if (status === "failed") return "status-badge status-failed";
  if (status === "retrying") return "status-badge status-retrying";
  if (status === "pending") return "status-badge status-pending";
  return "status-badge status-unknown";
}

function formatLastError(error: string | null): string {
  if (!error) return "-";
  if (error.length <= 60) return error;
  return `${error.slice(0, 57)}...`;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [creating, setCreating] = useState(false);
  const [retryingOrderId, setRetryingOrderId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
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
    let isMounted = true;

    if (isMounted) {
      loadOrders();
    }
    return () => {
      isMounted = false;
    };
  }, [loadOrders]);

  const handleCreateOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedItemName = itemName.trim();
    const parsedQuantity = Number(quantity);
    if (!normalizedItemName || Number.isNaN(parsedQuantity) || parsedQuantity < 1) {
      setError("Please provide a valid item name and quantity.");
      return;
    }

    setCreating(true);
    try {
      await createOrder({
        item_name: normalizedItemName,
        quantity: parsedQuantity,
      });
      setItemName("");
      setQuantity("1");
      await loadOrders();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to create order";
      setError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleRetryNotification = async (orderId: string) => {
    setRetryingOrderId(orderId);
    try {
      await retryOrderNotification(orderId);
      await loadOrders();
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Failed to retry notification";
      setError(message);
    } finally {
      setRetryingOrderId(null);
    }
  };

  return (
    <main className="page">
      <h1>Orders</h1>

      <section className="card">
        <h2>Create Order</h2>
        <form className="form" onSubmit={handleCreateOrder}>
          <label className="field">
            <span>Item name</span>
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
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
              min={1}
            />
          </label>

          <button type="submit" className="button" disabled={creating}>
            {creating ? "Creating..." : "Create order"}
          </button>
        </form>
      </section>

      {loading ? (
        <section className="card">
          <p>Loading orders...</p>
        </section>
      ) : null}
      {error ? (
        <section className="card">
          <p className="error">{error}</p>
          <button
            type="button"
            className="button button-secondary"
            onClick={() => void loadOrders()}
          >
            Retry loading orders
          </button>
        </section>
      ) : null}

      {!loading && !error ? (
        <section className="card">
          <h2>Order List</h2>

          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Checkout Variant</th>
                  <th>Notification Status</th>
                  <th>Attempts</th>
                  <th>Last Attempt</th>
                  <th>Last Error</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.item_name}</td>
                    <td>{order.quantity}</td>
                    <td>{order.checkout_variant}</td>
                    <td>
                      <span className={getStatusBadgeClass(order.notification_status)}>
                        {order.notification_status}
                      </span>
                    </td>
                    <td>{order.notification_attempts}</td>
                    <td>{order.notification_last_attempt_at ?? "-"}</td>
                    <td title={order.notification_last_error ?? undefined}>
                      {formatLastError(order.notification_last_error)}
                    </td>
                    <td>
                      {order.notification_status === "failed" ? (
                        <button
                          type="button"
                          className="button button-secondary"
                          onClick={() => void handleRetryNotification(order.id)}
                          disabled={retryingOrderId === order.id}
                        >
                          {retryingOrderId === order.id ? "Retrying..." : "Retry"}
                        </button>
                      ) : (
                        "-"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}

      <p>
        <Link href="/flags">Manage Flags</Link>
      </p>
      <p>
        <Link href="/">Back to Home</Link>
      </p>
    </main>
  );
}
