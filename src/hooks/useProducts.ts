import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  category: string;
  stock: number;
  featured: boolean;
  created_at: string;
}

export function useProducts(category?: string) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from('products').select('*').order('created_at', { ascending: false });
      
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching products:', error);
      } else {
        setProducts(data || []);
      }
      setLoading(false);
    };

    const fetchCategories = async () => {
      const { data } = await supabase
        .from('products')
        .select('category')
        .order('category');
      
      if (data) {
        const unique = [...new Set(data.map(p => p.category))];
        setCategories(unique);
      }
    };

    fetchProducts();
    fetchCategories();
  }, [category]);

  const featuredProducts = products.filter(p => p.featured);

  return { products, featuredProducts, categories, loading };
}

export function useProduct(id: string) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching product:', error);
      } else {
        setProduct(data);
      }
      setLoading(false);
    };

    if (id) fetchProduct();
  }, [id]);

  return { product, loading };
}
