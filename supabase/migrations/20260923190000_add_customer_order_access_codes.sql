create table if not exists public.customer_order_access_codes (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists customer_order_access_codes_email_idx
  on public.customer_order_access_codes (email, created_at desc);

alter table public.customer_order_access_codes enable row level security;
revoke all on public.customer_order_access_codes from anon, authenticated;
