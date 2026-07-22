-- Add a nullable image_url column to the inventory table for part thumbnails.
ALTER TABLE public.inventory
ADD COLUMN IF NOT EXISTS image_url text;

-- Optional: make the column easier to query by indexing it.
CREATE INDEX IF NOT EXISTS inventory_image_url_idx ON public.inventory (image_url);
