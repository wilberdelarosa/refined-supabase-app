-- Create invoices table
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    invoice_number TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    subtotal NUMERIC NOT NULL,
    tax_rate NUMERIC NOT NULL DEFAULT 0.18,
    tax_amount NUMERIC NOT NULL,
    total NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'issued',
    pdf_url TEXT,
    billing_name TEXT,
    billing_address TEXT,
    billing_rnc TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_lines table
CREATE TABLE public.invoice_lines (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC NOT NULL,
    total NUMERIC NOT NULL
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;

-- Invoices policies - users can view their own invoices
CREATE POLICY "Users can view their own invoices"
ON public.invoices
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices"
ON public.invoices
FOR SELECT
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Admins can create invoices
CREATE POLICY "Admins can create invoices"
ON public.invoices
FOR INSERT
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Admins can update invoices
CREATE POLICY "Admins can update invoices"
ON public.invoices
FOR UPDATE
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Invoice lines policies
CREATE POLICY "Users can view their invoice lines"
ON public.invoice_lines
FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.invoices
    WHERE invoices.id = invoice_lines.invoice_id
    AND invoices.user_id = auth.uid()
));

CREATE POLICY "Admins can manage invoice lines"
ON public.invoice_lines
FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Create sequence for invoice numbers
CREATE SEQUENCE IF NOT EXISTS invoice_number_seq START 1001;

-- Function to generate invoice number
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

-- Trigger for updated_at
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();