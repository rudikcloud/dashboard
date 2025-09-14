"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

import { createOrder, listOrders, type Order } from "../../lib/orders-client";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [creating, setCreating] = useState(false);

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

      {loading ? <p>Loading orders...</p> : null}
      {error ? <p className="error">{error}</p> : null}

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
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.item_name}</td>
                    <td>{order.quantity}</td>
                    <td>{order.checkout_variant}</td>
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
