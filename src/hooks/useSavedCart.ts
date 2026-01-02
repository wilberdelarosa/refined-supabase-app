import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore, CartItem } from '@/stores/cartStore';

export function useSavedCart() {
  const { user } = useAuth();
  const items = useCartStore((state) => state.items);
  const isLoading = useCartStore((state) => state.isLoading);
  const initialLoadDone = useRef(false);

  // Load cart from database when user logs in
  const loadCart = useCallback(async () => {
    if (!user || initialLoadDone.current) return;

    try {
      const { data, error } = await supabase
        .from('saved_carts')
        .select('cart_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.cart_data && Array.isArray(data.cart_data) && data.cart_data.length > 0) {
        // Merge saved cart with current local cart
        const savedItems = Array.isArray(data.cart_data) ? (data.cart_data as CartItem[]) : [];
        const currentItems = useCartStore.getState().items;
        
        // Combine items, preferring saved quantities for duplicates
        const mergedItems = [...savedItems];
        currentItems.forEach(localItem => {
          const exists = mergedItems.find(i => i.product.id === localItem.product.id);
          if (!exists) {
            mergedItems.push(localItem);
          }
        });

        useCartStore.setState({ items: mergedItems });
      }
      
      initialLoadDone.current = true;
    } catch (err) {
      console.error('Error loading saved cart:', err);
    }
  }, [user]);

  // Save cart to database when it changes
  const saveCart = useCallback(async () => {
    if (!user || !initialLoadDone.current) return;

    try {
      const payload = {
        user_id: user.id,
        cart_data: items,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('saved_carts')
        .upsert(payload, {
          onConflict: 'user_id',
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving cart:', err);
    }
  }, [user, items]);

  // Load cart on mount when user is present
  useEffect(() => {
    if (user) {
      loadCart();
    } else {
      initialLoadDone.current = false;
    }
  }, [user, loadCart]);

  // Save cart when items change (debounced effect)
  useEffect(() => {
    if (!user || !initialLoadDone.current || isLoading) return;

    const timeout = setTimeout(() => {
      saveCart();
    }, 1000); // Debounce saves

    return () => clearTimeout(timeout);
  }, [items, user, saveCart, isLoading]);

  return { loadCart, saveCart };
}
