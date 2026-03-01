
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { useNativeWishlist } from '@/hooks/useNativeWishlist';
import { Product } from '@/types/product';
import { toast } from 'sonner';
import { normalizeImageUrl, getProductImageFallback } from '@/lib/image-url';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  variant?: 'grid' | 'list';
}

export function ProductCard({ product, variant = 'grid' }: ProductCardProps) {
  const addItem = useCartStore(state => state.addItem);
  const { isInWishlist, toggleWishlist } = useNativeWishlist();
  const [imageFailed, setImageFailed] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const imageSrc = useMemo(() => {
    const normalized = normalizeImageUrl(product.image_url);
    if (normalized) return normalized;
    return getProductImageFallback(product.name);
  }, [product.image_url, product.name]);

  const isAvailable = product.stock > 0;
  const isFavorite = isInWishlist(product.id);
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable) {
      toast.error('Producto agotado');
      return;
    }

    setIsAdding(true);
    addItem(product, 1);
    
    // Slight delay for animation
    setTimeout(() => {
        setIsAdding(false);
        toast.success('Agregado al carrito', {
          description: product.name,
          position: 'bottom-center',
          duration: 2000,
        });
    }, 500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  const isList = variant === 'list';

  if (isList) {
    return (
      <Link to={`/producto/${product.id}`} className="block h-full">
         <div className="group flex gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-300 h-full items-center">
            <div className="relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-lg bg-muted/20">
              {imageSrc && !imageFailed ? (
                <img
                    src={imageSrc}
                    alt={product.name}
                    className="h-full w-full object-contain p-2 mix-blend-multiply" 
                    onError={() => setImageFailed(true)}
                />
               ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground text-xs">
                    Sin imagen
                </div>
               )}
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <Badge variant="secondary" className="mb-1 text-[10px]">{product.category}</Badge>
                        <h3 className="font-semibold text-base sm:text-lg leading-tight truncate pr-4">{product.name}</h3>
                    </div>
                    {hasDiscount && <Badge className="bg-red-500 hover:bg-red-600">-{discountPercentage}%</Badge>}
                </div>
                
                <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">RD${product.price.toLocaleString()}</span>
                    {hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through">
                            RD${product.original_price?.toLocaleString()}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2 shrink-0">
                <Button
                    size="icon"
                    variant="ghost"
                    className={cn("h-9 w-9", isFavorite && "text-red-500 hover:text-red-600 bg-red-50")}
                    onClick={handleToggleWishlist}
                >
                    <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                </Button>
                <Button 
                    size="icon" 
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                    className="h-9 w-9"
                >
                    <ShoppingCart className="h-4 w-4" />
                </Button>
            </div>
         </div>
      </Link>
    )
  }

  return (
    <Link to={`/producto/${product.id}`} className="block h-full">
      <div className="group h-full relative flex flex-col rounded-xl border bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-muted/10 p-6">
          {imageSrc && !imageFailed ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-110 mix-blend-multiply"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground bg-secondary/50 rounded-lg">
              <span className="text-sm">Sin imagen</span>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {!isAvailable && (
              <Badge variant="destructive" className="shadow-sm">Agotado</Badge>
            )}
            {hasDiscount && isAvailable && (
              <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-sm border-0">-{discountPercentage}%</Badge>
            )}
          </div>

          {/* Context Menu / Actions */}
          <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
            <Button
              variant="secondary"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-full shadow-md transition-colors",
                isFavorite 
                  ? "bg-white text-red-500 hover:bg-red-50" 
                  : "bg-white/90 hover:bg-white text-foreground"
              )}
              onClick={handleToggleWishlist}
            >
              <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 flex flex-col gap-2">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{product.category}</div>
            <h3 className="font-semibold text-foreground line-clamp-2 leading-tight min-h-[2.5rem]" title={product.name}>
                {product.name}
            </h3>
            
            <div className="mt-auto pt-2 flex items-end justify-between gap-2">
                <div className="flex flex-col">
                     {hasDiscount && (
                        <span className="text-xs text-muted-foreground line-through">
                            RD${product.original_price?.toLocaleString()}
                        </span>
                    )}
                    <span className="text-lg font-bold text-primary">
                        RD${product.price.toLocaleString()}
                    </span>
                </div>
                
                 <Button
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                    size="sm"
                    className={cn(
                        "rounded-full h-9 w-9 p-0 shadow-sm transition-all duration-300",
                        isAvailable ? "hover:scale-105 active:scale-95" : "opacity-50"
                    )}
                  >
                    {isAdding ? (
                        <Check className="h-4 w-4" />
                    ) : (
                        <ShoppingCart className="h-4 w-4" />
                    )}
                    <span className="sr-only">Agregar</span>
                  </Button>
            </div>
        </div>
      </div>
    </Link>
  );
}
