import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import CartDrawer from "./components/CartDrawer";
import Footer from "./components/Footer";
import { RequireAdmin, RequireAuth } from "./components/Guards";
import Header from "./components/Header";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { FavoritesProvider } from "./context/FavoritesContext";
import { StoreProvider } from "./context/StoreContext";
import { ToastProvider } from "./context/ToastContext";
import { AccountPage, FavoritesPage, NotFoundPage } from "./pages/AccountPages";
import AuthPage from "./pages/AuthPage";
import CatalogPage from "./pages/CatalogPage";
import CheckoutPage from "./pages/CheckoutPage";
import { OrderDetailPage, OrdersPage } from "./pages/OrderPages";
import ProductPage from "./pages/ProductPage";
import AdminLayout from "./pages/admin/AdminLayout";
import BannersPage from "./pages/admin/BannersPage";
import CategoriesPage from "./pages/admin/CategoriesPage";
import DashboardPage from "./pages/admin/DashboardPage";
import AdminOrdersPage from "./pages/admin/OrdersPage";
import ProductsPage from "./pages/admin/ProductsPage";
import SettingsPage from "./pages/admin/SettingsPage";
import UsersPage from "./pages/admin/UsersPage";

// Volta ao topo ao trocar de página (filtros na query string não contam).
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <StoreProvider>
          <AuthProvider>
            <FavoritesProvider>
              <CartProvider>
                <ScrollToTop />
                <Header />
                <main className="min-h-[70vh]">
                  <Routes>
                    {/* Catálogo é público; o login só é pedido ao adicionar ao carrinho. */}
                    <Route path="/" element={<CatalogPage />} />
                    <Route path="/produto/:id" element={<ProductPage />} />
                    <Route path="/favoritos" element={<FavoritesPage />} />
                    <Route path="/login" element={<AuthPage mode="login" />} />
                    <Route path="/cadastro" element={<AuthPage mode="register" />} />

                    <Route path="/checkout" element={<RequireAuth><CheckoutPage /></RequireAuth>} />
                    <Route path="/pedidos" element={<RequireAuth><OrdersPage /></RequireAuth>} />
                    <Route path="/pedidos/:id" element={<RequireAuth><OrderDetailPage /></RequireAuth>} />
                    <Route path="/conta" element={<RequireAuth><AccountPage /></RequireAuth>} />

                    <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                      <Route index element={<DashboardPage />} />
                      <Route path="pedidos" element={<AdminOrdersPage />} />
                      <Route path="produtos" element={<ProductsPage />} />
                      <Route path="categorias" element={<CategoriesPage />} />
                      <Route path="banners" element={<BannersPage />} />
                      <Route path="usuarios" element={<UsersPage />} />
                      <Route path="configuracoes" element={<SettingsPage />} />
                    </Route>

                    <Route path="*" element={<NotFoundPage />} />
                  </Routes>
                </main>
                <Footer />
                <CartDrawer />
              </CartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </StoreProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
