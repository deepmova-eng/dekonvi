import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import { Upload, X, Loader2, Truck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useSupabase } from '../contexts/SupabaseContext';
import { useCreateListing, useUpdateListing } from '../hooks/useListings';
import toast from 'react-hot-toast';

const CATEGORIES = [
  'Véhicules',
  'Immobilier',
  'Multimédia',
  'Maison',
  'Mode',
  'Loisirs',
  'Matériel Pro',
  'Services',
  'Autres'
];

const CONDITIONS = [
  { value: 'new', label: 'Neuf' },
  { value: 'like-new', label: 'Comme neuf' },
  { value: 'good', label: 'Bon état' },
  { value: 'fair', label: 'État correct' },
  { value: 'poor', label: 'À bricoler' }
];

interface ListingForm {
  title: string;
  description: string;
  price: number;
  category: string;
  location: string;
  condition: string;
  delivery_available: boolean;
  contact_phone: string;
  hide_phone: boolean;
}

export default function CreateListing() {
  const { user } = useSupabase();
  const navigate = useNavigate();
  const location = useLocation();
  const { mutate: createListing, isPending: isCreating } = useCreateListing();
  const { mutate: updateListing, isPending: isUpdating } = useUpdateListing();

  const editingListing = location.state?.listing;
  const isEditing = !!editingListing;

  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<ListingForm>({
    defaultValues: {
      title: editingListing?.title || '',
      description: editingListing?.description || '',
      price: editingListing?.price || '',
      category: editingListing?.category || '',
      location: editingListing?.location || '',
      condition: editingListing?.condition || 'good',
      delivery_available: editingListing?.delivery_available || false,
      contact_phone: editingListing?.contact_phone || '',
      hide_phone: editingListing?.hide_phone || false
    }
  });

  useEffect(() => {
    // Load saved draft if not editing
    if (!isEditing) {
      const savedDraft = localStorage.getItem('listing_draft');
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft);
          Object.keys(draft).forEach(key => {
            setValue(key as any, draft[key]);
          });
        } catch (e) {
          console.error('Error loading draft', e);
        }
      }
    } else if (editingListing?.images) {
      setExistingImages(editingListing.images);
    }
  }, [isEditing, editingListing, setValue]);

  // Save draft on change
  useEffect(() => {
    if (!isEditing) {
      const subscription = watch((value) => {
        localStorage.setItem('listing_draft', JSON.stringify(value));
      });
      return () => subscription.unsubscribe();
    }
  }, [watch, isEditing]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);

      const newUrls = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newUrls]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      const newUrls = [...prev];
      URL.revokeObjectURL(newUrls[index]);
      return newUrls.filter((_, i) => i !== index);
    });
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ListingForm) => {
    if (!user) return;

    if (images.length === 0 && existingImages.length === 0) {
      toast.error('Veuillez ajouter au moins une photo');
      return;
    }

    try {
      setUploading(true);
      const uploadedUrls: string[] = [];

      // Upload new images
      for (const file of images) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('listings')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('listings')
          .getPublicUrl(filePath);

        uploadedUrls.push(publicUrl);
      }

      const finalImages = [...existingImages, ...uploadedUrls];

      const listingData = {
        ...data,
        price: Number(data.price),
        images: finalImages,
        seller_id: user.id,
        status: 'active' as const // Auto-active for now
      };

      if (isEditing) {
        updateListing({ id: editingListing.id, updates: listingData }, {
          onSuccess: () => {
            navigate(`/listings/${editingListing.id}`);
          }
        });
      } else {
        createListing(listingData, {
          onSuccess: () => {
            localStorage.removeItem('listing_draft');
            navigate('/'); // Redirect to home or new listing
            toast.success('Annonce créée avec succès !');
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Modifier l\'annonce' : 'Déposer une annonce'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Catégorie
          </label>
          <select
            {...register('category', { required: 'La catégorie est requise' })}
            className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Choisir une catégorie</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && (
            <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Titre de l'annonce
          </label>
          <input
            type="text"
            {...register('title', { required: 'Le titre est requis' })}
            className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ex: iPhone 12 Pro Max 256Go"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            État du produit
          </label>
          <select
            {...register('condition', { required: 'L\'état est requis' })}
            className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
          >
            {CONDITIONS.map(cond => (
              <option key={cond.value} value={cond.value}>{cond.label}</option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            {...register('description', { required: 'La description est requise' })}
            rows={5}
            className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Décrivez votre produit en détail..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix (FCFA)
          </label>
          <input
            type="number"
            {...register('price', { required: 'Le prix est requis', min: 0 })}
            className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            placeholder="0"
          />
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        {/* Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (Max 3)
          </label>
          <div className="grid grid-cols-3 gap-4">
            {/* Existing Images */}
            {existingImages.map((url, index) => (
              <div key={`existing-${index}`} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeExistingImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* New Preview Images */}
            {previewUrls.map((url, index) => (
              <div key={`new-${index}`} className="relative aspect-square">
                <img
                  src={url}
                  alt={`Nouvelle photo ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            ))}

            {/* Upload Button */}
            {(existingImages.length + previewUrls.length) < 3 && (
              <label className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors">
                <Upload className="w-8 h-8 text-gray-400" />
                <span className="text-sm text-gray-500 mt-2">Ajouter</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ville / Quartier
          </label>
          <input
            type="text"
            {...register('location', { required: 'La localisation est requise' })}
            className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ex: Lomé, Agoè"
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
          )}
        </div>

        {/* Delivery Checkbox */}
        <div className="flex items-center space-x-3 bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center h-5">
            <input
              id="delivery_available"
              type="checkbox"
              {...register('delivery_available')}
              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
            />
          </div>
          <div className="flex items-center">
            <Truck className="h-5 w-5 text-gray-400 mr-2" />
            <label htmlFor="delivery_available" className="font-medium text-gray-700">
              Livraison possible
            </label>
          </div>
        </div>

        {/* Contact Info */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">Contact</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Numéro de téléphone
              </label>
              <input
                type="tel"
                {...register('contact_phone')}
                className="w-full rounded-lg border-gray-300 focus:ring-primary-500 focus:border-primary-500"
                placeholder="+228 90 00 00 00"
              />
            </div>

            <div className="flex items-center space-x-3">
              <input
                id="hide_phone"
                type="checkbox"
                {...register('hide_phone')}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
              />
              <label htmlFor="hide_phone" className="text-sm text-gray-700">
                Masquer mon numéro sur l'annonce (contact par messagerie uniquement)
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={uploading || isCreating || isUpdating}
          className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {(uploading || isCreating || isUpdating) ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              {isEditing ? 'Modification...' : 'Publication...'}
            </>
          ) : (
            isEditing ? 'Mettre à jour l\'annonce' : 'Publier l\'annonce'
          )}
        </button>
      </form>
    </div>
  );
}