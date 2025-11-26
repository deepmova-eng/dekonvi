import React, { useState } from 'react';
import { Package, MessageCircle, Heart, Settings, LogOut, Camera, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import UserListings from '../components/profile/UserListings';
import UserMessages from '../components/profile/UserMessages';
import UserFavorites from '../components/profile/UserFavorites';
import UserSettings from '../components/profile/UserSettings';
import Login from './Login';
import Register from './Register';

type TabType = 'listings' | 'messages' | 'favorites' | 'settings';

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
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user, signOut } = useSupabaseAuth();
  const navigate = useNavigate();

  const [uploading, setUploading] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploading(true);

      // Upload image
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

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
      case 'messages':
        return <UserMessages />;
      case 'favorites':
        return <UserFavorites onProductSelect={onProductSelect} />;
      case 'settings':
        return <UserSettings />;
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
            <button
              onClick={handleBackToHome}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="relative group">
              <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata?.name || user.user_metadata?.full_name || 'Profile'}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-gray-500">
                    {user.user_metadata?.name?.charAt(0) || user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0)}
                  </span>
                )}
                <label className="absolute bottom-0 right-0 bg-primary-500 p-2 rounded-full text-white cursor-pointer hover:bg-primary-600 transition-colors shadow-md">
                  <Camera size={16} />
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
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold truncate">{user.user_metadata?.name || user.user_metadata?.full_name || 'Utilisateur'}</h1>
              <p className="text-sm sm:text-base text-gray-500 truncate">{user.email}</p>
              <p className="text-xs sm:text-sm text-gray-400 hidden sm:block">
                Membre depuis {new Date(user.created_at || '').toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              {user.email === 'admin@dekonvi.com' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="mt-2 bg-red-500 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  Panel Admin
                </button>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center text-gray-600 hover:text-primary-500 self-end sm:self-auto"
          >
            <LogOut className="w-5 h-5" />
            <span className="ml-2 hidden sm:inline">Déconnexion</span>
          </button>
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
            <span className="text-sm sm:text-base">Annonces</span>
          </button>
          <button
            onClick={() => setActiveTab('messages')}
            className={`flex items-center pb-4 px-2 border-b-2 whitespace-nowrap ${activeTab === 'messages'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-primary-500'
              }`}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Messages</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center pb-4 px-2 border-b-2 whitespace-nowrap ${activeTab === 'favorites'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-primary-500'
              }`}
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Favoris</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center pb-4 px-2 border-b-2 whitespace-nowrap ${activeTab === 'settings'
              ? 'border-primary-500 text-primary-500'
              : 'border-transparent text-gray-500 hover:text-primary-500'
              }`}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Paramètres</span>
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