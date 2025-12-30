import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function FeaturedProducts() {
  const { featuredProducts, loading } = useProducts();
  const displayProducts = featuredProducts.slice(0, 4);

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-sm font-medium text-primary uppercase tracking-widest">
              Selección Especial
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">
              Productos Destacados
            </h2>
          </div>
          <Button variant="ghost" className="self-start md:self-auto" asChild>
            <Link to="/shop?featured=true">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[3/4] rounded-lg" />
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map((product, index) => (
              <div 
                key={product.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-secondary/30 rounded-2xl">
            <p className="text-muted-foreground mb-4">
              Aún no hay productos destacados
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
