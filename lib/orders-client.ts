export type Order = {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  checkout_variant: string;
  notification_status: "pending" | "retrying" | "sent" | "failed" | string;
  notification_attempts: number;
  notification_last_error: string | null;
  notification_last_attempt_at: string | null;
  created_at: string;
  updated_at: string;
};

async function parseResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  let payload: unknown = null;

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = null;
    }
  }

  return payload;
}

function getErrorMessage(payload: unknown, status: number): string {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "detail" in payload &&
    typeof (payload as { detail?: unknown }).detail === "string"
  ) {
    return (payload as { detail: string }).detail;
  }

  return `Request failed (${status})`;
}

export async function listOrders(): Promise<Order[]> {
  const response = await fetch("/api/orders", {
    method: "GET",
    credentials: "include",
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload as Order[];
}

export async function createOrder(input: {
  item_name: string;
  quantity: number;
}): Promise<Order> {
  const response = await fetch("/api/orders", {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid create order response");
  }

  return payload as Order;
}

export async function retryOrderNotification(orderId: string): Promise<Order> {
  const response = await fetch(
    `/api/orders/${encodeURIComponent(orderId)}/retry-notification`,
    {
      method: "POST",
      credentials: "include",
    },
  );
  const payload = await parseResponse(response);

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, response.status));
  }

  if (typeof payload !== "object" || payload === null) {
    throw new Error("Invalid retry order response");
  }

  return payload as Order;
}
