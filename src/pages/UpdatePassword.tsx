import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';

export default function UpdatePassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
    const navigate = useNavigate();

    // Calculate password strength
    useEffect(() => {
        if (newPassword.length === 0) {
            setPasswordStrength('weak');
            return;
        }

        let strength = 0;
        if (newPassword.length >= 8) strength++;
        if (newPassword.length >= 12) strength++;
        if (/[a-z]/.test(newPassword) && /[A-Z]/.test(newPassword)) strength++;
        if (/\d/.test(newPassword)) strength++;
        if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;

        if (strength <= 2) setPasswordStrength('weak');
        else if (strength <= 4) setPasswordStrength('medium');
        else setPasswordStrength('strong');
    }, [newPassword]);

    const getStrengthColor = () => {
        switch (passwordStrength) {
            case 'weak':
                return 'bg-red-500';
            case 'medium':
                return 'bg-yellow-500';
            case 'strong':
                return 'bg-green-500';
        }
    };

    const getStrengthWidth = () => {
        switch (passwordStrength) {
            case 'weak':
                return 'w-1/3';
            case 'medium':
                return 'w-2/3';
            case 'strong':
                return 'w-full';
        }
    };

    const launchConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#2DD181', '#27ae60', '#ffffff']
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            toast.error('Les mots de passe ne correspondent pas');
            return;
        }

        // Validate minimum length
        if (newPassword.length < 6) {
            setError('Le mot de passe doit contenir au moins 6 caractères');
            toast.error('Le mot de passe doit contenir au moins 6 caractères');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const { error: updateError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (updateError) throw updateError;

            launchConfetti();
            toast.success('Mot de passe mis à jour avec succès !');

            // Redirect to home after success
            setTimeout(() => {
                navigate('/');
            }, 1500);
        } catch (error) {
            console.error('Password update error:', error);
            if (error instanceof Error) {
                setError(error.message);
                toast.error(error.message);
            } else {
                setError('Une erreur est survenue');
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

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Nouveau mot de passe</h1>
                <p className="text-gray-600 mb-8">
                    Définissez un nouveau mot de passe pour votre compte.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Nouveau mot de passe <span className="text-gray-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? 'text' : 'password'}
                                id="newPassword"
                                required
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors pr-12"
                                placeholder="Entrez votre nouveau mot de passe"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>

                        {/* Password Strength Indicator */}
                        {newPassword.length > 0 && (
                            <div className="mt-2">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-300 ${getStrengthColor()} ${getStrengthWidth()}`}
                                        />
                                    </div>
                                    <span className="text-xs text-gray-600 capitalize">{passwordStrength}</span>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Au moins 6 caractères recommandés
                                </p>
                            </div>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                            Confirmer le mot de passe <span className="text-gray-400">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors pr-12"
                                placeholder="Confirmez votre nouveau mot de passe"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
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
                        {loading ? 'Mise à jour...' : 'Mettre à jour'}
                    </button>
                </form>
            </div>
        </div>
    );
}
