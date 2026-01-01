import { Link } from 'react-router-dom';
import { User, Menu, Search, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CartDrawer } from '@/components/shop/CartDrawer';
import barbaroLogo from '@/assets/barbaro-logo.png';

const navLinks = [
  { name: 'Inicio', path: '/' },
  { name: 'Tienda', path: '/shop' },
  { name: 'Sobre Nosotros', path: '/about' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, canManageOrders } = useRoles();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 transition-all duration-300">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center transition-transform duration-300 hover:scale-105">
          <img src={barbaroLogo} alt="Barbaro Nutrition" className="h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-all duration-300 uppercase tracking-wide relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="hidden md:flex transition-all duration-300 hover:scale-110">
            <Search className="h-5 w-5" />
          </Button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="transition-all duration-300 hover:scale-110">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 animate-scale-in-smooth">
                <DropdownMenuItem asChild>
                  <Link to="/account" className="cursor-pointer transition-colors duration-200">Mi Cuenta</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/orders" className="cursor-pointer transition-colors duration-200">Mis Pedidos</Link>
                </DropdownMenuItem>
                {canManageOrders && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="cursor-pointer flex items-center gap-2 transition-colors duration-200">
                        <Settings className="h-4 w-4" />
                        Panel Admin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => signOut()}
                  className="cursor-pointer transition-colors duration-200"
                >
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild className="transition-all duration-300 hover:scale-110">
              <Link to="/auth">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <CartDrawer />

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="transition-all duration-300 hover:scale-110">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <div className="flex flex-col gap-6 mt-8 stagger-fade-in">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-semibold uppercase tracking-wide hover:text-muted-foreground transition-all duration-300 hover:translate-x-2"
                  >
                    {link.name}
                  </Link>
                ))}
                <div className="border-t border-border pt-6 mt-4">
                  {user ? (
                    <>
                      <Link
                        to="/account"
                        onClick={() => setIsOpen(false)}
                        className="block text-lg font-semibold uppercase tracking-wide mb-4 transition-all duration-300 hover:translate-x-2"
                      >
                        Mi Cuenta
                      </Link>
                      {canManageOrders && (
                        <Link
                          to="/admin"
                          onClick={() => setIsOpen(false)}
                          className="block text-lg font-semibold uppercase tracking-wide mb-4 text-primary transition-all duration-300 hover:translate-x-2"
                        >
                          Panel Admin
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          signOut();
                          setIsOpen(false);
                        }}
                        className="text-lg font-semibold uppercase tracking-wide text-muted-foreground transition-all duration-300 hover:text-foreground"
                      >
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-semibold uppercase tracking-wide transition-all duration-300 hover:translate-x-2"
                    >
                      Iniciar Sesión
                    </Link>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
