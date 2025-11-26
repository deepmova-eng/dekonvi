import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import type { Database } from '../../types/supabase';

type Settings = Database['public']['Tables']['settings']['Row'];

export default function AdminSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .single();

        if (error) throw error;
        setSettings(data);
      } catch (error) {
        console.error('Error loading settings:', error);
        toast.error('Erreur lors du chargement des paramètres');
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    loadSettings();

    // Subscribe to changes
    const channel = supabase
      .channel('settings_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'settings'
        }, 
        () => {
          loadSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('settings')
        .update(settings)
        .eq('id', 1);

      if (error) throw error;

      toast.success('Paramètres mis à jour', {
        duration: 3000,
        position: 'top-center',
        style: {
          background: 'var(--primary-500)',
          color: '#fff'
        }
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Erreur lors du chargement des paramètres</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Paramètres généraux</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.auto_approve_listings}
                onChange={(e) => setSettings({
                  ...settings,
                  auto_approve_listings: e.target.checked
                })}
                className="h-4 w-4 text-primary-500 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-gray-700">
                Approuver automatiquement les annonces
              </span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Prix des annonces Premium (FCFA)
            </label>
            <input
              type="number"
              value={settings.premium_listing_price}
              onChange={(e) => setSettings({
                ...settings,
                premium_listing_price: Number(e.target.value)
              })}
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Durée des annonces Premium (jours)
            </label>
            <input
              type="number"
              value={settings.premium_listing_duration}
              onChange={(e) => setSettings({
                ...settings,
                premium_listing_duration: Number(e.target.value)
              })}
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre maximum d'images par annonce
            </label>
            <input
              type="number"
              value={settings.max_images_per_listing}
              onChange={(e) => setSettings({
                ...settings,
                max_images_per_listing: Number(e.target.value)
              })}
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre maximum d'annonces par utilisateur
            </label>
            <input
              type="number"
              value={settings.max_listings_per_user}
              onChange={(e) => setSettings({
                ...settings,
                max_listings_per_user: Number(e.target.value)
              })}
              className="mt-1 block w-full rounded-lg border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className={`w-full bg-primary-500 text-white px-6 py-3 rounded-lg transition-colors ${
                saving 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-primary-600'
              }`}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}