import { Link } from 'react-router-dom';
import { User, Menu, Settings, LogOut, ShoppingBag } from 'lucide-react';
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
import { ThemeToggle } from '@/components/ui/theme-toggle';
import barbaroLogo from '@/assets/barbaro-logo.png';
import { useAppointmentFeature } from '@/features/appointments/config';

export function Navbar() {
  const showAppointmentsLink = useAppointmentFeature('SHOW_NAVBAR_LINK');

  const navLinks = [
    { name: 'Inicio', path: '/' },
    { name: 'Tienda', path: '/shop' },
    ...(showAppointmentsLink ? [{ name: 'Nutricionistas', path: '/appointments' }] : []),
    { name: 'Sobre Nosotros', path: '/about' },
  ];
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin, canManageOrders } = useRoles();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center hover-lift">
          <img src={barbaroLogo} alt="Barbaro Nutrition" className="h-10 w-auto" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="text-sm font-bold text-foreground/70 hover:text-foreground transition-colors uppercase tracking-wide relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-foreground transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="hover-lift">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2 shadow-xl border-border/50">
                {/* User Info Header */}
                <div className="px-3 py-3 mb-1 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center ring-2 ring-primary/20">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">Mi perfil</p>
                    </div>
                  </div>
                </div>

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2.5 my-0.5">
                  <Link to="/account" className="flex items-center gap-3 font-medium">
                    <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span>Mi Cuenta</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2.5 my-0.5">
                  <Link to="/orders" className="flex items-center gap-3 font-medium">
                    <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center">
                      <ShoppingBag className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span>Mis Pedidos</span>
                  </Link>
                </DropdownMenuItem>

                {canManageOrders && (
                  <>
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem asChild className="cursor-pointer rounded-md px-3 py-2.5 my-0.5">
                      <Link to="/admin" className="flex items-center gap-3 font-semibold">
                        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center ring-1 ring-purple-500/30">
                          <Settings className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                          Panel Admin
                        </span>
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}

                <DropdownMenuSeparator className="my-2" />

                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="cursor-pointer rounded-md px-3 py-2.5 my-0.5 focus:bg-destructive/10 focus:text-destructive"
                >
                  <div className="flex items-center gap-3 font-medium">
                    <div className="h-8 w-8 rounded-md bg-destructive/10 flex items-center justify-center">
                      <LogOut className="h-4 w-4 text-destructive" />
                    </div>
                    <span className="text-destructive">Cerrar Sesión</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" asChild className="hover-lift">
              <Link to="/auth">
                <User className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <CartDrawer />

          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full max-w-xs">
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-semibold uppercase tracking-wide hover:text-muted-foreground transition-colors"
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
                        className="block text-lg font-semibold uppercase tracking-wide mb-4"
                      >
                        Mi Cuenta
                      </Link>
                      {canManageOrders && (
                        <Link
                          to="/admin"
                          onClick={() => setIsOpen(false)}
                          className="block text-lg font-semibold uppercase tracking-wide mb-4 text-primary"
                        >
                          Panel Admin
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          signOut();
                          setIsOpen(false);
                        }}
                        className="text-lg font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setIsOpen(false)}
                      className="text-lg font-semibold uppercase tracking-wide"
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
