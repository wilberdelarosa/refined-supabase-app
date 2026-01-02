import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { useNativeWishlist } from '@/hooks/useNativeWishlist';
import { Product } from '@/types/product';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore(state => state.addItem);
  const { isInWishlist, toggleWishlist } = useNativeWishlist();

  const isAvailable = product.stock > 0;
  const isFavorite = isInWishlist(product.id);
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAvailable) {
      toast.error('Producto agotado');
      return;
    }

    addItem(product, 1);
    toast.success('Agregado al carrito', {
      description: product.name,
      position: 'top-center'
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <Link to={`/producto/${product.id}`}>
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 h-full border-border/50 bg-card">
        <div className="relative aspect-square overflow-hidden bg-white">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <span className="text-sm">Sin imagen</span>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {!isAvailable && (
              <Badge variant="destructive" className="shadow-md">Agotado</Badge>
            )}
            {hasDiscount && isAvailable && (
              <Badge className="bg-green-600 text-white shadow-md">-{discountPercentage}%</Badge>
            )}
          </div>

          <Button
            variant="secondary"
            size="icon"
            className={`absolute top-3 right-3 shadow-md transition-all duration-200 ${isFavorite ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-background/90 hover:bg-background'}`}
            onClick={handleToggleWishlist}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
          <Badge variant="secondary" className="text-xs font-medium">{product.category}</Badge>
          <h3 className="font-semibold text-xs sm:text-sm line-clamp-2 min-h-[2.5rem] text-foreground">
            {product.name}
          </h3>

          <div className="flex items-baseline gap-2">
            <p className="text-base sm:text-lg font-bold text-foreground">
              RD${product.price.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
            </p>
            {hasDiscount && (
              <p className="text-xs sm:text-sm text-muted-foreground line-through">
                RD${product.original_price!.toLocaleString('es-DO', { minimumFractionDigits: 0 })}
              </p>
            )}
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="w-full transition-all duration-200 text-xs sm:text-sm"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">{isAvailable ? 'Agregar al Carrito' : 'Agotado'}</span>
            <span className="sm:hidden">{isAvailable ? 'Agregar' : 'Agotado'}</span>
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
