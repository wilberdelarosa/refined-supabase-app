import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';

export default function Cart() {
  const { user } = useAuth();
  const { items, loading, updateQuantity, removeFromCart, total } = useCart();

  if (!user) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Inicia sesión</h1>
          <p className="text-muted-foreground mb-6">Necesitas iniciar sesión para ver tu carrito</p>
          <Button asChild><Link to="/auth">Iniciar Sesión</Link></Button>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Carrito vacío</h1>
          <p className="text-muted-foreground mb-6">Aún no has agregado productos</p>
          <Button asChild><Link to="/shop">Explorar Tienda</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-12">
        <h1 className="font-display text-3xl font-bold mb-8">Tu Carrito</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                <div className="w-24 h-24 bg-secondary rounded-md overflow-hidden">
                  {item.product.image_url && <img src={item.product.image_url} alt={item.product.name} className="w-full h-full object-cover" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{item.product.name}</h3>
                  <p className="text-primary font-semibold">${item.product.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-4 w-4" /></Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}><Trash2 className="h-4 w-4" /></Button>
              </div>
            ))}
          </div>
          <div className="p-6 border rounded-lg h-fit">
            <h2 className="font-semibold text-lg mb-4">Resumen</h2>
            <div className="flex justify-between py-2 border-b"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            <div className="flex justify-between py-2 font-bold text-lg"><span>Total</span><span>${total.toFixed(2)}</span></div>
            <Button className="w-full mt-4">Proceder al Pago</Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
