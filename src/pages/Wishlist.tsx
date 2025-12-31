import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useWishlist } from '@/hooks/useWishlist';
import { useCartStore } from '@/stores/cartStore';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, loading, removeFromWishlist } = useWishlist();
  const addToCart = useCartStore((state) => state.addItem);

  if (!user) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h1 className="font-display text-2xl font-bold mb-4">Mis Favoritos</h1>
            <p className="text-muted-foreground mb-6">
              Inicia sesión para ver y gestionar tus productos favoritos
            </p>
            <Button onClick={() => navigate('/auth')}>
              Iniciar Sesión
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="container py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = (item: typeof items[0]) => {
    // Create a cart item from wishlist item
    const cartItem = {
      product: {
        node: {
          id: item.shopify_product_id,
          title: item.product_title,
          description: '',
          handle: item.product_handle,
          priceRange: {
            minVariantPrice: {
              amount: item.product_price || '0',
              currencyCode: 'DOP',
            },
          },
          images: {
            edges: item.product_image_url
              ? [{ node: { url: item.product_image_url, altText: item.product_title } }]
              : [],
          },
          variants: { edges: [] },
          options: [],
        },
      },
      variantId: item.shopify_product_id.replace('Product', 'ProductVariant'),
      variantTitle: 'Default',
      price: {
        amount: item.product_price || '0',
        currencyCode: 'DOP',
      },
      quantity: 1,
      selectedOptions: [],
    };

    addToCart(cartItem);
    toast.success('Agregado al carrito');
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link to="/account">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Mis Favoritos</h1>
              <p className="text-muted-foreground text-sm">
                {items.length} producto{items.length !== 1 ? 's' : ''} guardado{items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No tienes productos favoritos</p>
                <Link to="/shop">
                  <Button>Explorar Productos</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden group">
                  <Link to={`/product/${item.product_handle}`}>
                    <div className="aspect-square bg-muted overflow-hidden">
                      {item.product_image_url ? (
                        <img
                          src={item.product_image_url}
                          alt={item.product_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Heart className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/product/${item.product_handle}`}>
                      <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                        {item.product_title}
                      </h3>
                    </Link>
                    {item.product_price && (
                      <p className="text-lg font-bold mt-1">
                        RD${parseFloat(item.product_price).toLocaleString()}
                      </p>
                    )}
                    <div className="flex gap-2 mt-4">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Agregar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeFromWishlist(item.shopify_product_id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
