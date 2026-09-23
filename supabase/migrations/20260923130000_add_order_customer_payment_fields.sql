alter table public.orders
  add column if not exists customer_email text,
  add column if not exists customer_name text,
  add column if not exists shipping_address jsonb,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists stripe_payment_intent_id text,
  add column if not exists paid_at timestamptz,
  add column if not exists notification_sent_at timestamptz;

create unique index if not exists orders_stripe_checkout_session_idx
  on public.orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists orders_paid_at_idx
  on public.orders (paid_at desc);
