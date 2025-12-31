import { Link } from 'react-router-dom';
import { ShoppingCart, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartStore, CartItem } from '@/stores/cartStore';
import { useWishlist } from '@/hooks/useWishlist';
import { ShopifyProduct } from '@/lib/shopify';
import { toast } from 'sonner';

interface ShopifyProductCardProps {
  product: ShopifyProduct;
}

export function ShopifyProductCard({ product }: ShopifyProductCardProps) {
  const addItem = useCartStore(state => state.addItem);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { node } = product;
  
  const firstVariant = node.variants.edges[0]?.node;
  const price = parseFloat(node.priceRange.minVariantPrice.amount);
  const currencyCode = node.priceRange.minVariantPrice.currencyCode;
  const imageUrl = node.images.edges[0]?.node.url;
  const isAvailable = firstVariant?.availableForSale ?? false;
  const isFavorite = isInWishlist(node.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!firstVariant) {
      toast.error('Producto no disponible');
      return;
    }

    const cartItem: CartItem = {
      product,
      variantId: firstVariant.id,
      variantTitle: firstVariant.title,
      price: firstVariant.price,
      quantity: 1,
      selectedOptions: firstVariant.selectedOptions || []
    };

    addItem(cartItem);
    toast.success('Agregado al carrito', {
      description: node.title,
      position: 'top-center'
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    toggleWishlist({
      shopify_product_id: node.id,
      product_handle: node.handle,
      product_title: node.title,
      product_image_url: imageUrl,
      product_price: price.toString(),
    });
  };

  return (
    <Link to={`/producto/${node.handle}`}>
      <Card className="group overflow-hidden transition-all hover:shadow-lg h-full">
        <div className="relative aspect-square overflow-hidden bg-secondary/20">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={node.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Sin imagen
            </div>
          )}
          {!isAvailable && (
            <Badge variant="destructive" className="absolute top-2 left-2">
              Agotado
            </Badge>
          )}
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
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
            {node.title}
          </h3>
          <p className="text-lg font-bold text-primary">
            {currencyCode} {price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
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
