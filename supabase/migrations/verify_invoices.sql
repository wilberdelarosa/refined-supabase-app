-- Script para verificar y arreglar problemas de facturas
-- Ejecutar en el SQL Editor de Supabase

-- 1. Verificar si existe la función generate_invoice_number
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'generate_invoice_number';

-- 2. Verificar si existe la secuencia
SELECT sequence_name 
FROM information_schema.sequences 
WHERE sequence_schema = 'public' 
AND sequence_name = 'invoice_number_seq';

-- 3. Contar facturas existentes
SELECT COUNT(*) as total_invoices FROM public.invoices;

-- 4. Ver facturas recientes
SELECT 
    i.id,
    i.invoice_number,
    i.order_id,
    i.total,
    i.status,
    i.created_at,
    o.status as order_status
FROM public.invoices i
LEFT JOIN public.orders o ON o.id = i.order_id
ORDER BY i.created_at DESC
LIMIT 10;

-- 5. Ver pedidos sin factura
SELECT 
    o.id,
    o.status,
    o.total,
    o.created_at,
    COUNT(i.id) as invoice_count
FROM public.orders o
LEFT JOIN public.invoices i ON i.order_id = o.id
WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
GROUP BY o.id, o.status, o.total, o.created_at
HAVING COUNT(i.id) = 0
ORDER BY o.created_at DESC;

-- 6. Verificar permisos RLS en invoices
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('invoices', 'invoice_lines')
ORDER BY tablename, policyname;

-- 7. Si necesitas recrear la secuencia (OPCIONAL - solo si no existe)
-- DROP SEQUENCE IF EXISTS invoice_number_seq CASCADE;
-- CREATE SEQUENCE invoice_number_seq START 1001;

-- 8. Si necesitas recrear la función (OPCIONAL - solo si no existe)
/*
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    next_num INTEGER;
    year_prefix TEXT;
BEGIN
    next_num := nextval('invoice_number_seq');
    year_prefix := to_char(now(), 'YYYY');
    RETURN 'INV-' || year_prefix || '-' || lpad(next_num::text, 6, '0');
END;
$$;
*/

-- 9. Probar la generación de número de factura
SELECT public.generate_invoice_number() as test_invoice_number;
