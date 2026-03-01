-- Add fiscal columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS rnc_cedula text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS ncf_type text DEFAULT '02'; -- '01' (Fiscal) or '02' (Consumidor Final)

-- Add comment
COMMENT ON COLUMN public.orders.rnc_cedula IS 'RNC or Cedula for fiscal invoicing';
COMMENT ON COLUMN public.orders.company_name IS 'Registered company name for fiscal invoicing';
