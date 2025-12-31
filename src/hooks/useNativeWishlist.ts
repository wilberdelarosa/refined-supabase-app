import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { Product } from '@/types/product';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product?: Product;
  created_at: string;
}

export function useNativeWishlist() {
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map old wishlist format to new format
      const mappedItems: WishlistItem[] = (data || []).map(item => ({
        id: item.id,
        user_id: item.user_id,
        product_id: item.shopify_product_id, // Using shopify_product_id as product_id for backwards compat
        created_at: item.created_at
      }));
      
      setItems(mappedItems);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (product: Product) => {
    if (!user) {
      toast.error('Inicia sesión para agregar a favoritos');
      return;
    }

    try {
      const { error } = await supabase
        .from('wishlist')
        .insert({
          user_id: user.id,
          shopify_product_id: product.id,
          product_handle: product.id,
          product_title: product.name,
          product_image_url: product.image_url,
          product_price: product.price.toString()
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('Este producto ya está en tu lista de deseos');
          return;
        }
        throw error;
      }

      toast.success('Agregado a favoritos');
      fetchWishlist();
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      toast.error('Error al agregar a favoritos');
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('shopify_product_id', productId);

      if (error) throw error;

      toast.success('Eliminado de favoritos');
      fetchWishlist();
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error('Error al eliminar de favoritos');
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item.product_id === productId);
  };

  const toggleWishlist = async (product: Product) => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
    } else {
      await addToWishlist(product);
    }
  };

  return {
    items,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    refetch: fetchWishlist
  };
}
