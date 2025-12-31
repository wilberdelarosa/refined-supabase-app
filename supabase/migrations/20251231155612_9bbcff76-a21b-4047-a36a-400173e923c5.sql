-- Create wishlist/favorites table for storing user favorites
CREATE TABLE public.wishlist (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    shopify_product_id TEXT NOT NULL,
    product_handle TEXT NOT NULL,
    product_title TEXT NOT NULL,
    product_image_url TEXT,
    product_price TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, shopify_product_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlist
CREATE POLICY "Users can view their own wishlist"
ON public.wishlist
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add to their own wishlist
CREATE POLICY "Users can add to their own wishlist"
ON public.wishlist
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove from their own wishlist
CREATE POLICY "Users can remove from their own wishlist"
ON public.wishlist
FOR DELETE
USING (auth.uid() = user_id);

-- Create saved_carts table for persisting carts per user
CREATE TABLE public.saved_carts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    cart_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_carts ENABLE ROW LEVEL SECURITY;

-- Users can view their own cart
CREATE POLICY "Users can view their own cart"
ON public.saved_carts
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own cart
CREATE POLICY "Users can insert their own cart"
ON public.saved_carts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own cart
CREATE POLICY "Users can update their own cart"
ON public.saved_carts
FOR UPDATE
USING (auth.uid() = user_id);

-- Add avatar_url column if not exists (should exist but making sure)
-- Add indexes for better performance
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_saved_carts_user_id ON public.saved_carts(user_id);

-- Trigger to update updated_at on saved_carts
CREATE TRIGGER update_saved_carts_updated_at
BEFORE UPDATE ON public.saved_carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();