import React, { useState } from 'react';
import { ChevronLeft, Grid, Star, Users, AlertTriangle, Settings, Sparkles, UserPlus, MessageCircle } from 'lucide-react';
import PendingListings from '../components/admin/PendingListings';
import PremiumRequests from '../components/admin/PremiumRequests';
import UserManagement from '../components/admin/UserManagement';
import ReportedListings from '../components/admin/ReportedListings';
import AdminSettings from '../components/admin/AdminSettings';
import AdvertisementManager from '../components/admin/AdvertisementManager';
import ReviewModeration from '../components/admin/ReviewModeration';
import TicketsList from '../components/admin/TicketsList';
import { useSupabase } from '../contexts/SupabaseContext';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { useAdminStats } from '../hooks/useAdmin';

type TabType = 'pending' | 'premium' | 'users' | 'pending_users' | 'reports' | 'support' | 'settings' | 'ads' | 'reviews';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const navigate = useNavigate();
  const { signOut, profile, loading } = useSupabase();

  // 🛡️ SECURITY: Admin Guard - Redirect non-admin users
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Vérification des permissions...</div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // ✅ Admin stats ONLY called for confirmed admins (after guard)
  const { data: stats } = useAdminStats();

  const handleBack = () => {
    navigate('/');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'pending':
        return <PendingListings />;
      case 'premium':
        return <PremiumRequests />;
      case 'users':
        return <UserManagement filter="confirmed" />;
      case 'pending_users':
        return <UserManagement filter="pending" />;
      case 'reports':
        return <ReportedListings />;
      case 'support':
        return <TicketsList />;
      case 'settings':
        return <AdminSettings />;
      case 'ads':
        return <AdvertisementManager />;
      case 'reviews':
        return <ReviewModeration />;
      default:
        return <PendingListings />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center">
                <button onClick={handleBack} className="mr-4">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <Link to="/">
                  <h1 className="text-xl sm:text-2xl font-bold text-primary-500">DEKONVI Admin</h1>
                </Link>
              </div>
              {/* Mobile Logout Button */}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 sm:hidden"
              >
                <Users className="w-6 h-6" />
              </button>
            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <span className="text-gray-600">Administrateur</span>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <div className="flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex items-center py-4 border-b-2 ${activeTab === 'pending'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Grid className="w-5 h-5 mr-2" />
              En attente
              {stats?.pendingListings > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                  {stats.pendingListings}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`flex items-center py-4 border-b-2 ${activeTab === 'premium'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Star className="w-5 h-5 mr-2" />
              Premium
              {stats?.premiumRequests > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                  {stats.premiumRequests}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('pending_users')}
              className={`flex items-center py-4 border-b-2 ${activeTab === 'pending_users'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Demandes
              {stats?.pendingUsers > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                  {stats.pendingUsers}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center py-4 border-b-2 ${activeTab === 'users'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Users className="w-5 h-5 mr-2" />
              Utilisateurs
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center py-4 border-b-2 ${activeTab === 'reports'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <AlertTriangle className="w-5 h-5 mr-2" />
              Signalements
              {stats?.reportedListings > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                  {stats.reportedListings}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('support')}
              className={`flex items-center py-4 border-b-2 ${activeTab === 'support'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <MessageCircle className="w-5 h-5 mr-2" />
              Support
              {stats?.openTickets > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5 animate-pulse">
                  {stats.openTickets}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center py-4 border-b-2 ${activeTab === 'settings'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Settings className="w-5 h-5 mr-2" />
              Paramètres
            </button>
            <button
              onClick={() => setActiveTab('ads')}
              className={`flex items-center py-4 border-b-2 ${activeTab === 'ads'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Publicités
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex items-center py-4 border-b-2 ${activeTab === 'reviews'
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              <Star className="w-5 h-5 mr-2" />
              Avis
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {renderContent()}
      </div>
    </div>
  );
}