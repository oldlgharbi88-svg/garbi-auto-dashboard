create table if not exists public.supplier_checks (
  id uuid primary key default gen_random_uuid(),
  supplier_name text not null,
  supplier_phone text,
  supplier_email text,
  reference text,
  amount numeric not null,
  due_date date not null,
  paid boolean not null default false,
  paid_date date,
  notes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create index if not exists idx_supplier_checks_supplier_name on public.supplier_checks (supplier_name);
create index if not exists idx_supplier_checks_due_date on public.supplier_checks (due_date);
create index if not exists idx_supplier_checks_paid on public.supplier_checks (paid);
