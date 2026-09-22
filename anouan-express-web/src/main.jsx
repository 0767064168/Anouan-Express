// src/main.jsx
// Point d'entrée React — Router complet avec lazy loading, toutes les routes et protections de rôles

import React, { lazy, Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from 'react-router-dom';
import './index.css';

// ─── Contextes ────────────────────────────────────────────────
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import { CartProvider } from './contexts/CartContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { ProductProvider } from './contexts/ProductContext';

// ─── Layouts (pas lazy : partagés, chargés immédiatement) ─────
import ClientLayout from './components/client/ClientLayout';
import AdminLayout from './components/admin/AdminLayout';

// ─── Pages Auth (lazy) ────────────────────────────────────────
const LoginPage          = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage       = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage  = lazy(() => import('./pages/auth/ResetPasswordPage'));

// ─── Pages Client (lazy) ──────────────────────────────────────
const HomePage           = lazy(() => import('./pages/client/HomePage'));
const CatalogPage        = lazy(() => import('./pages/client/CatalogPage'));
const ProductDetailPage  = lazy(() => import('./pages/client/ProductDetailPage'));
const CheckoutPage       = lazy(() => import('./pages/client/CheckoutPage'));
const OrderTrackingPage  = lazy(() => import('./pages/client/OrderTrackingPage'));
const ProfilePage        = lazy(() => import('./pages/client/ProfilePage'));
const NotificationsPage  = lazy(() => import('./pages/client/NotificationsPage'));
const FavoritesPage      = lazy(() => import('./pages/client/FavoritesPage'));
const ChatPage           = lazy(() => import('./pages/client/ChatPage'));
const DisputesPage       = lazy(() => import('./pages/client/DisputesPage'));
const LegalPage          = lazy(() => import('./pages/client/LegalPage'));
const StoresPage         = lazy(() => import('./pages/client/StoresPage'));
const OrdersHistoryPage  = lazy(() => import('./pages/client/OrdersHistoryPage'));

// ─── Pages Admin (lazy) ───────────────────────────────────────
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminOrdersPage    = lazy(() => import('./pages/admin/AdminOrdersPage'));
const AdminVendorsPage   = lazy(() => import('./pages/admin/AdminVendorsPage'));
const AdminUsersPage     = lazy(() => import('./pages/admin/AdminUsersPage'));
const AdminFinancePage   = lazy(() => import('./pages/admin/AdminFinancePage'));
const AdminContentPage   = lazy(() => import('./pages/admin/AdminContentPage'));
const AdminMarketingPage = lazy(() => import('./pages/admin/AdminMarketingPage'));
const AdminSettingsPage  = lazy(() => import('./pages/admin/AdminSettingsPage'));
const AdminStoresPage    = lazy(() => import('./pages/admin/AdminStoresPage'));
const AdminWeeklyReportPage = lazy(() => import('./pages/admin/AdminWeeklyReportPage'));

// ─── Pages Vendor (lazy) ──────────────────────────────────────
const VendorLayout        = lazy(() => import('./pages/vendor/VendorLayout'));
const VendorDashboardPage = lazy(() => import('./pages/vendor/VendorDashboardPage'));
const VendorProductsPage  = lazy(() => import('./pages/vendor/VendorProductsPage'));
const VendorOrdersPage    = lazy(() => import('./pages/vendor/VendorOrdersPage'));
const VendorChatPage      = lazy(() => import('./pages/vendor/VendorChatPage'));
const VendorFinancePage   = lazy(() => import('./pages/vendor/VendorFinancePage'));

// ─── Pages Agent (lazy) ───────────────────────────────────────
const PickupAgentPage = lazy(() => import('./pages/agent/PickupAgentPage'));

// ─── 404 (lazy) ───────────────────────────────────────────────
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// ─── Suspense Fallback Global ─────────────────────────────────
function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 gap-4">
      <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-orange-500/30" />
      <p className="text-slate-400 text-sm font-semibold">Chargement en cours...</p>
    </div>
  );
}

// ─── Route Protégée (par rôle) ────────────────────────────────
function ProtectedRoute({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) return <Navigate to="/auth/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

// ─── Redirection post-login selon rôle ────────────────────────
function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'vendor') return <Navigate to="/vendor" replace />;
  if (user.role === 'agent') return <Navigate to="/agent" replace />;
  return <Navigate to="/" replace />;
}

// ─── Application principale ───────────────────────────────────
function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ToastProvider>
        <ProductProvider>
        <FavoritesProvider>
        <CartProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* ── Auth ────────────────────────────────────── */}
              <Route path="/auth/login"          element={<LoginPage />} />
              <Route path="/auth/register"       element={<RegisterPage />} />
              <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/reset-password" element={<ResetPasswordPage />} />

              {/* ── Redirection post-login ───────────────────── */}
              <Route path="/dashboard" element={<RoleRedirect />} />

              {/* ── Client (public) ─────────────────────────── */}
              <Route element={<ClientLayout />}>
                <Route path="/"                         element={<HomePage />} />
                <Route path="/catalog"                  element={<CatalogPage />} />
                <Route path="/catalog/:categorySlug"    element={<CatalogPage />} />
                <Route path="/products/:id"             element={<ProductDetailPage />} />
                <Route path="/legal"                    element={<LegalPage />} />
                <Route path="/stores"                   element={<StoresPage />} />

                {/* Client authentifié */}
                <Route element={<ProtectedRoute allowedRoles={['client', 'vendor', 'admin', 'agent']} />}>
                  <Route path="/checkout"                 element={<CheckoutPage />} />
                  <Route path="/orders"                   element={<OrdersHistoryPage />} />
                  <Route path="/orders/:id"               element={<OrderTrackingPage />} />
                  <Route path="/orders/:id/tracking"      element={<OrderTrackingPage />} />
                  <Route path="/profile"                  element={<ProfilePage />} />
                  <Route path="/notifications"            element={<NotificationsPage />} />
                  <Route path="/favorites"                element={<FavoritesPage />} />
                  <Route path="/chat"                     element={<ChatPage />} />
                  <Route path="/disputes"                 element={<DisputesPage />} />
                </Route>
              </Route>

              {/* ── Admin ───────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route element={<AdminLayout />}>
                  <Route path="/admin"                element={<AdminDashboardPage />} />
                  <Route path="/admin/users"          element={<AdminUsersPage />} />
                  <Route path="/admin/vendors"        element={<AdminVendorsPage />} />
                  <Route path="/admin/orders"         element={<AdminOrdersPage />} />
                  <Route path="/admin/finance"        element={<AdminFinancePage />} />
                  <Route path="/admin/content"        element={<AdminContentPage />} />
                  <Route path="/admin/marketing"      element={<AdminMarketingPage />} />
                  <Route path="/admin/settings"       element={<AdminSettingsPage />} />
                  <Route path="/admin/stores"         element={<AdminStoresPage />} />
                  <Route path="/admin/agent"          element={<PickupAgentPage />} />
                  <Route path="/admin/reports/weekly" element={<AdminWeeklyReportPage />} />
                </Route>
              </Route>

              {/* ── Vendor ──────────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['vendor']} />}>
                <Route element={<VendorLayout />}>
                  <Route path="/vendor"              element={<VendorDashboardPage />} />
                  <Route path="/vendor/products"     element={<VendorProductsPage />} />
                  <Route path="/vendor/orders"       element={<VendorOrdersPage />} />
                  <Route path="/vendor/chat"         element={<VendorChatPage />} />
                  <Route path="/vendor/finance"      element={<VendorFinancePage />} />
                </Route>
              </Route>

              {/* ── Agent Magasin ────────────────────────────── */}
              <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
                <Route path="/agent" element={<PickupAgentPage />} />
              </Route>

              {/* ── 404 ─────────────────────────────────────── */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </CartProvider>
        </FavoritesProvider>
        </ProductProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
