-- Supabase SQL script to create the inventory table
-- Run this in the Supabase SQL editor.

DROP TABLE IF EXISTS public.inventory;

CREATE TABLE public.inventory (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL,
  reference text NOT NULL,
  compatibleCars text,
  purchasePrice numeric(12,2) NOT NULL DEFAULT 0,
  sellingPrice numeric(12,2) NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 0
);
