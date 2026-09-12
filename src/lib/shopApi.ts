import type { CreateOrderRequest, CreateOrderResponse, OrderView } from "@/types/shop";

/**
 * The browser side of the shop API (serverless functions in api/). Every
 * amount is recomputed on the server; these calls only carry ids, quantities
 * and contact details.
 */

export class ShopApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "ShopApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", Accept: "application/json", ...init?.headers },
  });
  const body = (await res.json().catch(() => null)) as
    | (T & { error?: string; code?: string })
    | null;
  if (!res.ok || !body) {
    throw new ShopApiError(body?.error ?? `HTTP ${res.status}`, res.status, body?.code);
  }
  return body;
}

export function createOrder(payload: CreateOrderRequest): Promise<CreateOrderResponse> {
  return request<CreateOrderResponse>("/api/orders", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getOrder(id: string): Promise<OrderView> {
  return request<OrderView>(`/api/orders/${encodeURIComponent(id)}`);
}

/** Start a fresh payment for an order whose last attempt failed or was cancelled. */
export function retryPayment(id: string, locale: "al" | "en"): Promise<{ paymentUrl: string }> {
  return request<{ paymentUrl: string }>(`/api/orders/${encodeURIComponent(id)}/pay`, {
    method: "POST",
    body: JSON.stringify({ locale }),
  });
}
