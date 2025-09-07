"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { listOrders, type Order } from "../../lib/orders-client";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        const result = await listOrders();
        if (isMounted) {
          setOrders(result);
          setError(null);
        }
      } catch (requestError) {
        if (isMounted) {
          const message =
            requestError instanceof Error
              ? requestError.message
              : "Failed to load orders";
          setError(message);
          setOrders([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="page">
      <h1>Orders</h1>

      {loading ? <p>Loading orders...</p> : null}
      {error ? <p className="error">{error}</p> : null}

      {!loading && !error ? (
        <section className="card">
          <h2>Order List</h2>

          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            <ul>
              {orders.map((order) => (
                <li key={order.id}>
                  {order.item_name} x{order.quantity}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <p>
        <Link href="/">Back to Home</Link>
      </p>
    </main>
  );
}
