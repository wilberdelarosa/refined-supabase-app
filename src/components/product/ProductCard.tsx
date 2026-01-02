import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart();
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - product.price / product.original_price!) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await addToCart(product.id);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price).replace('DOP', 'RD$');
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className={cn("group block", className)}
    >
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
      <div className="relative aspect-square overflow-hidden rounded-xl bg-white mb-4 shadow-md group-hover:shadow-xl transition-all duration-300">
        {product.image_url ? (
          <motion.img
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.4 }}
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-contain p-4"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-card">
            <svg
              viewBox="0 0 60 100"
              fill="currentColor"
              className="w-16 h-24 text-muted-foreground/30"
            >
              <rect x="18" y="8" width="24" height="12" rx="2" />
              <rect x="12" y="20" width="36" height="72" rx="4" />
            </svg>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg animate-pulse-subtle">
            -{discountPercent}%
          </div>
        )}

        {/* Featured badge */}
        {product.featured && (
          <div className="absolute top-3 right-3 bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
            ⭐
          </div>
        )}

        {/* Quick add button */}
        {product.stock > 0 && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <Button
              onClick={handleAddToCart}
              className="w-full bg-foreground text-background hover:bg-foreground/90 shadow-lg font-bold"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Agregar al Carrito
            </Button>
          </div>
        )}

        {/* Out of stock overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <span className="text-sm font-bold uppercase tracking-wide block mb-1">Agotado</span>
              <span className="text-xs text-muted-foreground">Sin stock disponible</span>
            </div>
          </div>
        )}
      </div>
      </motion.div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
            {product.category}
          </p>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-xs text-orange-600 dark:text-orange-400 font-bold">
              ¡Solo {product.stock}!
            </span>
          )}
        </div>
        <h3 className="font-bold text-sm md:text-base line-clamp-2 group-hover:text-muted-foreground transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-bold text-lg">
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              {formatPrice(product.original_price!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
