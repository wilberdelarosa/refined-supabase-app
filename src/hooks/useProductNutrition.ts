import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface NutritionFacts {
  calories?: string;
  protein?: string;
  carbohydrates?: string;
  fat?: string;
  fiber?: string;
  sodium?: string;
  sugar?: string;
  saturated_fat?: string;
  cholesterol?: string;
  other?: Array<{ name: string; value: string }>;
}

export interface ProductNutrition {
  id: string;
  product_id: string;
  serving_size: string | null;
  servings_per_container: number | null;
  nutrition_facts: NutritionFacts;
  ingredients: string | null;
  allergens: string[] | null;
}

export function useProductNutrition(productId: string | undefined) {
  const [nutrition, setNutrition] = useState<ProductNutrition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!productId) { setLoading(false); return; }

    async function fetch() {
      setLoading(true);
      const { data } = await supabase
        .from('product_nutrition')
        .select('*')
        .eq('product_id', productId)
        .maybeSingle();

      setNutrition(data as ProductNutrition | null);
      setLoading(false);
    }
    fetch();
  }, [productId]);

  return { nutrition, loading };
}
