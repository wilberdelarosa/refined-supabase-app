import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product_handle: string;
  product_title: string;
  product_image_url: string | null;
  product_price: string | null;
  created_at: string;
}

export function useWishlist() {
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
      const { data, error } = await supabase
        .from('wishlist')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching wishlist:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const addToWishlist = async (product: {
    product_id: string;
    product_handle: string;
    product_title: string;
    product_image_url?: string;
    product_price?: string;
  }) => {
    if (!user) {
      toast.error('Debes iniciar sesión para agregar favoritos');
      return false;
    }

    try {
      const { error } = await supabase.from('wishlist').insert({
        user_id: user.id,
        product_id: product.product_id,
        product_handle: product.product_handle,
        product_title: product.product_title,
        product_image_url: product.product_image_url || null,
        product_price: product.product_price || null,
      });

      if (error) {
        if (error.code === '23505') {
          toast.info('Este producto ya está en tus favoritos');
          return false;
        }
        throw error;
      }

      await fetchWishlist();
      toast.success('Agregado a favoritos');
      return true;
    } catch (err) {
      console.error('Error adding to wishlist:', err);
      toast.error('Error al agregar a favoritos');
      return false;
    }
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) throw error;

      await fetchWishlist();
      toast.success('Eliminado de favoritos');
      return true;
    } catch (err) {
      console.error('Error removing from wishlist:', err);
      toast.error('Error al eliminar de favoritos');
      return false;
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item.product_id === productId);
  };

  const toggleWishlist = async (product: {
    product_id: string;
    product_handle: string;
    product_title: string;
    product_image_url?: string;
    product_price?: string;
  }) => {
    if (isInWishlist(product.product_id)) {
      return removeFromWishlist(product.product_id);
    } else {
      return addToWishlist(product);
    }
  };

  return {
    items,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    refetch: fetchWishlist,
  };
}
