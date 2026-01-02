-- Create simple test table with 3 columns
CREATE TABLE IF NOT EXISTS public.pruebadev (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    edad INTEGER NOT NULL
);

-- Add comment
COMMENT ON TABLE public.pruebadev IS 'Tabla de prueba simple con 3 columnas';

-- Enable RLS
ALTER TABLE public.pruebadev ENABLE ROW LEVEL SECURITY;

-- Create policy for public access
CREATE POLICY "Anyone can view pruebadev"
ON public.pruebadev FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert pruebadev"
ON public.pruebadev FOR INSERT
WITH CHECK (true);

-- Insert 10 sample records
INSERT INTO public.pruebadev (nombre, edad) VALUES
('Juan Pérez', 25),
('María García', 30),
('Carlos López', 28),
('Ana Martínez', 22),
('Pedro Rodríguez', 35),
('Laura Sánchez', 27),
('Miguel Torres', 31),
('Isabel Ramírez', 24),
('Diego Flores', 29),
('Carmen González', 26)
ON CONFLICT DO NOTHING;
