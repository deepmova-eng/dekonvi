import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import toast from 'react-hot-toast';
import type { Database } from '../../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function UserSettings() {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
        if (data.avatar_url) {
          setAvatarPreview(data.avatar_url);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Erreur lors du chargement des données');
      }
    };

    loadProfile();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);
    try {
      let avatarUrl = profile.avatar_url;

      if (avatarFile) {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(`${user.id}/${Date.now()}`, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(uploadData.path);

        avatarUrl = publicUrl;
      }

      // Update auth metadata so header updates immediately
      const { error: authUpdateError } = await supabase.auth.updateUser({
        data: { avatar_url: avatarUrl }
      });

      if (authUpdateError) throw authUpdateError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          name: profile.name,
          phone: profile.phone,
          location: profile.location,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast.success('Profil mis à jour avec succès', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: 'var(--primary-500)',
          color: '#fff'
        }
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Erreur lors de la mise à jour du profil');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto settings-page pb-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-6">Paramètres du compte</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100">
                    <User className="w-12 h-12 text-gray-400" />
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary-500 p-2 rounded-full text-white cursor-pointer hover:bg-primary-600 transition-colors">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </label>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                <User size={18} />
              </span>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="flex-1 block w-full rounded-r-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                placeholder="Votre nom"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                <Mail size={18} />
              </span>
              <input
                type="email"
                value={profile.email}
                className="flex-1 block w-full rounded-r-lg border-gray-300 bg-gray-50 text-gray-500"
                placeholder="Votre email"
                disabled
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                <Phone size={18} />
              </span>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="flex-1 block w-full rounded-r-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                placeholder="Votre numéro de téléphone"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localisation
            </label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                <MapPin size={18} />
              </span>
              <input
                type="text"
                value={profile.location || ''}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="flex-1 block w-full rounded-r-lg border-gray-300 focus:border-primary-500 focus:ring-primary-500"
                placeholder="Votre localisation"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-primary-500 text-white px-6 py-3 rounded-lg transition-colors ${loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-primary-600'
                }`}
            >
              {loading ? 'Enregistrement...' : 'Sauvegarder les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}