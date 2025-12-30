import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';
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

  return (
    <Link 
      to={`/product/${product.id}`}
      className={cn(
        "group block",
        className
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-secondary mb-4">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-muted-foreground">
            Sin imagen
          </div>
        )}
        
        {/* Discount badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs font-semibold px-2 py-1 rounded">
            -{discountPercent}%
          </div>
        )}

        {/* Quick add button */}
        <div className="absolute bottom-3 left-3 right-3 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <Button 
            onClick={handleAddToCart}
            className="w-full button-shadow"
            size="sm"
          >
            <ShoppingBag className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        </div>

        {/* Out of stock overlay */}
        {product.stock <= 0 && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <span className="text-sm font-medium">Agotado</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          {product.category}
        </p>
        <h3 className="font-medium line-clamp-1 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-semibold">
            ${product.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through">
              ${product.original_price!.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
