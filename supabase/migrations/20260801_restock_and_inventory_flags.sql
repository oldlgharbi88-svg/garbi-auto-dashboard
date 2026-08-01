ALTER TABLE public.inventory
  ADD COLUMN IF NOT EXISTS archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_restock_date date,
  ADD COLUMN IF NOT EXISTS total_sold integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold integer DEFAULT 3;

CREATE TABLE IF NOT EXISTS public.restock_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id bigint REFERENCES public.inventory(id) ON DELETE CASCADE,
  quantity_ordered integer NOT NULL,
  new_purchase_price numeric,
  supplier text,
  expected_delivery_date date,
  status text DEFAULT 'pending',
  note text,
  created_at timestamp with time zone DEFAULT now(),
  received_at timestamp with time zone
);

ALTER TABLE public.restock_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on restock_orders" ON public.restock_orders FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on restock_orders" ON public.restock_orders FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on restock_orders" ON public.restock_orders FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on restock_orders" ON public.restock_orders FOR DELETE TO public USING (true);
