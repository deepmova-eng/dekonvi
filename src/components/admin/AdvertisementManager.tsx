import React, { useState } from 'react';
import { Plus, X, Edit, Trash2 } from 'lucide-react';
import { useAdvertisements, useCreateAdvertisement, useDeleteAdvertisement } from '../../hooks/useAdmin';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../shared/ConfirmDialog';

type Advertisement = Database['public']['Tables']['advertisements']['Row'];

export default function AdvertisementManager() {
  // ✅ React Query hooks - remplace useState + useEffect
  const { data: ads = [], isLoading: loading } = useAdvertisements();
  const createMutation = useCreateAdvertisement();
  const deleteMutation = useDeleteAdvertisement();

  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);

  // Desktop image (required)
  const [desktopImage, setDesktopImage] = useState<File | null>(null);
  const [desktopPreview, setDesktopPreview] = useState('');

  // Mobile image (optional)
  const [mobileImage, setMobileImage] = useState<File | null>(null);
  const [mobilePreview, setMobilePreview] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);

  const handleDesktopImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setDesktopImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setDesktopPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMobileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMobileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setMobilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      let desktopUrl = editingAd?.image_url;
      let mobileUrl = editingAd?.image_mobile_url || null;

      // Upload desktop image (required)
      if (desktopImage) {
        const { optimizeImage, OPTIMIZE_PRESETS } = await import('../../utils/imageOptimizer');
        const optimizedDesktop = await optimizeImage(desktopImage, OPTIMIZE_PRESETS.BANNER);

        const desktopPath = `ads/desktop/${Date.now()}_desktop.webp`;
        const { data: desktopData, error: desktopError } = await supabase.storage
          .from('advertisements')
          .upload(desktopPath, optimizedDesktop);

        if (desktopError) throw desktopError;

        const { data: { publicUrl: desktopPublicUrl } } = supabase.storage
          .from('advertisements')
          .getPublicUrl(desktopData.path);

        desktopUrl = desktopPublicUrl;
      }

      // Upload mobile image (optional)
      if (mobileImage) {
        const { optimizeImage, OPTIMIZE_PRESETS } = await import('../../utils/imageOptimizer');
        const optimizedMobile = await optimizeImage(mobileImage, OPTIMIZE_PRESETS.BANNER);

        const mobilePath = `ads/mobile/${Date.now()}_mobile.webp`;
        const { data: mobileData, error: mobileError } = await supabase.storage
          .from('advertisements')
          .upload(mobilePath, optimizedMobile);

        if (mobileError) throw mobileError;

        const { data: { publicUrl: mobilePublicUrl } } = supabase.storage
          .from('advertisements')
          .getPublicUrl(mobileData.path);

        mobileUrl = mobilePublicUrl;
      }

      if (!desktopUrl) {
        toast.error('L\'image desktop est requise');
        return;
      }

      const adData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string || null,
        link: formData.get('link') as string || null,
        image_url: desktopUrl,
        image_mobile_url: mobileUrl,
        active: true,
        order_position: editingAd ? editingAd.order_position : ads.length
      };

      if (editingAd) {
        const { error } = await supabase
          .from('advertisements')
          .update(adData)
          .eq('id', editingAd.id);

        if (error) throw error;
        toast.success('Publicité mise à jour');
      } else {
        const { error } = await supabase
          .from('advertisements')
          .insert([adData]);

        if (error) throw error;
        toast.success('Publicité créée');
      }

      setEditingAd(null);
      setDesktopImage(null);
      setDesktopPreview('');
      setMobileImage(null);
      setMobilePreview('');
      form.reset();
    } catch (error) {
      console.error('Error saving advertisement:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const handleDelete = async (ad: Advertisement) => {
    setAdToDelete(ad);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!adToDelete) return;

    try {
      // Delete the image from storage
      if (adToDelete.image_url) {
        const path = adToDelete.image_url.split('/').pop();
        if (path) {
          await supabase.storage
            .from('advertisements')
            .remove([path]);
        }
      }

      // Delete the ad from the database
      const { error } = await supabase
        .from('advertisements')
        .delete()
        .eq('id', adToDelete.id);

      if (error) throw error;
      toast.success('Publicité supprimée');
    } catch (error) {
      console.error('Error deleting advertisement:', error);
      toast.error('Erreur lors de la suppression');
    } finally {
      setShowDeleteDialog(false);
      setAdToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {editingAd ? 'Modifier la publicité' : 'Nouvelle publicité'}
          </h2>
          {editingAd && (
            <button
              onClick={() => {
                setEditingAd(null);
                setDesktopImage(null);
                setDesktopPreview('');
                setMobileImage(null);
                setMobilePreview('');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Desktop Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Desktop * <span className="text-xs text-gray-500">(1920x630px - Paysage)</span>
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative w-48 h-28 bg-gray-100 rounded-lg overflow-hidden">
                {(desktopPreview || editingAd?.image_url) && (
                  <img
                    src={desktopPreview || editingAd?.image_url}
                    alt="Preview Desktop"
                    className="w-full h-full object-cover"
                  />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer hover:bg-black/60 transition-colors">
                  <Plus className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleDesktopImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-sm text-gray-500">
                <p className="font-medium">Format paysage</p>
                <p className="text-xs">Recommandé : 1920x630px</p>
              </div>
            </div>
          </div>

          {/* Mobile Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image Mobile <span className="text-xs text-gray-500">(800x1000px - Portrait/Carré - Optionnel)</span>
            </label>
            <div className="flex items-center space-x-4">
              <div className="relative w-32 h-40 bg-gray-100 rounded-lg overflow-hidden">
                {(mobilePreview || editingAd?.image_mobile_url) && (
                  <img
                    src={mobilePreview || editingAd?.image_mobile_url}
                    alt="Preview Mobile"
                    className="w-full h-full object-cover"
                  />
                )}
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer hover:bg-black/60 transition-colors">
                  <Plus className="w-6 h-6 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMobileImageChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="text-sm text-gray-500">
                <p className="font-medium">Format portrait/carré</p>
                <p className="text-xs">Recommandé : 800x1000px ou 800x800px</p>
                <p className="text-xs mt-1 text-amber-600">Si vide, l\'image desktop sera utilisée</p>
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre *
            </label>
            <input
              type="text"
              name="title"
              required
              defaultValue={editingAd?.title}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              rows={3}
              defaultValue={editingAd?.description || ''}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lien
            </label>
            <input
              type="url"
              name="link"
              defaultValue={editingAd?.link || ''}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
          >
            {editingAd ? 'Mettre à jour' : 'Créer'}
          </button>
        </form>

        {/* Existing Ads */}
        <div className="mt-8">
          <h3 className="text-lg font-bold mb-4">Publicités existantes</h3>
          <div className="space-y-4">
            {ads.map((ad) => (
              <div
                key={ad.id}
                className="flex items-center space-x-4 p-4 border rounded-lg"
              >
                <img
                  src={ad.image_url}
                  alt={ad.title}
                  className="w-40 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h4 className="font-medium">{ad.title}</h4>
                  {ad.description && (
                    <p className="text-sm text-gray-500">{ad.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setEditingAd(ad)}
                    className="p-2 text-gray-500 hover:text-gray-700"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(ad)}
                    className="p-2 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Supprimer la publicité"
          message="Êtes-vous sûr de vouloir supprimer cette publicité ? Cette action est irréversible."
          confirmText="Supprimer"
          cancelText="Annuler"
          danger={true}
        />
      </div>
    </div>
  );
}