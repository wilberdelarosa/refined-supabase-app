
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';

export type ShopSortBy = 'created_at' | 'price_asc' | 'price_desc' | 'name' | 'discount' | 'featured';

export interface ShopFilters {
  category?: string;
  search?: string;
  sortBy?: ShopSortBy;
  inStockOnly?: boolean;
  featuredOnly?: boolean;
  priceMin?: number;
  priceMax?: number;
}

export function useNativeProducts(filters?: ShopFilters | string) {
  // Backward compat: accept category string as before
  const resolvedFilters: ShopFilters | undefined =
    typeof filters === 'string'
      ? { category: filters === 'all' ? undefined : filters }
      : filters;

  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories only once
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('products')
        .select('category')
        .order('category');

      if (data) {
        const unique = [...new Set(data.map((p) => p.category))].filter(Boolean);
        setCategories(unique);
      }
    }
    fetchCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        setError(null);

        let query = supabase.from('products').select('*');

        // Search (multi-field)
        const search = resolvedFilters?.search?.trim();
        if (search) {
          const pattern = `%${search}%`;
          // Note: using raw filter for OR to support multiple columns
          query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
        }

        // Category
        if (resolvedFilters?.category && resolvedFilters.category !== 'all') {
            // Handle special cases if any, otherwise exact match
            query = query.eq('category', resolvedFilters.category);
        }

        // In stock only
        if (resolvedFilters?.inStockOnly) {
          query = query.gt('stock', 0);
        }

        // Featured only
        if (resolvedFilters?.featuredOnly) {
          query = query.eq('featured', true);
        }

        // Price range
        if (resolvedFilters?.priceMin != null) {
          query = query.gte('price', resolvedFilters.priceMin);
        }
        if (resolvedFilters?.priceMax != null) {
          query = query.lte('price', resolvedFilters.priceMax);
        }

        // Sort (server-side where possible)
        const sortBy = resolvedFilters?.sortBy || 'created_at';
        
        // Apply sorting
        switch (sortBy) {
          case 'price_asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price_desc':
            query = query.order('price', { ascending: false });
            break;
          case 'name':
            query = query.order('name', { ascending: true });
            break;
          case 'featured':
            query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
            break;
          case 'discount':
             // For discount, we might sort client side or just default to created_at + client sort
             // But let's keep created_at as base
             query = query.order('created_at', { ascending: false });
             break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data, error: fetchError } = await query;

        if (fetchError) throw fetchError;

        let result = (data || []) as Product[];

        // Client-side sort for discount (products with discount first)
        if (sortBy === 'discount') {
          result = [...result].sort((a, b) => {
            const aHasDiscount = a.original_price != null && a.original_price > a.price;
            const bHasDiscount = b.original_price != null && b.original_price > b.price;
            if (aHasDiscount && !bHasDiscount) return -1;
            if (!aHasDiscount && bHasDiscount) return 1;
            if (aHasDiscount && bHasDiscount) {
                // Both have discount, sort by magnitude % ?? or just price?
                // For now, simpler is better
                return 0;
            }
            return 0;
          });
        }

        setProducts(result);
        setFeaturedProducts(result.filter((p) => p.featured));

      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar productos');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    // Debounce a bit to avoid thrashing if rapid changes (though search is debounced in UI)
    const timeoutId = setTimeout(fetchProducts, 50);
    return () => clearTimeout(timeoutId);

  }, [
    resolvedFilters?.category,
    resolvedFilters?.search,
    resolvedFilters?.sortBy,
    resolvedFilters?.inStockOnly,
    resolvedFilters?.featuredOnly,
    resolvedFilters?.priceMin,
    resolvedFilters?.priceMax,
  ]);

  return { products, featuredProducts, categories, loading, error };
}

export function useNativeProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        setProduct(data);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Producto no encontrado');
        setProduct(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  return { product, loading, error };
}
