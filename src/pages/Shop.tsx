import { Layout } from '@/components/layout/Layout';
import { useNativeProducts } from '@/hooks/useNativeProducts';
import { ProductCard } from '@/components/shop/ProductCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/animations/ScrollAnimations';

export default function Shop() {
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const { products, categories, loading, error } = useNativeProducts(selectedCategory);

  return (
    <Layout>
      <div className="container py-12">
        <FadeInUp>
          <div className="mb-8">
            <h1 className="font-display text-4xl font-bold">Tienda</h1>
            <p className="text-muted-foreground mt-2">Explora nuestra colección de suplementos premium</p>
          </div>
        </FadeInUp>

        {/* Categories Filter */}
        {categories.length > 0 && (
          <FadeInUp delay={0.1}>
            <div className="flex flex-wrap gap-2 mb-8">
              <Button
                variant={!selectedCategory ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(undefined)}
              >
                Todos
              </Button>
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </FadeInUp>
        )}

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
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6" staggerDelay={0.05}>
            {products.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>
    </Layout>
  );
}
