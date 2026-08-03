create extension if not exists "uuid-ossp";

create table if not exists companies (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  address text,
  ice text,
  rc text,
  created_at timestamp default now()
);

create table if not exists company_invoices (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  invoice_number text not null,
  total_amount decimal(10,2) not null,
  paid_amount decimal(10,2) default 0,
  remaining_amount decimal(10,2) generated always as (total_amount - paid_amount) stored,
  status text default 'pending',
  created_at timestamp default now()
);
