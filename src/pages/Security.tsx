import { ChevronLeft, Save, AlertTriangle, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export default function Security() {
    const navigate = useNavigate();
    const { user } = useSupabaseAuth();
    const [loading, setLoading] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    const handleSavePassword = async () => {
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            toast.error('Veuillez remplir tous les champs');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) throw error;

            toast.success('Mot de passe modifié avec succès');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error: any) {
            console.error('Error updating password:', error);
            toast.error(error.message || 'Erreur lors de la modification');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // TODO: Implémenter la suppression du compte côté serveur
            toast.error('Fonctionnalité à implémenter côté serveur');
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error('Error deleting account:', error);
            toast.error('Erreur lors de la suppression');
        } finally {
            setLoading(false);
        }
    };

    const canSavePassword = passwordData.currentPassword &&
        passwordData.newPassword &&
        passwordData.confirmPassword &&
        passwordData.newPassword === passwordData.confirmPassword;

    return (
        <div className="min-h-screen bg-white">
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
                        <h1 className="text-xl font-bold">Sécurité & Connexion</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto p-4 space-y-6 mt-4">
                {/* Section Mot de passe */}
                <div className="bg-white rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-gray-100 rounded-full">
                            <Lock className="w-5 h-5 text-gray-600" />
                        </div>
                        <h2 className="text-lg font-semibold">Changer le mot de passe</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Mot de passe actuel
                            </label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={passwordData.currentPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Nouveau mot de passe
                            </label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={passwordData.newPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-gray-400 mt-1">Minimum 6 caractères</p>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirmer le nouveau mot de passe
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={passwordData.confirmPassword}
                                onChange={handlePasswordChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-colors"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            onClick={handleSavePassword}
                            disabled={!canSavePassword || loading}
                            className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all ${canSavePassword && !loading
                                ? 'bg-primary-500 text-white hover:bg-primary-600'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            <Save className="w-5 h-5" />
                            {loading ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
                        </button>
                    </div>
                </div>

                {/* Section Danger */}
                <div className="bg-white rounded-lg p-6 border-2 border-red-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-100 rounded-full">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-red-600">Zone de danger</h2>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">
                        La suppression de votre compte est définitive. Toutes vos annonces, messages et données seront perdus.
                    </p>

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full py-3 px-4 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                        Supprimer mon compte
                    </button>
                </div>
            </div>

            {/* Modal de confirmation de suppression */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-red-100 rounded-full">
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Supprimer le compte ?</h3>
                        </div>

                        <p className="text-gray-600 mb-6">
                            Cette action est <strong>irréversible</strong>. Toutes vos données seront définitivement supprimées.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={loading}
                                className="flex-1 py-3 px-4 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                            >
                                {loading ? 'Suppression...' : 'Supprimer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
