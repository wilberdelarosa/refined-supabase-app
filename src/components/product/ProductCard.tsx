import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format-currency';
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

  return (
    <Link
      to={`/product/${product.id}`}
      className={cn("group block", className)}
    >
      <motion.div
        whileHover={{ y: -6 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-muted/30 mb-4 border border-border/50 group-hover:border-border group-hover:shadow-xl transition-all duration-500">
          {product.image_url ? (
            <motion.img
              whileHover={{ scale: 1.08 }}
              transition={{ duration: 0.5 }}
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain p-6"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <div className="text-muted-foreground/20 text-5xl">📦</div>
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount && (
            <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              -{discountPercent}%
            </div>
          )}

          {/* Featured badge */}
          {product.featured && (
            <div className="absolute top-3 right-3 bg-foreground text-background text-[10px] font-bold px-2.5 py-1 rounded-full">
              DESTACADO
            </div>
          )}

          {/* Quick add button */}
          {product.stock > 0 && (
            <div className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-3 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <Button
                onClick={handleAddToCart}
                className="w-full bg-foreground text-background hover:bg-foreground/90 shadow-xl font-bold rounded-full h-10"
                size="sm"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
          )}

          {/* Out of stock overlay */}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
              <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Agotado</span>
            </div>
          )}
        </div>
      </motion.div>

      <div className="space-y-1.5 px-1">
        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-bold">
            {product.category}
          </p>
          {product.stock > 0 && product.stock <= 5 && (
            <span className="text-[10px] text-destructive font-bold">
              ¡Últimas {product.stock}!
            </span>
          )}
        </div>
        <h3 className="font-bold text-sm leading-tight line-clamp-2 group-hover:text-muted-foreground transition-colors min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-center gap-2 pt-1">
          <span className="font-black text-lg">
            {formatCurrency(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(product.original_price!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
