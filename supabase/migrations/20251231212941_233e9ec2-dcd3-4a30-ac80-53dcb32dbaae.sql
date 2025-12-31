-- Create discount_codes table for native discounts
CREATE TABLE public.discount_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC NOT NULL CHECK (discount_value > 0),
  min_purchase_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  max_uses_per_user INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create discount_usages table to track who used what code
CREATE TABLE public.discount_usages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discount_code_id UUID NOT NULL REFERENCES public.discount_codes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_amount NUMERIC NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(discount_code_id, user_id, order_id)
);

-- Add discount columns to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS discount_code_id UUID REFERENCES public.discount_codes(id),
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS subtotal NUMERIC;

-- Update existing orders to set subtotal = total for backwards compatibility
UPDATE public.orders SET subtotal = total WHERE subtotal IS NULL;

-- Enable RLS
ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_usages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discount_codes
CREATE POLICY "Anyone can view active discount codes" 
ON public.discount_codes 
FOR SELECT 
USING (is_active = true AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins can manage discount codes" 
ON public.discount_codes 
FOR ALL 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- RLS Policies for discount_usages
CREATE POLICY "Users can view their own discount usages" 
ON public.discount_usages 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System can insert discount usages" 
ON public.discount_usages 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all discount usages" 
ON public.discount_usages 
FOR SELECT 
USING (is_admin(auth.uid()) OR has_role(auth.uid(), 'manager'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_discount_codes_updated_at
BEFORE UPDATE ON public.discount_codes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_discount_codes_code ON public.discount_codes(code);
CREATE INDEX idx_discount_codes_active ON public.discount_codes(is_active, starts_at, ends_at);
CREATE INDEX idx_discount_usages_user ON public.discount_usages(user_id);
CREATE INDEX idx_discount_usages_code ON public.discount_usages(discount_code_id);