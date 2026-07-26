CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text NOT NULL DEFAULT 'cash',
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  note text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on payments" ON public.payments FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert on payments" ON public.payments FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update on payments" ON public.payments FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete on payments" ON public.payments FOR DELETE TO public USING (true);
