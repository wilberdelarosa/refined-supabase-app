import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, Loader2, Heart } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNativeProduct } from '@/hooks/useNativeProducts';
import { useCartStore } from '@/stores/cartStore';
import { useNativeWishlist } from '@/hooks/useNativeWishlist';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const { product, loading, error } = useNativeProduct(handle || '');
  const addItem = useCartStore(state => state.addItem);
  const { isInWishlist, toggleWishlist } = useNativeWishlist();

  const [quantity, setQuantity] = useState(1);

  if (loading) {
    return (
      <Layout>
        <div className="container py-20 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
          <Button asChild>
            <Link to="/shop">Volver a la tienda</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const isAvailable = product.stock > 0;
  const isFavorite = isInWishlist(product.id);
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.original_price! - product.price) / product.original_price!) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!isAvailable) {
      toast.error('Producto agotado');
      return;
    }

    if (quantity > product.stock) {
      toast.error(`Solo hay ${product.stock} unidades disponibles`);
      return;
    }

    addItem(product, quantity);
    toast.success('Agregado al carrito', {
      description: `${quantity}x ${product.name}`,
      position: 'top-center'
    });
  };

  return (
    <Layout>
      <div className="container py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/shop">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la tienda
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square overflow-hidden rounded-lg bg-white">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-contain p-8"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  Sin imagen
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {!isAvailable && (
                <Badge variant="destructive" className="text-sm">Agotado</Badge>
              )}
              {hasDiscount && isAvailable && (
                <Badge className="bg-green-600 text-sm">-{discountPercentage}%</Badge>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge variant="secondary" className="mb-2">{product.category}</Badge>
              <h1 className="text-3xl font-bold mb-2">{product.name}</h1>

              <div className="flex items-center gap-3">
                <p className="text-2xl font-bold text-primary">
                  DOP {product.price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                </p>
                {hasDiscount && (
                  <p className="text-lg text-muted-foreground line-through">
                    DOP {product.original_price!.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {isAvailable ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-muted-foreground">
                    {product.stock} unidades disponibles
                  </span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm text-destructive">Agotado</span>
                </>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cantidad</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                onClick={handleAddToCart}
                disabled={!isAvailable}
                size="lg"
                className="flex-1"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAvailable ? 'Agregar al Carrito' : 'Producto Agotado'}
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => toggleWishlist(product)}
                className={isFavorite ? 'text-red-500' : ''}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
              </Button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="pt-6 border-t">
                <h3 className="font-semibold mb-2">Descripción</h3>
                <p className="text-muted-foreground whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
