import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

interface RegisterProps {
  onBack: () => void;
  onLoginClick: () => void;
}

export default function Register({ onBack, onLoginClick }: RegisterProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const launchConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['var(--primary-500)', '#27ae60', '#ffffff']
    });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError('');

      // Sign up with Supabase with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Auth timeout')), 5000) // 5s timeout for auth
      );

      const signUpPromise = supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name }
        }
      });

      const { error: signUpError } = await Promise.race([
        signUpPromise,
        timeoutPromise
      ]) as any;

      if (signUpError) throw signUpError;

      // Registration successful - user needs admin validation before accessing site
      // Don't auto-login, redirect to home with message
      launchConfetti();
      toast.success('Compte créé ! En attente de validation par notre équipe.', {
        duration: 6000,
        icon: '⏳'
      });

      setTimeout(() => {
        onBack();
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);

      // Fallback to REST API
      if (error instanceof Error && error.message === 'Auth timeout') {
        console.log('[Register] signUp timed out, using REST API fallback...');
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email,
              password,
              data: { name }
            })
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.msg || data.error_description || 'Erreur lors de l\'inscription');
          }

          // Success via REST - Try to login via REST too if needed, or just redirect
          // Since we can't easily get a session via REST without another call, let's try standard login
          console.log('REST signup success, attempting REST login...');

          const loginResponse = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
              'apikey': supabaseAnonKey,
              'Authorization': `Bearer ${supabaseAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email,
              password
            })
          });

          if (loginResponse.ok) {
            const sessionData = await loginResponse.json();
            // Manually set session if possible or just let the user login
            // Setting session manually is tricky without the client, but we can try
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: sessionData.access_token,
              refresh_token: sessionData.refresh_token
            });

            if (!setSessionError) {
              launchConfetti();
              toast.success('Compte créé ! Redirection...');
              setTimeout(() => {
                onBack();
              }, 1500);
              return;
            }
          }

          launchConfetti();
          toast.success('Compte créé ! Veuillez vous connecter.');
          setTimeout(() => {
            onBack();
          }, 1500);
        } catch (fallbackError) {
          console.error('REST API signup fallback error:', fallbackError);
          if (fallbackError instanceof Error) {
            setError(fallbackError.message);
            toast.error(fallbackError.message);
          } else {
            setError('Une erreur est survenue lors de l\'inscription');
            toast.error('Une erreur est survenue');
          }
          return;
        }
      }

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
      <div className="mb-12">
        <button
          onClick={onBack}
          className="mb-8 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12H20M4 12L10 6M4 12L10 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
        <p className="text-gray-600">
          Rejoignez notre communauté !
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nom complet <span className="text-gray-400">*</span>
          </label>
          <input
            type="text"
            id="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors"
            placeholder="Votre nom complet"
          />
        </div>

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Mot de passe <span className="text-gray-400">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-full border border-gray-200 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition-colors pr-12"
              placeholder="Choisissez un mot de passe"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
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
          {loading ? 'Création du compte...' : 'Créer mon compte'}
        </button>
      </form>

      <button
        onClick={onLoginClick}
        className="mt-8 w-full py-4 bg-gray-50 rounded-xl flex items-center justify-between px-4 hover:bg-gray-100 transition-colors"
      >
        <span className="text-gray-900 font-medium">Déjà un compte ? Se connecter</span>
        <ArrowRight className="text-primary-500" />
      </button>
    </div>
  );
}