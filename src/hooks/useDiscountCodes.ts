import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DiscountCode } from '@/types/product';
import { useAuth } from '@/lib/auth-context';

interface ValidatedDiscount {
  code: DiscountCode;
  discountAmount: number;
}

export function useDiscountCodes() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateCode = useCallback(async (code: string, subtotal: number): Promise<ValidatedDiscount | null> => {
    if (!code.trim()) {
      setError('Ingresa un código de descuento');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: discountCode, error: fetchError } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', code.toUpperCase().trim())
        .eq('is_active', true)
        .single();

      if (fetchError || !discountCode) {
        setError('Código de descuento no válido');
        return null;
      }

      if (discountCode.ends_at && new Date(discountCode.ends_at) < new Date()) {
        setError('Este código ha expirado');
        return null;
      }

      if (new Date(discountCode.starts_at) > new Date()) {
        setError('Este código aún no está activo');
        return null;
      }

      if (subtotal < discountCode.min_purchase_amount) {
        setError(`Compra mínima de DOP ${discountCode.min_purchase_amount.toLocaleString()} requerida`);
        return null;
      }

      if (discountCode.max_uses && discountCode.uses_count >= discountCode.max_uses) {
        setError('Este código ha alcanzado su límite de usos');
        return null;
      }

      if (user) {
        const { data: usages } = await supabase
          .from('discount_usages')
          .select('id')
          .eq('discount_code_id', discountCode.id)
          .eq('user_id', user.id);

        if (usages && usages.length >= discountCode.max_uses_per_user) {
          setError('Ya has utilizado este código');
          return null;
        }
      }

      let discountAmount = 0;
      if (discountCode.discount_type === 'percentage') {
        discountAmount = (subtotal * discountCode.discount_value) / 100;
      } else {
        discountAmount = Math.min(discountCode.discount_value, subtotal);
      }

      return {
        code: discountCode as DiscountCode,
        discountAmount
      };
    } catch (err) {
      console.error('Error validating discount code:', err);
      setError('Error al validar el código');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const applyDiscount = useCallback(async (discountCodeId: string, orderId: string, discountAmount: number) => {
    if (!user) return false;

    try {
      await supabase
        .from('discount_usages')
        .insert({
          discount_code_id: discountCodeId,
          user_id: user.id,
          order_id: orderId,
          discount_amount: discountAmount
        });

      // Update uses_count directly
      const { data: codeData } = await supabase
        .from('discount_codes')
        .select('uses_count')
        .eq('id', discountCodeId)
        .single();
      
      if (codeData) {
        await supabase
          .from('discount_codes')
          .update({ uses_count: (codeData.uses_count || 0) + 1 })
          .eq('id', discountCodeId);
      }

      return true;
    } catch (err) {
      console.error('Error applying discount:', err);
      return false;
    }
  }, [user]);

  return {
    validateCode,
    applyDiscount,
    loading,
    error,
    clearError: () => setError(null)
  };
}
