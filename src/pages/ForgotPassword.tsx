import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [emailSent, setEmailSent] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        try {
            setLoading(true);

            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;

            setEmailSent(true);
            toast.success('Email envoyé ! Vérifiez votre boîte de réception.');
        } catch (error) {
            console.error('Password reset error:', error);
            if (error instanceof Error) {
                toast.error(error.message);
            } else {
                toast.error('Une erreur est survenue');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white px-4 py-8">
            <div className="max-w-md mx-auto">
                <button
                    onClick={() => navigate('/login')}
                    className="mb-8 p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center gap-2"
                >
                    <ArrowLeft size={20} />
                    <span className="text-sm">Retour</span>
                </button>

                {!emailSent ? (
                    <>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mot de passe oublié ?</h1>
                        <p className="text-gray-600 mb-8">
                            Entrez votre email pour recevoir un lien de réinitialisation.
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    E-mail <span className="text-gray-400">*</span>
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
                                    placeholder="Votre adresse email"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-4 rounded-full font-semibold text-white text-lg transition-all shadow-lg ${loading
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-primary-500 hover:bg-primary-600 hover:shadow-xl active:scale-[0.98]'
                                    }`}
                                style={{
                                    background: loading ? undefined : 'linear-gradient(135deg, #2DD181 0%, #27ae60 100%)',
                                }}
                            >
                                {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg
                                className="w-8 h-8 text-green-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email envoyé !</h2>
                        <p className="text-gray-600 mb-8">
                            Nous avons envoyé un lien de réinitialisation à <strong>{email}</strong>.
                            <br />
                            Vérifiez votre boîte de réception et cliquez sur le lien.
                        </p>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-green-600 hover:text-green-500 font-medium hover:underline"
                        >
                            Retour à la connexion
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
