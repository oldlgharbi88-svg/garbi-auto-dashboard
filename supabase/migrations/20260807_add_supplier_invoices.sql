CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.supplier_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  supplier_name text NOT NULL,
  supplier_phone text,
  supplier_email text,
  supplier_ice text,
  invoice_date date NOT NULL,
  due_date date,
  amount numeric NOT NULL CHECK (amount >= 0),
  paid boolean DEFAULT false,
  paid_date date,
  payment_method text,
  invoice_image_url text,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.supplier_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on supplier_invoices" ON public.supplier_invoices FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on supplier_invoices" ON public.supplier_invoices FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on supplier_invoices" ON public.supplier_invoices FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on supplier_invoices" ON public.supplier_invoices FOR DELETE TO public USING (true);

CREATE TABLE IF NOT EXISTS public.supplier_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_invoice_id uuid REFERENCES public.supplier_invoices(id) ON DELETE CASCADE,
  part_id bigint REFERENCES public.inventory(id) ON DELETE SET NULL,
  part_name text,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL
);

ALTER TABLE public.supplier_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on supplier_invoice_items" ON public.supplier_invoice_items FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on supplier_invoice_items" ON public.supplier_invoice_items FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on supplier_invoice_items" ON public.supplier_invoice_items FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on supplier_invoice_items" ON public.supplier_invoice_items FOR DELETE TO public USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('supplier-invoices', 'supplier-invoices', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow public read on supplier-invoices" ON storage.objects FOR SELECT TO public USING (bucket_id = 'supplier-invoices');
CREATE POLICY "Allow public insert on supplier-invoices" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'supplier-invoices');
CREATE POLICY "Allow public update on supplier-invoices" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'supplier-invoices');
CREATE POLICY "Allow public delete on supplier-invoices" ON storage.objects FOR DELETE TO public USING (bucket_id = 'supplier-invoices');
