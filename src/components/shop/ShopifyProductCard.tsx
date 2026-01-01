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
      <Card className="group overflow-hidden transition-all duration-300 hover:shadow-smooth-lg h-full">
        <div className="relative aspect-square overflow-hidden bg-secondary/20">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={node.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
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
          {!isAvailable && (
            <Badge variant="destructive" className="absolute top-2 left-2 animate-scale-in">
              Agotado
            </Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={`absolute top-2 right-2 bg-background/80 backdrop-blur-soft hover:bg-background transition-all duration-300 hover:scale-110 ${isFavorite ? 'text-red-500' : ''}`}
            onClick={handleToggleWishlist}
          >
            <Heart className={`h-4 w-4 transition-transform duration-300 ${isFavorite ? 'fill-current scale-110' : ''}`} />
          </Button>
        </div>
        <CardContent className="p-4 space-y-2">
          <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem] transition-colors duration-300 group-hover:text-foreground/80">
            {node.title}
          </h3>
          <p className="text-lg font-bold text-primary transition-transform duration-300 group-hover:scale-105">
            {currencyCode} {price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
          </p>
          <Button
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="w-full transition-all duration-300 hover:scale-105 hover:shadow-lg"
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
