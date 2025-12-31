import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/lib/auth-context";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Shop from "./pages/Shop";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Account from "./pages/Account";
import ProfileEdit from "./pages/ProfileEdit";
import Wishlist from "./pages/Wishlist";
import Orders from "./pages/Orders";
import InvoiceDetail from "./pages/InvoiceDetail";
import Admin from "./pages/Admin";
import AdminShopifyProducts from "./pages/admin/AdminShopifyProducts";
import AdminInventory from "./pages/admin/AdminInventory";
import AdminDiscounts from "./pages/admin/AdminDiscounts";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminInvoices from "./pages/admin/AdminInvoices";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import TransferCheckout from "./pages/TransferCheckout";
import { useSavedCart } from "./hooks/useSavedCart";

const queryClient = new QueryClient();

// Component to handle cart sync
function CartSync() {
  useSavedCart();
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <CartSync />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/about" element={<About />} />
            <Route path="/account" element={<Account />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/invoice/:invoiceId" element={<InvoiceDetail />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/products" element={<AdminShopifyProducts />} />
            <Route path="/admin/inventory" element={<AdminInventory />} />
            <Route path="/admin/discounts" element={<AdminDiscounts />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/invoices" element={<AdminInvoices />} />
            <Route path="/producto/:handle" element={<ProductDetail />} />
            <Route path="/checkout/transferencia" element={<TransferCheckout />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
