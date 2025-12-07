import React, { useState } from 'react';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

interface LoginProps {
  onBack: () => void;
  onRegisterClick: () => void;
}

export default function Login({ onBack, onRegisterClick }: LoginProps) {
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);
      setError('');

      // Try Supabase client first with short timeout (3s)
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Client timeout')), 3000)
      );

      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password
      });

      let authResult;
      try {
        authResult = await Promise.race([
          loginPromise,
          timeoutPromise
        ]) as any;
      } catch (clientError) {
        // Fallback to REST API if client times out
        console.log('Supabase client timed out, using REST API fallback...');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        console.log('Making REST API call to:', `${supabaseUrl}/auth/v1/token`);

        const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: {
            'apikey': supabaseAnonKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            password
          })
        });

        console.log('REST API response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json();
          console.error('REST API error:', errorData);
          throw new Error(errorData.error_description || errorData.msg || 'Erreur de connexion');
        }

        const data = await response.json();
        console.log('REST API login successful, got tokens');

        // Check email confirmation status before storing session
        if (!data.user?.email_confirmed_at) {
          console.log('User email not confirmed, blocking access');
          toast.error('Votre compte est en attente de validation par notre équipe.');

          // Store temporary session to show pending page
          localStorage.setItem('pending_user_email', email);

          // Redirect to pending validation page
          setTimeout(() => {
            window.location.href = '/pending-validation';
          }, 1000);
          return;
        }

        // Bypass setSession completely - store tokens manually in localStorage
        console.log('Storing session manually in localStorage...');
        const session = {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
          token_type: data.token_type,
          user: data.user
        };

        // Store in the format Supabase expects
        localStorage.setItem(
          `sb-${supabaseUrl.split('//')[1].split('.')[0]}-auth-token`,
          JSON.stringify(session)
        );

        console.log('Session stored, reloading page to apply...');

        // Show success message before reload
        launchConfetti();
        toast.success('Connexion réussie !');

        // Reload page to apply session
        setTimeout(() => {
          window.location.href = '/';
        }, 500);

        return; // Exit early since we're reloading
      }

      if (authResult.error) throw authResult.error;

      // Check email confirmation status after successful Supabase client login
      const { data: { user } } = await supabase.auth.getUser();

      if (!user?.email_confirmed_at) {
        console.log('User email not confirmed via client, blocking access');

        // Sign out immediately
        await supabase.auth.signOut();

        setError('Votre compte est en attente de validation par notre équipe.');
        toast.error('Votre compte est en attente de validation.');

        // Store email for pending page
        localStorage.setItem('pending_user_email', email);

        // Redirect to pending validation page
        setTimeout(() => {
          window.location.href = '/pending-validation';
        }, 1000);
        return;
      }

      launchConfetti();
      toast.success('Connexion réussie !');

      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      console.error('Login error:', error);
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bonjour !</h1>
        <p className="text-gray-600">
          Connectez-vous et profitez de nos services !
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-6">
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-lg text-sm">
            {error}
          </div>
        )}

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
              placeholder="Votre mot de passe"
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
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form >

      <button
        onClick={onRegisterClick}
        className="mt-8 w-full py-4 bg-gray-50 rounded-xl flex items-center justify-between px-4 hover:bg-gray-100 transition-colors"
      >
        <span className="text-gray-900 font-medium">Créer un compte</span>
        <ArrowRight className="text-primary-500" />
      </button>
    </div >
  );
}