import { useState, useEffect } from 'react';
import { ShopifyProduct, storefrontApiRequest, PRODUCTS_QUERY, PRODUCT_BY_HANDLE_QUERY } from '@/lib/shopify';

export function useShopifyProducts(limit: number = 50, query?: string) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await storefrontApiRequest(PRODUCTS_QUERY, { first: limit, query });
        setProducts(data.data.products.edges);
        setError(null);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [limit, query]);

  return { products, loading, error };
}

export function useShopifyProduct(handle: string) {
  const [product, setProduct] = useState<ShopifyProduct['node'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!handle) return;
      
      try {
        setLoading(true);
        const data = await storefrontApiRequest(PRODUCT_BY_HANDLE_QUERY, { handle });
        setProduct(data.data.productByHandle);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch product');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [handle]);

  return { product, loading, error };
}
