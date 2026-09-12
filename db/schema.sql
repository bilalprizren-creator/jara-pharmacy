-- Jara Pharmacy — shop orders (Neon Postgres).
--
-- Run once against the database Vercel's Neon integration created
-- (Neon console → SQL editor, or `psql "$DATABASE_URL" -f db/schema.sql`).
-- The functions in api/ read and write these two tables and nothing else.

create table if not exists orders (
  id                text primary key,                 -- 12 random URL-safe chars; the order page's address
  number            integer not null unique,          -- 1001, 1002 … shown as "JP-1001"
  status            text not null check (status in ('new','pending_payment','paid','payment_failed','cancelled','done')),
  locale            text not null default 'al',
  customer          jsonb not null,                   -- { name, phone, email? }
  fulfilment        jsonb not null,                   -- { method:'pickup', branchId } | { method:'prizren'|'kosovo', street, city, note? }
  items             jsonb not null,                   -- [{ id, name, qty, unitCents }]
  subtotal_cents    integer not null,
  delivery_cents    integer not null default 0,
  total_cents       integer not null,
  currency          text not null default 'EUR',
  payment_method    text not null check (payment_method in ('card','cash')),
  provider          text,                             -- 'raiaccept'
  provider_order_id text,                             -- RaiAccept orderIdentification of the latest attempt
  provider_tx_id    text,                             -- RaiAccept transactionId that settled it
  payment_attempts  integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz,
  paid_at           timestamptz
);

create index if not exists orders_provider_order_id_idx on orders (provider_order_id);
create index if not exists orders_created_at_idx on orders (created_at desc);

-- Every step an order went through: creation, payment attempts, webhooks,
-- results. Append-only; nothing in the app ever reads it back except people.
create table if not exists order_events (
  id         bigserial primary key,
  order_id   text not null references orders (id) on delete cascade,
  type       text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

create index if not exists order_events_order_id_idx on order_events (order_id, created_at);

-- Human order numbers start at 1001 so the first one does not read "JP-1".
create sequence if not exists order_number_seq start 1001;
