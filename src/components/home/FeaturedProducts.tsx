import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useNativeProducts } from '@/hooks/useNativeProducts';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FadeInUp, StaggerContainer, StaggerItem } from '@/components/animations/ScrollAnimations';

export function FeaturedProducts() {
  const { products, loading } = useNativeProducts();
  
  // Get only featured products or first 4
  const featuredProducts = products.filter(p => p.featured).slice(0, 4);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);

  return (
    <section className="py-16 md:py-24 bg-muted/50">
      <div className="container">
        {/* Header */}
        <FadeInUp>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">
                Productos Destacados
              </h2>
              <p className="text-muted-foreground">
                Los favoritos de nuestros clientes
              </p>
            </div>
            <Button variant="ghost" className="self-start md:self-auto uppercase tracking-wide font-semibold" asChild>
              <Link to="/shop">
                Ver todos los productos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </FadeInUp>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-lg" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map((product) => (
              <StaggerItem key={product.id}>
                <ProductCard product={product} />
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="text-center py-16 bg-card rounded-lg border border-border">
            <p className="text-muted-foreground mb-4">
              No hay productos disponibles
            </p>
            <Button asChild>
              <Link to="/shop">Ver todos los productos</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
