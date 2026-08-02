ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS client_number text UNIQUE;
