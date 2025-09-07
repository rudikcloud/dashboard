export type Order = {
  id: string;
  user_id: string;
  item_name: string;
  quantity: number;
  created_at: string;
  updated_at: string;
};

export async function listOrders(): Promise<Order[]> {
  const response = await fetch("/api/orders", {
    method: "GET",
    credentials: "include",
  });

  const text = await response.text();
  let payload: unknown = [];

  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = [];
    }
  }

  if (!response.ok) {
    const detail =
      typeof payload === "object" &&
      payload !== null &&
      "detail" in payload &&
      typeof (payload as { detail?: unknown }).detail === "string"
        ? (payload as { detail: string }).detail
        : `Request failed (${response.status})`;
    throw new Error(detail);
  }

  if (!Array.isArray(payload)) {
    return [];
  }

  return payload as Order[];
}
