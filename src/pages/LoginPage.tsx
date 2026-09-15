import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LogIn, ShieldAlert, Sparkles, User, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/types';

const loginSchema = z.object({
  email: z.string().email('Adresse email valide requise'),
  motDePasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const { login, switchPersona } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'andy@akiwacu.bi',
      motDePasse: 'Password123!',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsSubmitting(true);
      setAuthError(null);
      await login(data.email, data.motDePasse);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setAuthError(err.message);
      } else {
        setAuthError('Erreur de connexion. Vérifiez vos identifiants.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectPersona = (email: string) => {
    switchPersona(email);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#fbfaf8]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo Badge */}
        <div className="w-14 h-14 rounded-2xl bg-[#272523] text-[#e68a00] font-heading font-bold text-2xl flex items-center justify-center mx-auto shadow-md border border-stone-700">
          A
        </div>
        <h1 className="mt-4 text-3xl font-extrabold text-stone-900 font-heading tracking-tight">
          AKIWACU
        </h1>
        <p className="mt-1 text-sm text-stone-600">
          Système de gestion communautaire d’épargne et de crédit
        </p>
        <div className="mt-2 inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-stone-700 text-xs font-mono">
          <span>Direction C « Le Compteur »</span>
          <span className="text-stone-400">·</span>
          <span className="font-semibold text-[#e68a00]">32 paths / 55 ops</span>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-stone-200 shadow-sm">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            {authError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-3">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                <div>
                  <p className="font-semibold font-heading">Échec d'authentification</p>
                  <p className="mt-0.5 leading-relaxed">{authError}</p>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider font-heading mb-1.5">
                Adresse email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className="touch-target block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e68a00] focus:border-[#e68a00] transition-colors"
                  placeholder="nom@tontine.bi"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="motDePasse" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider font-heading mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  id="motDePasse"
                  type="password"
                  autoComplete="current-password"
                  {...register('motDePasse')}
                  className="touch-target block w-full pl-10 pr-3 py-2.5 border border-stone-300 rounded-xl text-stone-900 placeholder-stone-400 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#e68a00] focus:border-[#e68a00] transition-colors"
                  placeholder="••••••••"
                />
              </div>
              {errors.motDePasse && (
                <p className="mt-1.5 text-xs text-rose-600">{errors.motDePasse.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="touch-target w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#272523] hover:bg-stone-800 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#272523] disabled:opacity-50 transition-colors font-heading"
            >
              {isSubmitting ? (
                <span>Vérification JWT...</span>
              ) : (
                <>
                  <LogIn className="w-4 h-4 mr-2 text-[#e68a00]" />
                  <span>Se connecter (POST /api/auth/login)</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Persona Access for Testing */}
          <div className="mt-8 pt-6 border-t border-stone-100">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-stone-500 font-heading uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#e68a00]" />
              <span>Accès rapide prototype par profil :</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setValue('email', 'andy@akiwacu.bi');
                  setValue('motDePasse', 'Password123!');
                  handleSelectPersona('andy@akiwacu.bi');
                }}
                className="p-2.5 text-left rounded-xl border border-stone-200 hover:border-[#e68a00] hover:bg-amber-50/50 transition-colors"
              >
                <span className="block text-xs font-bold text-stone-900 font-heading">Andy Miguel</span>
                <span className="block text-[11px] text-stone-500">ADMIN / GESTION</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue('email', 'klein@akiwacu.bi');
                  setValue('motDePasse', 'Password123!');
                  handleSelectPersona('klein@akiwacu.bi');
                }}
                className="p-2.5 text-left rounded-xl border border-stone-200 hover:border-[#e68a00] hover:bg-amber-50/50 transition-colors"
              >
                <span className="block text-xs font-bold text-stone-900 font-heading">Klein Ndayizeye</span>
                <span className="block text-[11px] text-stone-500">TRESORIER (R5)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue('email', 'gloria@akiwacu.bi');
                  setValue('motDePasse', 'Password123!');
                  handleSelectPersona('gloria@akiwacu.bi');
                }}
                className="p-2.5 text-left rounded-xl border border-stone-200 hover:border-[#e68a00] hover:bg-amber-50/50 transition-colors"
              >
                <span className="block text-xs font-bold text-stone-900 font-heading">Gloria Muhimpundu</span>
                <span className="block text-[11px] text-stone-500">COMMISSAIRE (R4)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setValue('email', 'juste@akiwacu.bi');
                  setValue('motDePasse', 'Password123!');
                  handleSelectPersona('juste@akiwacu.bi');
                }}
                className="p-2.5 text-left rounded-xl border border-stone-200 hover:border-[#e68a00] hover:bg-amber-50/50 transition-colors"
              >
                <span className="block text-xs font-bold text-stone-900 font-heading">Juste Daxa</span>
                <span className="block text-[11px] text-stone-500">MEMBRE</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
