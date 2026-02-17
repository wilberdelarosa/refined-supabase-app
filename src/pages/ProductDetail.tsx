import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, Loader2, Heart, Package } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useNativeProduct } from '@/hooks/useNativeProducts';
import { useProductNutrition } from '@/hooks/useProductNutrition';
import { useCartStore } from '@/stores/cartStore';
import { useNativeWishlist } from '@/hooks/useNativeWishlist';
import { toast } from 'sonner';
import { FadeInUp } from '@/components/animations/ScrollAnimations';
import ProductGallery from '@/components/product/ProductGallery';
import NutritionTable from '@/components/product/NutritionTable';
import AIRecommendation from '@/components/product/AIRecommendation';
import RelatedProducts from '@/components/product/RelatedProducts';

export default function ProductDetail() {
  const { handle } = useParams<{ handle: string }>();
  const { product, loading, error } = useNativeProduct(handle || '');
  const { nutrition, loading: nutritionLoading } = useProductNutrition(product?.id);
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
          <Button asChild><Link to="/shop">Volver a la tienda</Link></Button>
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
  const stockPercentage = Math.min(100, (product.stock / Math.max(product.stock, 50)) * 100);
  const lowStock = product.stock > 0 && product.stock <= 5;

  const handleAddToCart = () => {
    if (!isAvailable) { toast.error('Producto agotado'); return; }
    if (quantity > product.stock) { toast.error(`Solo hay ${product.stock} unidades disponibles`); return; }
    addItem(product, quantity);
    toast.success('Agregado al carrito', { description: `${quantity}x ${product.name}`, position: 'top-center' });
  };

  // Extract extended fields (brand, weight_size, usage_instructions) from product
  // They may exist on the DB row but not in our TS type
  const extProduct = product as any;

  return (
    <Layout>
      <div className="container py-8 max-w-6xl">
        <FadeInUp>
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/shop"><ArrowLeft className="h-4 w-4 mr-2" />Volver a la tienda</Link>
          </Button>
        </FadeInUp>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <FadeInUp>
            <div className="relative">
              <ProductGallery productId={product.id} mainImageUrl={product.image_url} productName={product.name} />
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {!isAvailable && <Badge variant="destructive">Agotado</Badge>}
                {hasDiscount && isAvailable && <Badge className="bg-success text-success-foreground">-{discountPercentage}%</Badge>}
                {lowStock && isAvailable && <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">¡Últimas unidades!</Badge>}
              </div>
            </div>
          </FadeInUp>

          {/* Product Info */}
          <FadeInUp>
            <div className="space-y-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{product.category}</Badge>
                  {extProduct.brand && <span className="text-sm text-muted-foreground">{extProduct.brand}</span>}
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-1">{product.name}</h1>
                {extProduct.weight_size && (
                  <p className="text-sm text-muted-foreground">{extProduct.weight_size}</p>
                )}

                <div className="flex items-center gap-3 mt-3">
                  <p className="text-2xl font-bold">
                    DOP {product.price.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                  </p>
                  {hasDiscount && (
                    <p className="text-lg text-muted-foreground line-through">
                      DOP {product.original_price!.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>

              {/* Stock Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {isAvailable ? `${product.stock} unidades disponibles` : 'Sin stock'}
                    </span>
                  </div>
                  {lowStock && <span className="text-xs text-destructive font-medium">¡Quedan pocas!</span>}
                </div>
                <Progress
                  value={stockPercentage}
                  className="h-2"
                />
              </div>

              <Separator />

              {/* Quantity Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Cantidad</label>
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={quantity >= product.stock}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={handleAddToCart} disabled={!isAvailable} size="lg" className="flex-1">
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {isAvailable ? 'Agregar al Carrito' : 'Producto Agotado'}
                </Button>
                <Button variant="outline" size="lg" onClick={() => toggleWishlist(product)} className={isFavorite ? 'text-red-500' : ''}>
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>

              {/* Description */}
              {product.description && (
                <div className="pt-4">
                  <h3 className="font-semibold mb-2">Descripción</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-line">{product.description}</p>
                </div>
              )}
            </div>
          </FadeInUp>
        </div>

        {/* Nutrition & Details Section */}
        <div className="mt-12 grid lg:grid-cols-2 gap-8">
          {/* Left: Nutrition */}
          <div>
            {nutritionLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : nutrition ? (
              <NutritionTable nutrition={nutrition} usageInstructions={extProduct.usage_instructions} />
            ) : null}
          </div>

          {/* Right: AI Recommendation */}
          <div className="space-y-6">
            <AIRecommendation productName={product.name} productCategory={product.category} />
          </div>
        </div>

        {/* Related Products */}
        <div className="mt-12">
          <RelatedProducts currentProductId={product.id} category={product.category} />
        </div>
      </div>
    </Layout>
  );
}
