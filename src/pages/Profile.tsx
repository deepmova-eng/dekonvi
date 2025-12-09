import React, { useState, useEffect } from 'react';
import { Package, Settings, Camera, ChevronLeft, Shield, Star, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { useAdminStats } from '../hooks/useAdmin';
import UserListings from '../components/profile/UserListings';
import UserActivity from '../components/profile/UserActivity';
import Login from './Login';
import Register from './Register';

type TabType = 'listings' | 'activity';

import type { Database } from '../types/supabase';

type Listing = Database['public']['Tables']['listings']['Row'];

interface ProfileProps {
  onCreateListing: () => void;
  onEditingListing: (listing: Listing | null) => void;
  onProductSelect?: (id: string) => void;
}

export default function Profile({
  onCreateListing,
  onEditingListing,
  onProductSelect
}: ProfileProps) {
  const [activeTab, setActiveTab] = useState<TabType>('listings');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();

  const [uploading, setUploading] = useState(false);

  // Fetch user profile data for ratings
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('rating, total_ratings, is_recommended, role')
        .eq('id', user.id)
        .single();

      if (!error && data) {
        setUserProfile(data);
      }
    };

    fetchProfile();
  }, [user]);

  // ✅ Admin stats ONLY for admins - prevents 400 errors for non-admins
  const { data: adminStats } = useAdminStats({
    enabled: userProfile?.role === 'admin'
  });


  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      setUploading(true);

      // ✅ OPTIMISER l'image AVANT upload (400px, WebP, quality 0.8)
      const { optimizeImage, OPTIMIZE_PRESETS } = await import('../utils/imageOptimizer');
      const optimizedFile = await optimizeImage(file, OPTIMIZE_PRESETS.AVATAR);

      // Générer nom de fichier avec extension .webp
      const fileName = `${user!.id}-${Date.now()}.webp`;
      const filePath = `${fileName}`;

      // Upload image optimisée
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, optimizedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      // Update profiles table as well
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user!.id);

      if (profileError) throw profileError;

      // Force refresh (optional, or rely on auth state update)
      window.location.reload();

    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Erreur lors du téléchargement de la photo');
    } finally {
      setUploading(false);
    }
  };

  const handleLoginClick = () => {
    setShowLogin(true);
  };

  const handleRegisterClick = () => {
    setShowRegister(true);
    setShowLogin(false);
  };

  const handleBack = () => {
    setShowLogin(false);
    setShowRegister(false);
  };

  const handleBackToHome = () => {
    window.dispatchEvent(new CustomEvent('setActiveTab', { detail: 'search' }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'listings':
        return (
          <UserListings
            onCreateListing={onCreateListing}
            onEditingListing={onEditingListing}
            onProductSelect={onProductSelect}
          />
        );
      case 'activity':
        return <UserActivity />;
      default:
        return null;
    }
  };

  if (showLogin) {
    return <Login onBack={handleBack} onRegisterClick={handleRegisterClick} />;
  }

  if (showRegister) {
    return <Register onBack={handleBack} onLoginClick={() => {
      setShowRegister(false);
      setShowLogin(true);
    }} />;
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <div className="p-4">
          <button
            onClick={handleBackToHome}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-gray-500 mb-4">Connectez-vous pour accéder à votre profil</p>
          <button
            onClick={handleLoginClick}
            className="bg-primary-500 text-white px-6 py-2 rounded-full hover:bg-primary-600 transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Profile */}
      <div className="bg-white p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          {/* Left: Avatar + Info */}
          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
            <div className="relative group flex-shrink-0">
              <div className="h-16 w-16 sm:h-20 sm:w-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.name || user.user_metadata?.full_name || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-bold text-gray-500">
                    {user.user_metadata?.name?.charAt(0) || user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                )}
                <label className="absolute bottom-0 right-0 bg-primary-500 p-1.5 sm:p-2 rounded-full text-white cursor-pointer hover:bg-primary-600 transition-colors shadow-md">
                  <Camera size={14} className="sm:w-4 sm:h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              {/* Name + Badge */}
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg sm:text-2xl font-bold truncate">
                  {user.user_metadata?.name || user.user_metadata?.full_name || 'Utilisateur'}
                </h1>
                {userProfile?.is_recommended && (
                  <div className="flex-shrink-0" title="Compte vérifié">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  </div>
                )}
              </div>

              {/* Rating */}
              {userProfile?.total_ratings > 0 && (
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">
                    {userProfile.rating.toFixed(1)}/5
                  </span>
                  <span className="text-gray-400">({userProfile.total_ratings})</span>
                </div>
              )}

              {/* Member Since */}
              <p className="text-xs sm:text-sm text-gray-500">
                Membre depuis {new Date(user.created_at || '').toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          </div>

          {/* Right: Icons Navigation */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Admin Shield Icon (Admins only) */}
            {userProfile?.role === 'admin' && (
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors group relative"
                title="Panel Admin"
              >
                <Shield className="w-5 h-5 text-gray-600 group-hover:text-red-500" />
                {adminStats?.totalPending > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </button>
            )}

            {/* Settings Icon */}
            <button
              onClick={() => navigate('/settings')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors group"
              title="Paramètres"
            >
              <Settings className="w-5 h-5 text-gray-600 group-hover:text-primary-500" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 sm:space-x-6 border-b overflow-x-auto scrollbar-hide -mx-4 sm:mx-0 px-4 sm:px-0">
          <button
            onClick={() => setActiveTab('listings')}
            className={`flex items-center pb-4 px-2 border-b-2 whitespace-nowrap ${activeTab === 'listings'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-primary-500'
              }`}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Mes Annonces</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`flex items-center pb-4 px-2 border-b-2 whitespace-nowrap ${activeTab === 'activity'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-primary-500'
              }`}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Mon Activité</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {renderTabContent()}
      </div>
    </div>
  );
}