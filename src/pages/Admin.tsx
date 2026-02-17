import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import { supabase } from '@/integrations/supabase/client';
import {
  DollarSign,
  ShoppingCart,
  UserPlus,
  PlusSquare,
  Tag,
  MoreVertical,
  TrendingUp,
  FileText
} from 'lucide-react';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardStats {
  totalSales: number;
  newOrders: number;
  totalUsers: number;
}

interface RecentOrder {
  id: string;
  total: number;
  status: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { canManageOrders, canManageProducts, canManageContent, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();

  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    newOrders: 0,
    totalUsers: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) {
        navigate('/auth');
      } else if (!canManageOrders && !canManageProducts && !canManageContent) {
        navigate('/account');
      } else {
        fetchDashboardData();
      }
    }
  }, [user, authLoading, rolesLoading, canManageOrders, canManageProducts, canManageContent, navigate]);

  async function fetchDashboardData() {
    setLoading(true);
    try {
      // 1. Total Sales (completed orders)
      const { data: salesData, error: salesError } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'completed');

      const totalSales = salesData?.reduce((sum, order) => sum + order.total, 0) || 0;

      // 2. New Orders (last 30 days for example, or simply count all pending)
      // Let's count orders from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: newOrdersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      // 3. Total Users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 4. Recent Orders
      const { data: recentOrdersData, error: recentOrdersError } = await supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          created_at,
          profiles (full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (salesError || ordersError || usersError || recentOrdersError) {
        console.error('Error fetching dashboard data');
      }

      setStats({
        totalSales,
        newOrders: newOrdersCount || 0,
        totalUsers: usersCount || 0
      });

      if (recentOrdersData) {
        setRecentOrders(recentOrdersData as unknown as RecentOrder[]);
      }

    } catch (error) {
      console.error('Error in dashboard fetch:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'processing': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Completado',
      pending: 'Pendiente',
      cancelled: 'Cancelado',
      processing: 'Procesando'
    };
    return labels[status] || status;
  };

  if (authLoading || rolesLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2b8cee]"></div>
        </div>
      </AdminLayout>
    );
  }

  if (!user || (!canManageOrders && !canManageProducts && !canManageContent)) {
    return null;
  }

  return (
    <AdminLayout>
      {/* Stats Section */}
      <section>
        <h3 className="sr-only">Estadísticas Principales</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <DollarSign className="text-blue-500 h-6 w-6" />
              </div>
              <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-semibold rounded-md flex items-center gap-1">
                <TrendingUp className="h-[14px] w-[14px]" />
                +12%
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Ventas Totales (Completadas)</p>
            <p className="text-slate-900 text-2xl font-bold tracking-tight">
              RD$ {stats.totalSales.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <ShoppingCart className="text-purple-500 h-6 w-6" />
              </div>
              <span className="px-2 py-1 bg-green-500/10 text-green-500 text-xs font-semibold rounded-md flex items-center gap-1">
                <TrendingUp className="h-[14px] w-[14px]" />
                +30 días
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Pedidos Recientes</p>
            <p className="text-slate-900 text-2xl font-bold tracking-tight">{stats.newOrders}</p>
          </div>

          {/* Card 3 */}
          <div className="rounded-xl bg-white p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <UserPlus className="text-orange-500 h-6 w-6" />
              </div>
              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-semibold rounded-md flex items-center gap-1">
                Total
              </span>
            </div>
            <p className="text-slate-500 text-sm font-medium mb-1">Usuarios Registrados</p>
            <p className="text-slate-900 text-2xl font-bold tracking-tight">{stats.totalUsers}</p>
          </div>
        </div>
      </section>

      {/* Chart & Quick Access */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Chart Section - Placeholder for now as implementing a real chart library might be overkill or complex without knowing available libs. Keeping SVG but maybe updating data later. For now, keeping static visual but with updated title */}
        <div className="lg:col-span-2 flex flex-col rounded-xl bg-white border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-200 flex justify-between items-center">
            <div>
              <h3 className="text-slate-900 text-lg font-bold">Resumen de Actividad</h3>
              <p className="text-slate-500 text-sm">Visión general del rendimiento</p>
            </div>
            {/* Removed hardcoded numbers from chart header to avoid confusion */}
          </div>
          <div className="p-6 flex-1 flex flex-col justify-end min-h-[300px]">
            {/* Chart visual representation using SVG - purely decorative for now */}
            <div className="relative h-64 w-full">
              <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 800 200">
                {/* Grid lines */}
                <line className="stroke-slate-200" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="200" y2="200"></line>
                <line className="stroke-slate-200" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="150" y2="150"></line>
                <line className="stroke-slate-200" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="100" y2="100"></line>
                <line className="stroke-slate-200" strokeDasharray="4 4" strokeWidth="1" x1="0" x2="800" y1="50" y2="50"></line>
                {/* Data Line */}
                <defs>
                  <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#2b8dee" stopOpacity="0.2"></stop>
                    <stop offset="100%" stopColor="#2b8dee" stopOpacity="0"></stop>
                  </linearGradient>
                </defs>
                <path d="M0,150 Q50,140 100,120 T200,100 T300,130 T400,80 T500,90 T600,50 T700,60 T800,20" fill="none" stroke="#2b8dee" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3"></path>
                <path d="M0,150 Q50,140 100,120 T200,100 T300,130 T400,80 T500,90 T600,50 T700,60 T800,20 V200 H0 Z" fill="url(#gradient)" stroke="none"></path>
              </svg>
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-4 font-medium uppercase tracking-wider">
              <span>Semana 1</span>
              <span>Semana 2</span>
              <span>Semana 3</span>
              <span>Semana 4</span>
            </div>
          </div>
        </div>

        {/* Quick Access */}
        <div className="flex flex-col gap-4">
          <h3 className="text-slate-900 text-lg font-bold px-1">Accesos Rápidos</h3>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/products" className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-[#2b8cee] transition-all shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32">
              <div className="p-2 rounded-full bg-[#2b8cee]/10 group-hover:bg-[#2b8cee] group-hover:text-white text-[#2b8cee] transition-colors">
                <PlusSquare className="h-6 w-6" />
              </div>
              <span className="text-slate-600 text-sm font-medium">Gestionar Productos</span>
            </Link>
            <Link to="/admin/invoices" className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-[#2b8cee] transition-all shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32">
              <div className="p-2 rounded-full bg-[#2b8cee]/10 group-hover:bg-[#2b8cee] group-hover:text-white text-[#2b8cee] transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <span className="text-slate-600 text-sm font-medium">Ver Facturas</span>
            </Link>
            <Link to="/admin/discounts" className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-[#2b8cee] transition-all shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32">
              <div className="p-2 rounded-full bg-[#2b8cee]/10 group-hover:bg-[#2b8cee] group-hover:text-white text-[#2b8cee] transition-colors">
                <Tag className="h-6 w-6" />
              </div>
              <span className="text-slate-600 text-sm font-medium">Crear Oferta</span>
            </Link>
            <Link to="/admin/users" className="group p-4 rounded-xl bg-white border border-slate-200 hover:border-[#2b8cee] transition-all shadow-sm flex flex-col items-center justify-center gap-2 text-center h-32">
              <div className="p-2 rounded-full bg-[#2b8cee]/10 group-hover:bg-[#2b8cee] group-hover:text-white text-[#2b8cee] transition-colors">
                <UserPlus className="h-6 w-6" />
              </div>
              <span className="text-slate-600 text-sm font-medium">Nuevo Usuario</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <section className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-slate-900 text-lg font-bold">Pedidos Recientes</h3>
          <Link to="/admin/orders" className="text-sm text-[#2b8cee] font-semibold hover:underline">Ver todos los pedidos</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold tracking-wider">
                <th className="px-6 py-4">ID Pedido</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No hay pedidos recientes
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-900 font-medium font-mono text-xs">
                      {order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                          {order.profiles?.full_name?.charAt(0) || order.profiles?.email?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-900">{order.profiles?.full_name || 'Desconocido'}</span>
                          <span className="text-xs text-slate-400">{order.profiles?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {format(new Date(order.created_at), 'dd MMM, yyyy', { locale: es })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-900 font-medium">
                      RD$ {order.total.toLocaleString('es-DO', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link
                        to={`/orders/invoice/${order.id}`} // Or order detail link
                        className="text-slate-400 hover:text-[#2b8cee] transition-colors inline-block"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}
