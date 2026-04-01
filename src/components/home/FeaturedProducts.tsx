import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useNativeProducts } from '@/hooks/useNativeProducts';
import { ProductCard } from '@/components/shop/ProductCard';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { FadeInUp } from '@/components/animations/ScrollAnimations';

export function FeaturedProducts() {
  const { products, loading } = useNativeProducts();
  
  const featuredProducts = products.filter(p => p.featured).slice(0, 4);
  const displayProducts = featuredProducts.length > 0 ? featuredProducts : products.slice(0, 4);

  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <FadeInUp>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
                Selección curada
              </span>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight">
                Productos Destacados
              </h2>
            </div>
            <Button
              variant="outline"
              className="self-start md:self-auto uppercase tracking-wide font-bold rounded-full px-6 border-2 group"
              asChild
            >
              <Link to="/shop">
                Ver catálogo completo
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </FadeInUp>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-2xl border border-border">
            <p className="text-muted-foreground mb-6 text-lg">
              No hay productos disponibles aún
            </p>
            <Button asChild className="rounded-full px-8">
              <Link to="/shop">Explorar tienda</Link>
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
