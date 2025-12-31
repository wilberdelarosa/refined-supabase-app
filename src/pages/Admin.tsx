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
      <div className="container py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="font-display text-3xl font-bold">Panel de Administración</h1>
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  {isAdmin ? 'Admin' : 'Staff'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Bienvenido al panel de control de Barbaro Nutrition
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Ventas Hoy</CardDescription>
                <CardTitle className="text-2xl">RD$0</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pedidos Pendientes</CardDescription>
                <CardTitle className="text-2xl">0</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Productos</CardDescription>
                <CardTitle className="text-2xl">22</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Clientes</CardDescription>
                <CardTitle className="text-2xl">1</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Modules Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {adminModules.map((module) => (
              <Link key={module.href} to={module.href}>
                <Card className="hover:border-foreground/20 transition-colors cursor-pointer h-full group">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-2 rounded-lg bg-muted group-hover:bg-foreground/10 transition-colors">
                        <module.icon className="h-5 w-5" />
                      </div>
                      {module.badge && (
                        <Badge variant="secondary" className="text-xs">
                          {module.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg mt-4">{module.title}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
