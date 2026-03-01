
-- Enable Extensions
create extension if not exists "uuid-ossp";

-- 1. Add Fiscal Columns to Orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS rnc_cedula text,
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS ncf_type text, -- '01' (Credito Fiscal), '02' (Consumidor Final), etc.
ADD COLUMN IF NOT EXISTS ncf_generated text;

-- 2. Add NCF and e-CF columns to Invoices
ALTER TABLE invoices
ADD COLUMN IF NOT EXISTS ncf text,
ADD COLUMN IF NOT EXISTS ncf_expiration_date date,
ADD COLUMN IF NOT EXISTS security_code text, -- For e-CF
ADD COLUMN IF NOT EXISTS electronic_sign text, -- For e-CF
ADD COLUMN IF NOT EXISTS track_id text, -- For e-CF provider tracking
ADD COLUMN IF NOT EXISTS messaje_date timestamp with time zone;

-- 3. Create Fiscal Sequences Table (Local Management)
CREATE TABLE IF NOT EXISTS fiscal_sequences (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  series text NOT NULL, -- e.g., 'B' or 'E'
  type_code text NOT NULL, -- e.g., '01', '02', '31' (E-CF)
  current_sequence bigint DEFAULT 1,
  end_sequence bigint NOT NULL,
  expiration_date date NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- 4. Initial Seed for Standard NCFs (Example)
INSERT INTO fiscal_sequences (series, type_code, current_sequence, end_sequence, expiration_date)
VALUES 
('B', '01', 1, 100, '2026-12-31'), -- Factura de Crédito Fiscal
('B', '02', 1, 100, '2026-12-31'), -- Factura de Consumidor Final
('E', '31', 1, 1000, '2027-12-31') -- e-CF Factura de Crédito Fiscal Electrónica
ON CONFLICT DO NOTHING;

-- 5. Function to Increment and Get Next NCF
CREATE OR REPLACE FUNCTION get_next_ncf(seq_series text, seq_type text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  seq_record record;
  next_val bigint;
  formatted_ncf text;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO seq_record
  FROM fiscal_sequences
  WHERE series = seq_series AND type_code = seq_type AND is_active = true
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  IF seq_record.expiration_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'Sequence expired';
  END IF;
  
  IF seq_record.current_sequence > seq_record.end_sequence THEN
    RAISE EXCEPTION 'Sequence exhausted';
  END IF;
  
  next_val := seq_record.current_sequence;
  
  -- Update the sequence
  UPDATE fiscal_sequences
  SET current_sequence = current_sequence + 1,
      updated_at = now()
  WHERE id = seq_record.id;
  
  -- Format NCF (11 chars for Standard, 13 for e-CF sometimes varies but standard B0100000001)
  -- Standard B + 01 + 8 digits = 11 chars
  -- E-CF E + 31 + 10 digits approx
  
  IF seq_series = 'E' THEN
     -- Format for e-CF: E310000000001 (Example)
     formatted_ncf := seq_series || seq_type || LPAD(next_val::text, 10, '0');
  ELSE
     -- Format for Standard: B0100000001
     formatted_ncf := seq_series || seq_type || LPAD(next_val::text, 8, '0');
  END IF;
  
  RETURN formatted_ncf;
END;
$$;
