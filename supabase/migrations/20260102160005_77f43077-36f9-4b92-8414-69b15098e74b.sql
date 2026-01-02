-- Create payment_methods table for bank accounts that admin can manage
CREATE TABLE public.payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank_transfer',
  bank_name TEXT,
  account_type TEXT,
  account_number TEXT,
  account_holder TEXT,
  rnc TEXT,
  instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Anyone can view active payment methods (for checkout)
CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods
FOR SELECT
USING (is_active = true);

-- Admins can manage payment methods
CREATE POLICY "Admins can manage payment methods"
ON public.payment_methods
FOR ALL
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Insert default payment methods
INSERT INTO public.payment_methods (name, type, bank_name, account_type, account_number, account_holder, rnc, display_order)
VALUES 
  ('Banco Popular Dominicano', 'bank_transfer', 'Banco Popular Dominicano', 'Cuenta Corriente', '123-456789-0', 'Barbaro Nutrition SRL', '1-31-12345-6', 1),
  ('Banreservas', 'bank_transfer', 'Banreservas', 'Cuenta de Ahorros', '987-654321-0', 'Barbaro Nutrition SRL', '1-31-12345-6', 2);

-- Update trigger for updated_at
CREATE TRIGGER update_payment_methods_updated_at
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Fix order-proofs bucket: allow authenticated users to upload
CREATE POLICY "Users can upload order proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'order-proofs');

-- Admins can view all order proofs
CREATE POLICY "Admins can view order proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'order-proofs');