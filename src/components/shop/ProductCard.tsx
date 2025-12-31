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
      <Card className="group overflow-hidden transition-all hover:shadow-lg h-full">
        <div className="relative aspect-square overflow-hidden bg-secondary/20">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
          
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {!isAvailable && (
              <Badge variant="destructive">Agotado</Badge>
            )}
            {hasDiscount && isAvailable && (
              <Badge className="bg-green-600">-{discountPercentage}%</Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background ${isFavorite ? 'text-red-500' : ''}`}
            onClick={handleToggleWishlist}
          >
            <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
        </div>
        
        <CardContent className="p-4 space-y-2">
          <Badge variant="secondary" className="text-xs">{product.category}</Badge>
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
          
          <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-primary">
              DOP {product.price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
            {hasDiscount && (
              <p className="text-sm text-muted-foreground line-through">
                DOP {product.original_price!.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="w-full"
            size="sm"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {isAvailable ? 'Agregar' : 'Agotado'}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
}
