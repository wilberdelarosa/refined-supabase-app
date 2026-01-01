import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Product } from '@/hooks/useProducts';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

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
      <div className="relative aspect-square overflow-hidden rounded-sm bg-muted mb-4 shadow-smooth transition-all duration-300 group-hover:shadow-smooth-lg">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <svg
              viewBox="0 0 60 100"
              fill="currentColor"
              className="w-16 h-24 text-muted-foreground/30 transition-transform duration-300 group-hover:scale-110"
            >
              <rect x="18" y="8" width="24" height="12" rx="2" />
              <rect x="12" y="20" width="36" height="72" rx="4" />
            </svg>
          </div>
        )}

        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-foreground text-background text-xs font-bold px-2 py-1 rounded-sm animate-scale-in">
            -{discountPercent}%
          </div>
        )}

        {/* Quick add button */}
        {product.stock > 0 && (
          <div className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <Button
              onClick={handleAddToCart}
              className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-300 hover:scale-105 shadow-lg"
              size="sm"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>
        )}

        {/* Out of stock overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-soft flex items-center justify-center">
            <span className="text-sm font-semibold uppercase tracking-wide">Agotado</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider transition-colors duration-300 group-hover:text-foreground">
          {product.category}
        </p>
        <h3 className="font-semibold text-sm md:text-base line-clamp-2 transition-colors duration-300 group-hover:text-foreground/80">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-bold transition-transform duration-300 group-hover:scale-105">
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
