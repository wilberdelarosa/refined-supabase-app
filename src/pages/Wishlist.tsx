import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useNativeWishlist } from '@/hooks/useNativeWishlist';
import { useCartStore } from '@/stores/cartStore';
import { ProfileLayout } from '@/components/layout/ProfileLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function Wishlist() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { items, loading, removeFromWishlist } = useNativeWishlist();
  const addToCart = useCartStore((state) => state.addItem);

  if (!user) {
    return (
      <ProfileLayout>
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
      </ProfileLayout>
    );
  }

  if (loading) {
    return (
      <ProfileLayout>
        <div className="container py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
          </div>
        </div>
      </ProfileLayout>
    );
  }

  const handleAddToCart = (item: typeof items[0]) => {
    addToCart({
      id: item.shopify_product_id,
      name: item.product_name,
      price: item.product_price || 0,
      category: '',
      stock: 1,
      image_url: item.product_image_url,
      description: null,
      original_price: null,
      featured: false,
      created_at: '',
      updated_at: '',
    });
    toast.success('Agregado al carrito');
  };

  return (
    <ProfileLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-2 rounded-lg bg-white border border-slate-200 shadow-sm text-primary">
            <Heart className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mis Favoritos</h1>
            <p className="text-slate-500 text-sm">
              {items.length} producto{items.length !== 1 ? 's' : ''} guardado{items.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {items.length === 0 ? (
          <Card className="border-dashed border-slate-300 shadow-none bg-slate-50/50">
            <CardContent className="py-16 text-center">
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Heart className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">Tu lista está vacía</h3>
              <p className="text-slate-500 mb-6 max-w-sm mx-auto">
                Guarda los productos que te gustan para comprarlos más tarde.
              </p>
              <Link to="/shop">
                <Button>Explorar Productos</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden group border-slate-200 hover:shadow-md transition-all hover:border-primary/20">
                <Link to={`/product/${item.shopify_product_id}`}>
                  <div className="aspect-[4/5] bg-slate-50 overflow-hidden relative">
                    {item.product_image_url ? (
                      <img
                        src={item.product_image_url}
                        alt={item.product_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Sin imagen
                      </div>
                    )}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-sm"
                        onClick={(e) => {
                          e.preventDefault();
                          removeFromWishlist(item.shopify_product_id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link to={`/product/${item.shopify_product_id}`}>
                    <h3 className="font-medium text-sm line-clamp-2 hover:text-primary transition-colors text-slate-700 min-h-[40px]">
                      {item.product_name}
                    </h3>
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    {item.product_price !== null && (
                      <p className="text-base font-bold text-slate-900">
                        RD${item.product_price.toLocaleString()}
                      </p>
                    )}
                    <Button
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleAddToCart(item)}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
