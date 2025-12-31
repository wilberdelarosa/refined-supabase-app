// Native product types for Supabase
export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  stock: number;
  category: string;
  image_url: string | null;
  featured: boolean | null;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface DiscountCode {
  id: string;
  code: string;
  description: string | null;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  min_purchase_amount: number;
  max_uses: number | null;
  uses_count: number;
  max_uses_per_user: number;
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}
