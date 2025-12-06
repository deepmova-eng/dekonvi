import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { trackPageview } from './lib/analytics';
import BottomNav from './components/layout/BottomNav';
import Navbar from './components/layout/Navbar';
import { useSupabase } from './contexts/SupabaseContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MessagingPremium from './pages/MessagingPremium';
import CreateListing from './pages/CreateListing';
import CreateListingPremium from './pages/CreateListingPremium';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import ProductDetails from './pages/ProductDetails';
import SellerPublicProfile from './pages/SellerPublicProfile';
import AdminPanel from './pages/AdminPanel';
import MonitoringDashboard from './pages/admin/Monitoring';
import Categories from './pages/Categories';
import CategoryListings from './pages/CategoryListings';
import CategoryPage from './pages/CategoryPage';
import UserSettings from './pages/UserSettings';
import PersonalInfo from './pages/PersonalInfo';
import Addresses from './pages/Addresses';
import Security from './pages/Security';

export default function App() {
  const { user } = useSupabase();
  const location = useLocation();
  const navigate = useNavigate();

  // Track page views
  useEffect(() => {
    trackPageview();
  }, [location]);

  // Fix viewport height mobile (clavier)
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);

    return () => {
      window.removeEventListener('resize', setVH);
      window.removeEventListener('orientationchange', setVH);
    };
  }, []);

  // Determine active tab from current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/') return 'search';
    if (path.startsWith('/messages')) return 'messages';
    if (path.startsWith('/favorites')) return 'favorites';
    if (path.startsWith('/create')) return 'create';
    if (path.startsWith('/profile')) return 'profile';
    return 'search';
  };

  // Handle create listing click
  const handleCreateListing = () => {
    localStorage.removeItem('editingListing');
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/create-premium');
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine if we should hide navigation based on current route
  const hideNavigation =
    location.pathname.startsWith('/listings/') ||
    location.pathname.startsWith('/profile/') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register');

  // Mobile-Native UX: Masquer la navbar Logo partout SAUF sur la page d'accueil
  // Chaque page a son propre header contextuel (Favoris, Messages, Profil, etc.)
  // Sur desktop, on garde la navbar partout
  const hideTopNav = hideNavigation ||
    (isMobile && (
      location.pathname.startsWith('/messages') ||
      location.pathname.startsWith('/favorites') ||
      location.pathname.startsWith('/seller/') ||
      location.pathname === '/profile' ||
      location.pathname.startsWith('/create') ||
      location.pathname.startsWith('/settings')
    ));

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <Toaster position="top-center" />

      {/* Desktop Navigation - Hide on /messages for immersive chat */}
      {!hideTopNav && <Navbar />}

      <main className={`${location.pathname.startsWith('/messages')
        ? 'min-h-[calc(100vh-4rem)]'
        : 'max-w-7xl mx-auto min-h-[calc(100vh-4rem)]'
        } ${!hideTopNav ? 'pt-20' : 'pt-0'}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home onProductSelect={(id) => navigate(`/listings/${id}`)} />} />
          <Route path="/login" element={<Login onBack={() => navigate(-1)} onRegisterClick={() => navigate('/register')} />} />
          <Route path="/register" element={<Register onBack={() => navigate(-1)} onLoginClick={() => navigate('/login')} />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/categories/:slug" element={<CategoryListings />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
          <Route path="/listings/:id" element={<ProductDetails />} />
          {/* Redirect old /profile/:id to /seller/:id */}
          <Route path="/profile/:id" element={<Navigate to={`/seller/${window.location.pathname.split('/').pop()}`} replace />} />
          <Route path="/seller/:id" element={<SellerPublicProfile />} />

          {/* Protected Routes - Require Login */}
          <Route
            path="/create-listing"
            element={
              <ProtectedRoute>
                <CreateListing />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-premium"
            element={
              <ProtectedRoute>
                <CreateListingPremium />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <MessagingPremium />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites onProductSelect={(id) => navigate(`/listings/${id}`)} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile
                  onCreateListing={handleCreateListing}
                  onEditingListing={(listing) => {
                    if (listing) {
                      // Navigate to CreateListingPremium.tsx with listing data in state
                      navigate('/create-premium', { state: { listing } });
                    }
                  }}
                  onProductSelect={(id) => navigate(`/listings/${id}`)}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <UserSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/personal-info"
            element={
              <ProtectedRoute>
                <PersonalInfo />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/addresses"
            element={
              <ProtectedRoute>
                <Addresses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings/security"
            element={
              <ProtectedRoute>
                <Security />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes - Require Admin Permission */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin>
                <AdminPanel />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/monitoring"
            element={
              <ProtectedRoute requireAdmin>
                <MonitoringDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback - 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Mobile Bottom Navigation */}
      {!hideNavigation && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 ios-bottom-bar-fix z-50">
          <BottomNav
            activeTab={getActiveTab()}
            orientation="horizontal"
            sellerId={user?.id}
            onCreateListing={handleCreateListing}
          />
        </div>
      )}
    </div>
  );
}