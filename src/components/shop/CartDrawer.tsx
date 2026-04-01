
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/stores/cartStore";
import { Separator } from "@/components/ui/separator";
import { normalizeImageUrl } from "@/lib/image-url";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeItem,
    getTotalItems,
    getSubtotal
  } = useCartStore();

  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

  // Listen for custom event to open cart drawer
  useEffect(() => {
    const handleOpenCart = () => setIsOpen(true);
    window.addEventListener('openCartDrawer', handleOpenCart);
    return () => window.removeEventListener('openCartDrawer', handleOpenCart);
  }, []);

  const handleCheckout = () => {
    setIsOpen(false);
    navigate('/checkout/transferencia');
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-secondary/50 transition-all duration-300">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center animate-in zoom-in duration-300">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-[400px] flex flex-col p-0 gap-0 border-l shadow-2xl z-[100]">
         <div className="flex flex-col h-full bg-background"> 
            
            {/* Header */}
            <SheetHeader className="px-6 py-5 border-b sticky top-0 bg-background/80 backdrop-blur-xl z-10">
              <SheetDescription className="sr-only">
                Resumen del carrito con productos, cantidades y acceso directo al checkout.
              </SheetDescription>
              <div className="flex items-center justify-between">
                <SheetTitle className="flex items-center gap-2 text-lg font-bold">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                    Tu Carrito
                    <Badge variant="secondary" className="ml-2 h-5 min-w-[1.25rem] px-1 rounded-full text-xs font-normal">
                        {totalItems}
                    </Badge>
                </SheetTitle>
              </div>
            </SheetHeader>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {items.length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
                        <div className="h-20 w-20 bg-secondary/30 rounded-full flex items-center justify-center mb-6">
                            <ShoppingCart className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <h3 className="text-xl font-bold tracking-tight mb-2">Tu carrito está vacío</h3>
                        <p className="text-muted-foreground text-sm mb-8 max-w-[200px]">
                            Parece que aún no has agregado productos.
                        </p>
                        <Button 
                            variant="default" 
                            size="lg" 
                            className="w-full gap-2 shadow-lg hover:shadow-primary/25" 
                            onClick={() => setIsOpen(false)}
                            asChild
                        >
                            <Link to="/shop">
                               Explorar Tienda <ArrowRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                ) : (
                    <ScrollArea className="h-full px-6 py-4">
                        <div className="space-y-6 pb-4">
                            {items.map((item) => (
                                <div key={item.product.id} className="group relative flex gap-4 animate-in slide-in-from-right-4 duration-500">
                                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl border bg-secondary/10">
                                         {item.product.image_url ? (
                                            <img
                                                src={normalizeImageUrl(item.product.image_url)}
                                                alt={item.product.name}
                                                className="h-full w-full object-cover mix-blend-multiply transition-transform group-hover:scale-110 duration-500"
                                            />
                                         ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                                            </div>
                                         )}
                                    </div>
                                    <div className="flex flex-1 flex-col justify-between py-1">
                                        <div className="space-y-1">
                                            <h4 className="font-medium text-sm leading-tight line-clamp-2 pr-6">
                                                {item.product.name}
                                            </h4>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                RD$ {item.product.price.toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between border rounded-lg p-1 w-fit bg-secondary/10">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-md hover:bg-background hover:shadow-sm"
                                                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center text-xs font-semibold tabular-nums">
                                                {item.quantity}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 rounded-md hover:bg-background hover:shadow-sm"
                                                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                                disabled={item.quantity >= (item.product.stock || 99)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeItem(item.product.id)}
                                        className="absolute top-0 right-0 p-1 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
                <div className="p-6 bg-muted/10 border-t space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-base">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-semibold tabular-nums">RD$ {subtotal.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground text-center px-4">
                            Impuestos y envíos calculados en el checkout
                        </p>
                    </div>
                    <Button 
                        size="lg" 
                        className="w-full text-base font-semibold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all" 
                        onClick={handleCheckout}
                    >
                        Proceder al Pago
                    </Button>
                </div>
            )}
         </div>
      </SheetContent>
    </Sheet>
  );
}
