import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  BarChart3, 
  Settings,
  Boxes,
  FileEdit,
  Shield
} from 'lucide-react';

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, canManageOrders, canManageProducts, canManageContent, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!canManageOrders && !canManageProducts && !canManageContent) {
        navigate('/account');
      }
    }
  }, [user, authLoading, rolesLoading, canManageOrders, canManageProducts, canManageContent, navigate]);

  if (authLoading || rolesLoading) {
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

  if (!user || (!canManageOrders && !canManageProducts && !canManageContent)) {
    return null;
  }

  const adminModules = [
    {
      title: 'Pedidos',
      description: 'Gestionar pedidos locales',
      icon: ShoppingCart,
      href: '/admin/orders',
      badge: 'Nuevo',
      visible: canManageOrders,
    },
    {
      title: 'Productos',
      description: 'Catálogo Shopify',
      icon: Package,
      href: '/admin/products',
      visible: canManageProducts,
    },
    {
      title: 'Inventario',
      description: 'Control de stock Shopify',
      icon: Boxes,
      href: '/admin/inventory',
      visible: canManageProducts,
    },
    {
      title: 'Descuentos',
      description: 'Códigos y promociones',
      icon: Settings,
      href: '/admin/discounts',
      visible: isAdmin,
    },
    {
      title: 'Facturas',
      description: 'Facturación y documentos',
      icon: FileText,
      href: '/admin/invoices',
      visible: canManageOrders,
    },
    {
      title: 'Clientes',
      description: 'Gestión de usuarios',
      icon: Users,
      href: '/admin/users',
      visible: isAdmin,
    },
  ].filter(m => m.visible);

  return (
    <Layout>
      <div className="container py-8 md:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Premium Header with gradient */}
          <div className="mb-8 md:mb-12">
            <div className="relative overflow-hidden rounded-2xl gradient-premium p-8 md:p-10 shadow-premium">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItMmgydi0yLTJoLTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6bTAtNHYyaDJ2LTJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
              <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-3">
                    <Shield className="h-8 w-8 text-white" />
                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
                      Panel de Administración
                    </h1>
                  </div>
                  <p className="text-white/80 text-base md:text-lg">
                    Control total de Barbaro Nutrition
                  </p>
                </div>
                <div className="flex items-center gap-2 animate-fade-in">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm font-semibold">
                    <Shield className="h-4 w-4 mr-2" />
                    {isAdmin ? 'Administrador' : 'Staff'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards - Enhanced Design */}
          <div className="grid gap-4 md:gap-6 grid-cols-2 md:grid-cols-4 mb-8 md:mb-12 stagger-fade-in">
            <Card className="hover-lift border-0 shadow-premium overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                </div>
                <CardDescription className="text-xs font-medium">Ventas Hoy</CardDescription>
                <CardTitle className="text-2xl md:text-3xl font-black">RD$0</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-emerald-600 dark:text-emerald-400">+0%</span> vs ayer
                </p>
              </CardHeader>
            </Card>

            <Card className="hover-lift border-0 shadow-premium overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <ShoppingCart className="h-5 w-5" />
                  </div>
                </div>
                <CardDescription className="text-xs font-medium">Pedidos Pendientes</CardDescription>
                <CardTitle className="text-2xl md:text-3xl font-black">0</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-blue-600 dark:text-blue-400">0</span> sin procesar
                </p>
              </CardHeader>
            </Card>

            <Card className="hover-lift border-0 shadow-premium overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <Package className="h-5 w-5" />
                  </div>
                </div>
                <CardDescription className="text-xs font-medium">Productos</CardDescription>
                <CardTitle className="text-2xl md:text-3xl font-black">22</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-purple-600 dark:text-purple-400">100%</span> en stock
                </p>
              </CardHeader>
            </Card>

            <Card className="hover-lift border-0 shadow-premium overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <CardHeader className="pb-3 relative">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
                <CardDescription className="text-xs font-medium">Clientes</CardDescription>
                <CardTitle className="text-2xl md:text-3xl font-black">1</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-orange-600 dark:text-orange-400">+0</span> nuevos
                </p>
              </CardHeader>
            </Card>
          </div>

          {/* Modules Grid - Enhanced Visual Design */}
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Boxes className="h-5 w-5" />
              Módulos de Gestión
            </h2>
            <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 stagger-fade-in">
              {adminModules.map((module) => (
                <Link key={module.href} to={module.href}>
                  <Card className="hover-lift hover-glow border-gradient-hover cursor-pointer h-full group relative overflow-hidden transition-all duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-foreground/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <CardHeader className="relative space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-foreground/10 to-foreground/5 group-hover:from-foreground/15 group-hover:to-foreground/10 transition-all duration-300 shadow-sm">
                          <module.icon className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
                        </div>
                        {module.badge && (
                          <Badge variant="secondary" className="text-xs font-semibold animate-pulse-subtle">
                            {module.badge}
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <CardTitle className="text-xl font-bold group-hover:text-foreground/80 transition-colors">
                          {module.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed">
                          {module.description}
                        </CardDescription>
                      </div>
                      <div className="flex items-center text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors pt-2">
                        Acceder
                        <Settings className="h-3.5 w-3.5 ml-1 transition-transform duration-300 group-hover:rotate-90" />
                      </div>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
