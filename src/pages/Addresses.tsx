import { ChevronLeft, Plus, Edit, Trash2, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import toast from 'react-hot-toast';
import AddressModal from '../components/settings/AddressModal';

interface Address {
    id: string;
    label: string;
    street: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
}

export default function Addresses() {
    const navigate = useNavigate();
    const { user } = useSupabaseAuth();

    const [addresses, setAddresses] = useState<Address[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddress, setEditingAddress] = useState<Address | null>(null);

    useEffect(() => {
        if (user) {
            fetchAddresses();
        }
    }, [user]);

    const fetchAddresses = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('addresses')
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            setAddresses(data.map(addr => ({
                id: addr.id,
                label: addr.label,
                street: addr.street,
                city: addr.city,
                postalCode: addr.postal_code,
                isDefault: addr.is_default
            })));
        } catch (error) {
            console.error('Error fetching addresses:', error);
            toast.error('Erreur lors du chargement des adresses');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAddress = async (addressData: Omit<Address, 'id'>) => {
        if (!user) return;

        try {
            if (editingAddress) {
                // Update existing address
                const { error } = await supabase
                    .from('addresses')
                    .update({
                        label: addressData.label,
                        street: addressData.street,
                        city: addressData.city,
                        postal_code: addressData.postalCode,
                        is_default: addressData.isDefault,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingAddress.id);

                if (error) throw error;
                toast.success('Adresse modifiée');
            } else {
                // Create new address
                const { error } = await supabase
                    .from('addresses')
                    .insert({
                        user_id: user.id,
                        label: addressData.label,
                        street: addressData.street,
                        city: addressData.city,
                        postal_code: addressData.postalCode,
                        is_default: addressData.isDefault
                    });

                if (error) throw error;
                toast.success('Adresse ajoutée');
            }

            await fetchAddresses();
            setIsModalOpen(false);
            setEditingAddress(null);
        } catch (error) {
            console.error('Error saving address:', error);
            toast.error('Erreur lors de l\'enregistrement');
            throw error;
        }
    };

    const handleDelete = async (addressId: string) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette adresse ?')) {
            return;
        }

        try {
            const { error } = await supabase
                .from('addresses')
                .delete()
                .eq('id', addressId);

            if (error) throw error;

            toast.success('Adresse supprimée');
            await fetchAddresses();
        } catch (error) {
            console.error('Error deleting address:', error);
            toast.error('Erreur lors de la suppression');
        }
    };

    const handleEdit = (address: Address) => {
        setEditingAddress(address);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingAddress(null);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
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
                        <h1 className="text-xl font-bold">Mes Adresses</h1>
                    </div>
                </div>
            </div>

            {/* Liste des adresses */}
            <div className="max-w-2xl mx-auto p-4 space-y-4 mt-4">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="bg-white rounded-lg p-12 text-center">
                        <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            Aucune adresse enregistrée
                        </h3>
                        <p className="text-gray-500 mb-6">
                            Ajoutez une adresse de livraison pour faciliter vos achats
                        </p>
                    </div>
                ) : (
                    addresses.map((address) => (
                        <div
                            key={address.id}
                            className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-gray-400" />
                                    <h3 className="font-semibold text-gray-900">{address.label}</h3>
                                </div>
                                {address.isDefault && (
                                    <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full font-medium">
                                        Par défaut
                                    </span>
                                )}
                            </div>

                            <p className="text-gray-600 text-sm mb-1">{address.street}</p>
                            <p className="text-gray-600 text-sm mb-4">
                                {address.postalCode}, {address.city}
                            </p>

                            <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
                                <button
                                    onClick={() => handleEdit(address)}
                                    className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                                >
                                    <Edit className="w-4 h-4" />
                                    Modifier
                                </button>
                                <button
                                    onClick={() => handleDelete(address.id)}
                                    className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-700 font-medium transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Supprimer
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bouton flottant Ajouter */}
            <div className="fixed bottom-20 sm:bottom-4 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
                <div className="max-w-2xl mx-auto pointer-events-auto">
                    <button
                        onClick={handleAdd}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-700 shadow-lg transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        Ajouter une adresse
                    </button>
                </div>
            </div>

            {/* Modal */}
            <AddressModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingAddress(null);
                }}
                onSave={handleSaveAddress}
                address={editingAddress}
            />
        </div>
    );
}
