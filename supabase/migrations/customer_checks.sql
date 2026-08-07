create table if not exists public.customer_checks (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text,
  customer_email text,
  reference text,
  amount numeric not null,
  due_date date not null,
  paid boolean not null default false,
  paid_date date,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_customer_checks_customer_name on public.customer_checks (customer_name);
create index if not exists idx_customer_checks_due_date on public.customer_checks (due_date);
create index if not exists idx_customer_checks_paid on public.customer_checks (paid);
