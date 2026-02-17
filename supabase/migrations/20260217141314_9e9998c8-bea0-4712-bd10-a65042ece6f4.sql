
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS weight_size text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS usage_instructions text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS benefits jsonb DEFAULT '[]'::jsonb;
