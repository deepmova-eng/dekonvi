import { ChevronLeft, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function PersonalInfo() {
    const navigate = useNavigate();
    const { user } = useSupabaseAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: ''
    });

    const [originalData, setOriginalData] = useState(formData);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user || !isInitialLoad) return;

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('name, email, phone')
                    .eq('id', user.id)
                    .single();

                console.log('Profile fetch result:', { data, error });

                if (!error && data) {
                    const profileData = {
                        name: data.name || '',
                        email: user.email || '',
                        phone: data.phone || ''
                    };
                    console.log('Setting formData to:', profileData);
                    setFormData(profileData);
                    setOriginalData(profileData);
                    setIsInitialLoad(false);
                } else if (error) {
                    console.error('Error fetching profile:', error);
                    toast.error('Erreur lors du chargement des données');
                }
            } catch (err) {
                console.error('Fetch profile error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user, isInitialLoad]);

    useEffect(() => {
        const changed = JSON.stringify(formData) !== JSON.stringify(originalData);
        console.log('Checking changes:', { formData, originalData, changed });
        setHasChanges(changed);
    }, [formData, originalData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSave = async () => {
        if (!user || !hasChanges) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    name: formData.name,
                    phone: formData.phone
                    // Note: bio n'est pas sauvegardé car la colonne n'existe pas encore
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Informations mises à jour');
            setOriginalData(formData);
            setHasChanges(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-2xl mx-auto flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate('/settings')}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-xl font-bold">Informations personnelles</h1>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="max-w-2xl mx-auto p-4 space-y-4 mt-4">
                <div className="bg-white rounded-lg p-6 space-y-6">
                    {/* Nom complet */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Nom complet
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            placeholder="Votre nom complet"
                        />
                    </div>

                    {/* Email (non modifiable) */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            disabled
                            className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
                    </div>

                    {/* Téléphone */}
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                            Téléphone
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            placeholder="+228 XX XX XX XX"
                        />
                    </div>
                </div>

                {/* Bouton Enregistrer */}
                <button
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                    className={`
            w-full py-4 rounded-xl font-bold text-base transition-all duration-200
            ${hasChanges && !saving
                            ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30 transform hover:-translate-y-0.5' // État Actif (Modifié)
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed' // État Inactif (Pas de changement)
                        }
          `}
                >
                    <div className="flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" />
                        {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </div>
                </button>
            </div>
        </div>
    );
}
