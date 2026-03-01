
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/shop/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';

interface RelatedProductsProps {
  currentProductId: string;
  category?: string;
}

export default function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRelated() {
      setLoading(true);
      try {
        let query = supabase
          .from('products')
          .select('*')
          .neq('id', currentProductId)
          .limit(4);

        if (category) {
            query = query.eq('category', category);
        }

        const { data } = await query;
        if (data) {
            setProducts(data);
        }
      } catch (error) {
        console.error('Error fetching related products:', error);
      } finally {
        setLoading(false);
      }
    }

    if (currentProductId) {
        fetchRelated();
    }
  }, [currentProductId, category]);

  if (loading) {
    return (
        <div className="space-y-6">
            <h3 className="text-2xl font-bold tracking-tight">Productos Relacionados</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="aspect-square rounded-xl w-full" />
                        <Skeleton className="h-4 w-2/3" />
                         <Skeleton className="h-4 w-1/3" />
                    </div>
                ))}
            </div>
        </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold tracking-tight">Productos Relacionados</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
