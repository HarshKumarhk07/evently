import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout.jsx';
import ScrollToTop from './components/layout/ScrollToTop.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import { PageLoader } from './components/ui/Spinner.jsx';

/* Route-level code splitting — each page ships as its own chunk. */
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const ListingPage = lazy(() => import('./pages/ListingPage.jsx'));
const DetailPage = lazy(() => import('./pages/DetailPage.jsx'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'));
const SignupPage = lazy(() => import('./pages/auth/SignupPage.jsx'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'));
const BookingConfirmationPage = lazy(() => import('./pages/BookingConfirmationPage.jsx'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage.jsx'));

const DashboardLayout = lazy(() => import('./components/dashboard/DashboardLayout.jsx'));
const DashboardHome = lazy(() => import('./pages/dashboard/DashboardHome.jsx'));
const MyBookingsPage = lazy(() => import('./pages/dashboard/MyBookingsPage.jsx'));
const FavoritesPage = lazy(() => import('./pages/dashboard/FavoritesPage.jsx'));
const ProfilePage = lazy(() => import('./pages/dashboard/ProfilePage.jsx'));

const AdminLayout = lazy(() => import('./components/admin/AdminLayout.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard.jsx'));
const ManageListingsPage = lazy(() => import('./pages/admin/ManageListingsPage.jsx'));
const ManageBookingsPage = lazy(() => import('./pages/admin/ManageBookingsPage.jsx'));
const ManageUsersPage = lazy(() => import('./pages/admin/ManageUsersPage.jsx'));
const ManageCitiesPage = lazy(() => import('./pages/admin/ManageCitiesPage.jsx'));

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#15121f',
            color: '#e2e0ea',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#8b5cf6', secondary: '#fff' } },
        }}
      />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth — full-screen, no navbar */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Main app shell */}
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />

            <Route path="dining" element={<ListingPage vertical="dining" />} />
            <Route path="dining/:slug" element={<DetailPage vertical="dining" />} />
            <Route path="plays" element={<ListingPage vertical="plays" />} />
            <Route path="plays/:slug" element={<DetailPage vertical="plays" />} />
            <Route path="events" element={<ListingPage vertical="events" />} />
            <Route path="events/:slug" element={<DetailPage vertical="events" />} />

            <Route
              path="booking/:id/confirmation"
              element={
                <ProtectedRoute>
                  <BookingConfirmationPage />
                </ProtectedRoute>
              }
            />

            {/* User dashboard */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHome />} />
              <Route path="bookings" element={<MyBookingsPage />} />
              <Route path="favorites" element={<FavoritesPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Admin console */}
            <Route
              path="admin"
              element={
                <ProtectedRoute adminOnly>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="listings" element={<ManageListingsPage />} />
              <Route path="bookings" element={<ManageBookingsPage />} />
              <Route path="users" element={<ManageUsersPage />} />
              <Route path="cities" element={<ManageCitiesPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}
