import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/integrations/supabase/client';
import { useCartStore, CartItem } from '@/stores/cartStore';
import type { Json } from '@/integrations/supabase/types';

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

      if (data) {
        let savedItems: CartItem[] = [];
        
        if (data.cart_data && Array.isArray(data.cart_data)) {
           savedItems = data.cart_data as unknown as CartItem[];
        }

        // VALIDATION: Filter out products that no longer exist in DB
        // This fixes "products not in database" causing checkout errors
        if (savedItems.length > 0) {
           const productIds = savedItems.map(i => i.product.id);
           const { data: dbProducts } = await supabase
             .from('products')
             .select('id, price, stock, name, image_url')
             .in('id', productIds);
             
           if (dbProducts) {
             const validIds = new Set(dbProducts.map(p => p.id));
             savedItems = savedItems.filter(i => validIds.has(i.product.id));
             
             // Update stale data (price/stock changes)
             savedItems = savedItems.map(item => {
                const fresh = dbProducts.find(p => p.id === item.product.id);
                if (fresh) {
                     return { 
                         ...item, 
                         product: { 
                             ...item.product, 
                             ...fresh
                         }
                     };
                }
                return item;
             });
           }
        }

        // SYNC STRATEGY: Server Wins (to fix "deleted item reappears")
        // If the user has a saved cart state (even empty), we respect it over local storage
        // This prevents items deleted on one device (or previous session) from being resurrected by local storage
        
        // However, if server is empty but local has items (Guest mode -> Login), 
        // we might want to keep local? 
        // The user complaint specifically mentions "deleted item reappears", implying the server state (empty) was ignored.
        // So we will prioritize server state if it exists.
        
        // If savedItems is empty, but we confirm we fetched a row, it means the user's cart IS empty.
        // So we set items to empty.
        
        useCartStore.setState({ items: savedItems });
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
      const { error } = await supabase
        .from('saved_carts')
        .upsert({
          user_id: user.id,
          cart_data: items as unknown as Json,
          updated_at: new Date().toISOString(),
        }, {
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
