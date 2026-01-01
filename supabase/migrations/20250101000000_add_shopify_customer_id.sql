-- Add shopify_customer_id column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS shopify_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_shopify_customer_id 
ON profiles(shopify_customer_id);

-- Add comment to document the column
COMMENT ON COLUMN profiles.shopify_customer_id IS 'Shopify Customer ID for synced users';

-- Update RLS policies if needed (profiles should already have proper policies)
-- No changes needed if profiles table already has proper RLS
