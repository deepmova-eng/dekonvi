import { Clock, CheckCircle, Mail, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function PendingValidation() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            toast.success('Déconnecté avec succès');
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Erreur lors de la déconnexion');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-green-50 flex items-center justify-center px-4 py-8">
            <div className="max-w-md w-full">
                {/* Premium Card */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
                    {/* Icon */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                                <Clock className="w-10 h-10 text-primary-500" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">!</span>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-3">
                        Compte en attente de validation
                    </h1>

                    {/* Description */}
                    <p className="text-gray-600 text-center mb-8 leading-relaxed">
                        Votre compte a été créé avec succès ! Notre équipe de modération examine votre demande pour garantir la sécurité de notre communauté.
                    </p>

                    {/* Info Cards */}
                    <div className="space-y-4 mb-8">
                        <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-xl">
                            <CheckCircle className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">Validation en cours</p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Délai habituel : 24-48 heures
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-xl">
                            <Mail className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-green-900">Notification par email</p>
                                <p className="text-xs text-green-700 mt-1">
                                    Vous recevrez un email dès que votre compte sera activé
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-gray-50 rounded-xl p-4 mb-6">
                        <p className="text-xs text-gray-600 text-center">
                            💡 <span className="font-medium">Astuce :</span> Vérifiez votre dossier spam et ajoutez-nous à vos contacts pour ne rien manquer
                        </p>
                    </div>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors flex items-center justify-center space-x-2"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Se déconnecter</span>
                    </button>

                    {/* Support Link */}
                    <p className="text-center text-xs text-gray-500 mt-6">
                        Besoin d'aide ?{' '}
                        <a href="mailto:support@dekonvi.com" className="text-primary-500 hover:text-primary-600 font-medium">
                            Contactez le support
                        </a>
                    </p>
                </div>

                {/* Back to Home */}
                <div className="text-center mt-6">
                    <button
                        onClick={() => navigate('/')}
                        className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
                    >
                        ← Retour à l'accueil
                    </button>
                </div>
            </div>
        </div>
    );
}
