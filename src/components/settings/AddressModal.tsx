import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Address {
    id?: string;
    label: string;
    street: string;
    city: string;
    postalCode: string;
    isDefault: boolean;
}

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (address: Omit<Address, 'id'>) => Promise<void>;
    address?: Address | null;
}

export default function AddressModal({ isOpen, onClose, onSave, address }: AddressModalProps) {
    const [formData, setFormData] = useState<Omit<Address, 'id'>>({
        label: '',
        street: '',
        city: '',
        postalCode: '',
        isDefault: false
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (address) {
            setFormData({
                label: address.label,
                street: address.street,
                city: address.city,
                postalCode: address.postalCode,
                isDefault: address.isDefault
            });
        } else {
            setFormData({
                label: '',
                street: '',
                city: '',
                postalCode: '',
                isDefault: false
            });
        }
    }, [address, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.label || !formData.street || !formData.city || !formData.postalCode) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        setSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error('Error saving address:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        {address ? 'Modifier l\'adresse' : 'Nouvelle adresse'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
                            Libellé *
                        </label>
                        <input
                            type="text"
                            id="label"
                            name="label"
                            value={formData.label}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            placeholder="Domicile, Bureau, etc."
                        />
                    </div>

                    <div>
                        <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                            Rue *
                        </label>
                        <input
                            type="text"
                            id="street"
                            name="street"
                            value={formData.street}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                            placeholder="123 Rue de la Paix"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-2">
                                Code Postal *
                            </label>
                            <input
                                type="text"
                                id="postalCode"
                                name="postalCode"
                                value={formData.postalCode}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                placeholder="01 BP 1234"
                            />
                        </div>

                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                                Ville *
                            </label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                placeholder="Lomé"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            name="isDefault"
                            checked={formData.isDefault}
                            onChange={handleChange}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <label htmlFor="isDefault" className="text-sm text-gray-700">
                            Définir comme adresse par défaut
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
