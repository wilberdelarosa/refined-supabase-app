-- Rename wishlist column to remove provider-specific naming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'wishlist' 
      AND column_name = 'shopify_product_id'
  ) THEN
    ALTER TABLE public.wishlist RENAME COLUMN shopify_product_id TO product_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' 
      AND indexname = 'wishlist_user_id_shopify_product_id_key'
  ) THEN
    ALTER INDEX wishlist_user_id_shopify_product_id_key RENAME TO wishlist_user_id_product_id_key;
  END IF;
END$$;
