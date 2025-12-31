import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Types for Shopify Admin API responses
export interface ShopifyAdminProduct {
  id: number;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type: string;
  handle: string;
  status: 'active' | 'draft' | 'archived';
  images: Array<{
    id: number;
    src: string;
    alt: string | null;
  }>;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string | null;
    inventory_quantity: number;
    inventory_item_id: number;
  }>;
  options: Array<{
    id: number;
    name: string;
    values: string[];
  }>;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface ShopifyInventoryLevel {
  inventory_item_id: number;
  location_id: number;
  available: number;
}

export interface ShopifyPriceRule {
  id: number;
  title: string;
  target_type: string;
  target_selection: string;
  allocation_method: string;
  value_type: string;
  value: string;
  once_per_customer: boolean;
  usage_limit: number | null;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
}

export interface ShopifyDiscountCode {
  id: number;
  price_rule_id: number;
  code: string;
  usage_count: number;
  created_at: string;
}

// Hook for Shopify Admin operations
export function useShopifyAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generic function to call edge function for admin API
  const callAdminApi = useCallback(async (action: string, data: Record<string, any> = {}) => {
    setLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('shopify-admin', {
        body: { action, ...data }
      });

      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);

      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Products
  const getProducts = useCallback(async (limit = 50) => {
    return callAdminApi('get_products', { limit });
  }, [callAdminApi]);

  const getProduct = useCallback(async (productId: number) => {
    return callAdminApi('get_product', { product_id: productId });
  }, [callAdminApi]);

  const createProduct = useCallback(async (product: Partial<ShopifyAdminProduct>) => {
    return callAdminApi('create_product', { product });
  }, [callAdminApi]);

  const updateProduct = useCallback(async (productId: number, product: Partial<ShopifyAdminProduct>) => {
    return callAdminApi('update_product', { product_id: productId, product });
  }, [callAdminApi]);

  const deleteProduct = useCallback(async (productId: number) => {
    return callAdminApi('delete_product', { product_id: productId });
  }, [callAdminApi]);

  // Inventory
  const getInventoryLevels = useCallback(async (inventoryItemIds: number[]) => {
    return callAdminApi('get_inventory_levels', { inventory_item_ids: inventoryItemIds });
  }, [callAdminApi]);

  const adjustInventory = useCallback(async (inventoryItemId: number, locationId: number, adjustment: number) => {
    return callAdminApi('adjust_inventory', { 
      inventory_item_id: inventoryItemId, 
      location_id: locationId, 
      adjustment 
    });
  }, [callAdminApi]);

  const setInventory = useCallback(async (inventoryItemId: number, locationId: number, quantity: number) => {
    return callAdminApi('set_inventory', { 
      inventory_item_id: inventoryItemId, 
      location_id: locationId, 
      quantity 
    });
  }, [callAdminApi]);

  // Price Rules
  const getPriceRules = useCallback(async (limit = 50) => {
    return callAdminApi('get_price_rules', { limit });
  }, [callAdminApi]);

  const createPriceRule = useCallback(async (priceRule: Partial<ShopifyPriceRule>) => {
    return callAdminApi('create_price_rule', { price_rule: priceRule });
  }, [callAdminApi]);

  const updatePriceRule = useCallback(async (priceRuleId: number, priceRule: Partial<ShopifyPriceRule>) => {
    return callAdminApi('update_price_rule', { price_rule_id: priceRuleId, price_rule: priceRule });
  }, [callAdminApi]);

  const deletePriceRule = useCallback(async (priceRuleId: number) => {
    return callAdminApi('delete_price_rule', { price_rule_id: priceRuleId });
  }, [callAdminApi]);

  // Discount Codes
  const getDiscountCodes = useCallback(async (priceRuleId: number) => {
    return callAdminApi('get_discount_codes', { price_rule_id: priceRuleId });
  }, [callAdminApi]);

  const createDiscountCode = useCallback(async (priceRuleId: number, code: string) => {
    return callAdminApi('create_discount_code', { price_rule_id: priceRuleId, code });
  }, [callAdminApi]);

  const deleteDiscountCode = useCallback(async (priceRuleId: number, discountCodeId: number) => {
    return callAdminApi('delete_discount_code', { price_rule_id: priceRuleId, discount_code_id: discountCodeId });
  }, [callAdminApi]);

  // Locations
  const getLocations = useCallback(async () => {
    return callAdminApi('get_locations');
  }, [callAdminApi]);

  return {
    loading,
    error,
    // Products
    getProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    // Inventory
    getInventoryLevels,
    adjustInventory,
    setInventory,
    // Price Rules
    getPriceRules,
    createPriceRule,
    updatePriceRule,
    deletePriceRule,
    // Discount Codes
    getDiscountCodes,
    createDiscountCode,
    deleteDiscountCode,
    // Locations
    getLocations,
  };
}
