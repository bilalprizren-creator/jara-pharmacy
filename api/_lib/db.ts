import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { neon } from "@neondatabase/serverless";
import type {
  OrderCustomer,
  OrderFulfilment,
  OrderLine,
  OrderStatus,
  PaymentMethod,
} from "../../src/types/shop";

/**
 * Orders live in Neon Postgres (schema in db/schema.sql). Everything the
 * functions need is behind the small `OrderStore` interface, which also has a
 * JSON-file implementation for the dev server, so the whole flow runs on a
 * laptop with no database at all. The file store is never used when
 * `DATABASE_URL` is set.
 */

export interface OrderRecord {
  id: string;
  number: number;
  status: OrderStatus;
  locale: "al" | "en";
  customer: OrderCustomer;
  fulfilment: OrderFulfilment;
  items: OrderLine[];
  subtotal_cents: number;
  delivery_cents: number;
  total_cents: number;
  currency: string;
  payment_method: PaymentMethod;
  provider: string | null;
  provider_order_id: string | null;
  provider_tx_id: string | null;
  payment_attempts: number;
  created_at: string;
  updated_at: string | null;
  paid_at: string | null;
}

export type NewOrder = Pick<
  OrderRecord,
  | "id"
  | "status"
  | "locale"
  | "customer"
  | "fulfilment"
  | "items"
  | "subtotal_cents"
  | "delivery_cents"
  | "total_cents"
  | "currency"
  | "payment_method"
>;

export type OrderPatch = Partial<
  Pick<
    OrderRecord,
    "status" | "provider" | "provider_order_id" | "provider_tx_id" | "payment_attempts" | "paid_at"
  >
>;

export interface OrderStore {
  create(order: NewOrder): Promise<OrderRecord>;
  get(id: string): Promise<OrderRecord | null>;
  findByProviderOrderId(providerOrderId: string): Promise<OrderRecord | null>;
  findByNumber(number: number): Promise<OrderRecord | null>;
  update(id: string, patch: OrderPatch): Promise<OrderRecord>;
  addEvent(orderId: string, type: string, payload: unknown): Promise<void>;
}

/* ---- Neon ---------------------------------------------------------------- */

function neonStore(url: string): OrderStore {
  const sql = neon(url);

  const row = (r: Record<string, unknown>): OrderRecord => ({
    ...(r as unknown as OrderRecord),
    created_at: toIso(r.created_at),
    updated_at: r.updated_at ? toIso(r.updated_at) : null,
    paid_at: r.paid_at ? toIso(r.paid_at) : null,
  });

  return {
    async create(o) {
      const rows = await sql`
        insert into orders (id, number, status, locale, customer, fulfilment, items,
          subtotal_cents, delivery_cents, total_cents, currency, payment_method)
        values (${o.id}, nextval('order_number_seq'), ${o.status}, ${o.locale},
          ${JSON.stringify(o.customer)}::jsonb, ${JSON.stringify(o.fulfilment)}::jsonb,
          ${JSON.stringify(o.items)}::jsonb, ${o.subtotal_cents}, ${o.delivery_cents},
          ${o.total_cents}, ${o.currency}, ${o.payment_method})
        returning *`;
      return row(rows[0] as Record<string, unknown>);
    },
    async get(id) {
      const rows = await sql`select * from orders where id = ${id} limit 1`;
      return rows[0] ? row(rows[0] as Record<string, unknown>) : null;
    },
    async findByProviderOrderId(providerOrderId) {
      const rows = await sql`select * from orders where provider_order_id = ${providerOrderId} limit 1`;
      return rows[0] ? row(rows[0] as Record<string, unknown>) : null;
    },
    async findByNumber(number) {
      const rows = await sql`select * from orders where number = ${number} limit 1`;
      return rows[0] ? row(rows[0] as Record<string, unknown>) : null;
    },
    async update(id, patch) {
      // coalesce keeps whatever is not in the patch; `updated_at` always moves.
      const rows = await sql`
        update orders set
          status = coalesce(${patch.status ?? null}, status),
          provider = coalesce(${patch.provider ?? null}, provider),
          provider_order_id = coalesce(${patch.provider_order_id ?? null}, provider_order_id),
          provider_tx_id = coalesce(${patch.provider_tx_id ?? null}, provider_tx_id),
          payment_attempts = coalesce(${patch.payment_attempts ?? null}, payment_attempts),
          paid_at = coalesce(${patch.paid_at ?? null}::timestamptz, paid_at),
          updated_at = now()
        where id = ${id}
        returning *`;
      if (!rows[0]) throw new Error(`order ${id} not found`);
      return row(rows[0] as Record<string, unknown>);
    },
    async addEvent(orderId, type, payload) {
      await sql`insert into order_events (order_id, type, payload)
        values (${orderId}, ${type}, ${JSON.stringify(payload ?? null)}::jsonb)`;
    },
  };
}

function toIso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

/* ---- JSON file (dev only) ------------------------------------------------ */

interface FileState {
  nextNumber: number;
  orders: OrderRecord[];
  events: { orderId: string; type: string; payload: unknown; at: string }[];
}

function fileStore(dir: string): OrderStore {
  const file = join(dir, "orders.json");
  const load = (): FileState => {
    if (!existsSync(file)) return { nextNumber: 1001, orders: [], events: [] };
    return JSON.parse(readFileSync(file, "utf8")) as FileState;
  };
  const save = (state: FileState) => {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, JSON.stringify(state, null, 2));
  };

  return {
    async create(o) {
      const state = load();
      const record: OrderRecord = {
        ...o,
        number: state.nextNumber++,
        provider: null,
        provider_order_id: null,
        provider_tx_id: null,
        payment_attempts: 0,
        created_at: new Date().toISOString(),
        updated_at: null,
        paid_at: null,
      };
      state.orders.push(record);
      save(state);
      return record;
    },
    async get(id) {
      return load().orders.find((o) => o.id === id) ?? null;
    },
    async findByProviderOrderId(providerOrderId) {
      return load().orders.find((o) => o.provider_order_id === providerOrderId) ?? null;
    },
    async findByNumber(number) {
      return load().orders.find((o) => o.number === number) ?? null;
    },
    async update(id, patch) {
      const state = load();
      const record = state.orders.find((o) => o.id === id);
      if (!record) throw new Error(`order ${id} not found`);
      Object.assign(record, patch, { updated_at: new Date().toISOString() });
      save(state);
      return record;
    },
    async addEvent(orderId, type, payload) {
      const state = load();
      state.events.push({ orderId, type, payload, at: new Date().toISOString() });
      save(state);
    },
  };
}

/* ---- Selection ----------------------------------------------------------- */

let cached: OrderStore | undefined;

export function store(): OrderStore {
  if (cached) return cached;
  const url = process.env.DATABASE_URL;
  if (url) {
    cached = neonStore(url);
  } else if (process.env.VERCEL) {
    throw new Error("DATABASE_URL is not set");
  } else {
    console.warn("[api] DATABASE_URL not set — using .orders-dev/orders.json (development only)");
    cached = fileStore(join(process.cwd(), ".orders-dev"));
  }
  return cached;
}
