import { ReactNode, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { useRoles } from '@/hooks/useRoles';
import {
    Store,
    LayoutDashboard,
    ShoppingBag,
    Package,
    Boxes,
    Percent,
    Users,
    FileText,
    Tags,
    CreditCard,
    LogOut,
    Menu,
    Search,
    Bell,
    Settings,
    UserCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
    children: ReactNode;
    showSearch?: boolean;
}

export function AdminLayout({ children, showSearch = true }: AdminLayoutProps) {
    const { user, signOut } = useAuth();
    const { isAdmin, canManageOrders, canManageProducts, canManageContent } = useRoles();
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const displayName = user?.user_metadata?.full_name || user?.email || 'Usuario';
    const roleLabel = isAdmin ? 'Administrador' : 'Equipo';
    const avatarUrl = (user?.user_metadata as { avatar_url?: string } | undefined)?.avatar_url;
    const avatarInitial = displayName.charAt(0).toUpperCase();

    const handleSignOut = async () => {
        await signOut();
        navigate('/auth');
    };

    // Sidebar Navigation Items mapped to existing functionality
    const navItems = [
        { label: 'Inicio', icon: LayoutDashboard, href: '/admin', exact: true },
        { label: 'Pedidos', icon: ShoppingBag, href: '/admin/orders', visible: canManageOrders },
        { label: 'Productos', icon: Package, href: '/admin/products', visible: canManageProducts },
        { label: 'Inventario', icon: Boxes, href: '/admin/inventory', visible: canManageProducts },
        { label: 'Descuentos', icon: Percent, href: '/admin/discounts', visible: isAdmin },
        { label: 'Usuarios', icon: Users, href: '/admin/users', visible: isAdmin },
        { label: 'Facturas', icon: FileText, href: '/admin/invoices', visible: canManageOrders },
        { label: 'Categorías', icon: Tags, href: '/admin/categories', visible: canManageProducts },
        { label: 'Métodos de Pago', icon: CreditCard, href: '/admin/payment-methods', visible: isAdmin },
        { label: 'Nutricionistas', icon: UserCheck, href: '/admin/nutritionists', visible: isAdmin },
    ].filter(item => item.visible !== false);

    const isActive = (href: string, exact: boolean = false) => {
        if (exact) return location.pathname === href;
        return location.pathname.startsWith(href);
    };

    return (
        <div className="bg-[#f6f7f8] text-slate-900 antialiased overflow-hidden font-display h-screen w-screen">
            <div className="flex h-full w-full">
                {/* Sidebar */}
                <aside className={`${sidebarOpen ? 'flex' : 'hidden'} md:flex w-64 flex-col border-r border-slate-200 bg-white fixed md:relative z-50 h-full transition-all duration-300`}>
                    <div className="flex h-full flex-col justify-between p-4">
                        <div className="flex flex-col gap-6">
                            {/* Brand */}
                            <div className="flex items-center gap-3 px-2">
                                <div className="bg-[#2b8cee]/20 flex items-center justify-center rounded-lg size-10">
                                    <Store className="text-[#2b8cee] h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                    <h1 className="text-slate-900 text-base font-bold leading-normal">Admin Store</h1>
                                    <p className="text-slate-500 text-xs font-normal leading-normal">Gestión General</p>
                                </div>
                            </div>

                            {/* Navigation */}
                            <nav className="flex flex-col gap-1 overflow-y-auto max-h-[calc(100vh-200px)] custom-scrollbar">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${isActive(item.href, item.exact)
                                                ? 'bg-[#2b8cee]/10 text-[#2b8cee]'
                                                : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        onClick={() => setSidebarOpen(false)}
                                    >
                                        <item.icon className={`h-5 w-5 ${isActive(item.href, item.exact) ? 'fill-current' : ''}`} strokeWidth={isActive(item.href, item.exact) ? 2.5 : 2} />
                                        <span className={`text-sm ${isActive(item.href, item.exact) ? 'font-semibold' : 'font-medium'} leading-normal`}>{item.label}</span>
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Logout */}
                        <button
                            onClick={handleSignOut}
                            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg py-2.5 bg-[#1b2631] hover:bg-[#233648] text-white text-sm font-semibold transition-colors mt-4 shadow-sm"
                        >
                            <LogOut className="h-[18px] w-[18px]" />
                            <span>Cerrar Sesión</span>
                        </button>
                    </div>
                </aside>

                {/* Overlay for mobile sidebar */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-40 md:hidden"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}

                {/* Main Content */}
                <main className="flex h-full flex-1 flex-col overflow-hidden bg-[#f6f7f8] relative w-full">
                    {/* Top Header */}
                    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4 sticky top-0 z-30 shadow-sm shrink-0">
                        <div className="flex items-center gap-4">
                            <button
                                className="md:hidden text-slate-500 hover:text-slate-700"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                <Menu className="h-6 w-6" />
                            </button>
                            <h2 className="text-slate-900 text-lg font-bold leading-tight">Panel de Administración</h2>
                        </div>

                        <div className="flex items-center gap-4 md:gap-6">
                            {/* Search */}
                            {showSearch && (
                                <div className="hidden md:flex items-center bg-slate-100 rounded-lg px-3 py-2 w-64 border border-transparent focus-within:border-[#2b8cee] transition-colors">
                                    <Search className="text-slate-400 h-5 w-5" />
                                    <input
                                        className="bg-transparent border-none text-sm text-slate-900 placeholder-slate-400 focus:ring-0 w-full ml-2 p-0 h-auto focus:outline-none"
                                        placeholder="Buscar..."
                                        type="text"
                                    />
                                </div>
                            )}

                            <Link to="/" className="hidden md:block">
                                <Button variant="outline" size="sm" className="gap-2">
                                    <Store className="h-4 w-4" />
                                    Volver a la tienda
                                </Button>
                            </Link>

                            {/* Actions */}
                            <div className="flex items-center gap-3">
                                <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                                    <Bell className="h-[22px] w-[22px]" />
                                    <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full"></span>
                                </button>
                                <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
                                    <Settings className="h-[22px] w-[22px]" />
                                </button>

                                {/* User Profile */}
                                <div className="flex items-center gap-3 pl-2 border-l border-slate-200 ml-1">
                                    <div className="text-right hidden sm:block">
                                        <p className="text-sm font-semibold text-slate-900">{displayName}</p>
                                        <p className="text-xs text-slate-500">{roleLabel}</p>
                                    </div>
                                    {avatarUrl ? (
                                        <div className="size-9 rounded-full bg-slate-200 overflow-hidden ring-2 ring-slate-100">
                                            <img
                                                src={avatarUrl}
                                                alt="User Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="size-9 rounded-full bg-slate-200 ring-2 ring-slate-100 flex items-center justify-center text-xs font-semibold text-slate-700">
                                            {avatarInitial}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-8">
                        <div className="mx-auto max-w-7xl flex flex-col gap-8">
                            {children}
                            {/* Footer */}
                            <div className="mt-auto mb-4 text-center py-6">
                                <p className="text-xs text-slate-400">© 2023 Admin Store. Todos los derechos reservados.</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
