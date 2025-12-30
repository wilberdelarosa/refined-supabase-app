import { Link } from 'react-router-dom';
import { ShoppingBag, User, Menu, X, Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="font-display text-2xl font-bold tracking-tight">TRIBE</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Inicio
          </Link>
          <Link to="/shop" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Tienda
          </Link>
          <Link to="/shop?category=featured" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Destacados
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="hidden md:flex">
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile">Mi Perfil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders">Mis Pedidos</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild>
              <Link to="/auth">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/cart">
              <ShoppingBag className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </Button>

          {/* Mobile menu toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-border">
          <nav className="container py-4 flex flex-col gap-4">
            <Link 
              to="/" 
              className="text-sm font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Inicio
            </Link>
            <Link 
              to="/shop" 
              className="text-sm font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Tienda
            </Link>
            <Link 
              to="/shop?category=featured" 
              className="text-sm font-medium py-2"
              onClick={() => setIsOpen(false)}
            >
              Destacados
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
