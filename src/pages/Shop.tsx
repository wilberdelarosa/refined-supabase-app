import { Layout } from '@/components/layout/Layout';
import { useShopifyProducts } from '@/hooks/useShopifyProducts';
import { ShopifyProductCard } from '@/components/shop/ShopifyProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';

export default function Shop() {
  const { products, loading, error } = useShopifyProducts(50);

  return (
    <Layout>
      <div className="container py-12">
        <div className="mb-8">
          <h1 className="font-display text-4xl font-bold">Tienda</h1>
          <p className="text-muted-foreground mt-2">Explora nuestra colección de suplementos premium</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-card rounded-lg border">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">Error al cargar productos</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold text-lg mb-2">No hay productos disponibles</h3>
            <p className="text-muted-foreground">
              Pronto agregaremos más productos a nuestra tienda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ShopifyProductCard key={product.node.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
