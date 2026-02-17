import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/product';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
}

export default function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('category', category)
        .neq('id', currentProductId)
        .limit(4);

      if (data) setProducts(data);
    }
    fetch();
  }, [currentProductId, category]);

  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Productos Relacionados</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link key={product.id} to={`/product/${product.id}`}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-3 space-y-2">
                <div className="aspect-square bg-muted rounded-md overflow-hidden">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-contain p-2" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      Sin imagen
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                <p className="text-sm font-bold text-primary">
                  DOP {product.price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
                {product.stock <= 0 && (
                  <Badge variant="destructive" className="text-xs">Agotado</Badge>
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
