import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  LogIn,
  ShieldAlert,
  Sparkles,
  User,
  KeyRound,
  Ticket,
  Building,
  UserPlus,
  ArrowRight,
  CheckCircle2,
  Users,
  Coins,
  Shield,
  Phone,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError, Role } from '../api/types';
import { apiClient } from '../api/client';
import { Invitation } from '../api/mock-store';

const loginSchema = z.object({
  email: z.string().email('Adresse email valide requise'),
  motDePasse: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

type LoginFormData = z.infer<typeof loginSchema>;

type PortalTab = 'login' | 'rejoindre' | 'creer';

export const LoginPage: React.FC = () => {
  const { login, switchPersona, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const initialTab = (searchParams.get('tab') as PortalTab) || 'login';
  const initialCode = searchParams.get('code') || '';

  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invitation join states
  const [inviteCode, setInviteCode] = useState(initialCode);
  const [verifiedInvitation, setVerifiedInvitation] = useState<Invitation | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Join form states
  const [joinNom, setJoinNom] = useState('');
  const [joinPrenom, setJoinPrenom] = useState('');
  const [joinEmail, setJoinEmail] = useState('');
  const [joinTelephone, setJoinTelephone] = useState('+257 79 ');
  const [joinPassword, setJoinPassword] = useState('Password123!');

  // Tontine creation states
  const [tontineNom, setTontineNom] = useState('');
  const [tontineDescription, setTontineDescription] = useState('');
  const [montantCotisation, setMontantCotisation] = useState(50000);
  const [periodicite, setPeriodicite] = useState<'MENSUELLE' | 'HEBDOMADAIRE'>('MENSUELLE');
  const [adminNom, setAdminNom] = useState('');
  const [adminPrenom, setAdminPrenom] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminTelephone, setAdminTelephone] = useState('+257 79 ');
  const [adminPassword, setAdminPassword] = useState('Password123!');
  const [createError, setCreateError] = useState<string | null>(null);

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

  // Auto-verify if code passed in URL
  useEffect(() => {
    if (initialCode) {
      setInviteCode(initialCode);
      verifyCode(initialCode);
    }
  }, [initialCode]);

  const verifyCode = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) {
      setVerifiedInvitation(null);
      setInviteError(null);
      return;
    }
    try {
      setIsVerifyingCode(true);
      setInviteError(null);
      const inv = await apiClient.verifierInvitation(codeToVerify);
      setVerifiedInvitation(inv);
    } catch (err: any) {
      setVerifiedInvitation(null);
      setInviteError(err.message || 'Code d’invitation introuvable.');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const onSubmitLogin = async (data: LoginFormData) => {
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

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode) return;
    try {
      setIsSubmitting(true);
      setInviteError(null);
      const res = await apiClient.rejoindreTontine(inviteCode, {
        nom: joinNom,
        prenom: joinPrenom,
        email: joinEmail,
        motDePasse: joinPassword,
        telephone: joinTelephone,
      });
      setSession(res.token);
      navigate(from, { replace: true });
    } catch (err: any) {
      setInviteError(err.message || 'Impossible de rejoindre la tontine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTontineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setCreateError(null);
      const res = await apiClient.creerTontineComplete({
        nom: tontineNom,
        description: tontineDescription,
        periodicite,
        montantCotisation,
        administrateur: {
          nom: adminNom,
          prenom: adminPrenom,
          email: adminEmail,
          telephone: adminTelephone,
          motDePasse: adminPassword,
        },
      });
      setSession(res.token);
      navigate(from, { replace: true });
    } catch (err: any) {
      setCreateError(err.message || 'Échec de la création de la tontine.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 bg-[#fbfaf8]">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
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

        {/* 3 Main Entry Points Tabs */}
        <div className="mt-6 flex p-1.5 rounded-2xl bg-stone-200/70 max-w-md mx-auto shadow-inner text-xs font-heading font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'login'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-[#e68a00]" />
            <span>Connexion</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rejoindre')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'rejoindre'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Ticket className="w-3.5 h-3.5 text-[#e68a00]" />
            <span>Rejoindre</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('creer')}
            className={`flex-1 py-2.5 px-3 rounded-xl transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'creer'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Building className="w-3.5 h-3.5 text-[#e68a00]" />
            <span>Créer Tontine</span>
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-stone-200 shadow-sm">
          {/* TAB 1: STANDARD LOGIN & ROLE IMMERSION */}
          {activeTab === 'login' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-extrabold text-stone-900 font-heading">
                  Se connecter à son espace
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Accédez à votre compte avec vos identifiants ou testez directement un rôle.
                </p>
              </div>

              {authError && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <p className="font-semibold font-heading">Échec d'authentification</p>
                    <p className="mt-0.5 leading-relaxed">{authError}</p>
                  </div>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit(onSubmitLogin)}>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-stone-700 uppercase tracking-wider font-heading mb-1.5"
                  >
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
                    <p className="mt-1 text-xs text-rose-600">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="motDePasse"
                    className="block text-xs font-semibold text-stone-700 uppercase tracking-wider font-heading mb-1.5"
                  >
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
                    <p className="mt-1 text-xs text-rose-600">{errors.motDePasse.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="touch-target w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#272523] hover:bg-stone-800 disabled:opacity-50 transition-colors font-heading"
                >
                  {isSubmitting ? (
                    <span>Vérification JWT...</span>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4 mr-2 text-[#e68a00]" />
                      <span>Connexion sécurisée</span>
                    </>
                  )}
                </button>
              </form>

              {/* Instant Role Immersion Entry Points */}
              <div className="pt-6 border-t border-stone-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-stone-700 font-heading uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[#e68a00]" />
                    <span>Portail d'accès par rôle (Test immédiat) :</span>
                  </div>
                  <span className="text-[11px] text-stone-400 font-mono">1 clic</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'andy@akiwacu.bi');
                      setValue('motDePasse', 'Password123!');
                      handleSelectPersona('andy@akiwacu.bi');
                    }}
                    className="p-3 text-left rounded-xl border border-stone-200 hover:border-[#e68a00] hover:bg-amber-50/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 font-heading group-hover:text-[#e68a00]">
                        Andy Miguel
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 font-bold">
                        ADMIN
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                      Gouvernance, cycles, membres, quotas & configuration globale
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'klein@akiwacu.bi');
                      setValue('motDePasse', 'Password123!');
                      handleSelectPersona('klein@akiwacu.bi');
                    }}
                    className="p-3 text-left rounded-xl border border-stone-200 hover:border-[#e68a00] hover:bg-amber-50/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 font-heading group-hover:text-[#e68a00]">
                        Klein Ndayizeye
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold">
                        TRÉSORIER
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                      Compteur de cotisations, encaissements, solde caisse & décaissements
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'gloria@akiwacu.bi');
                      setValue('motDePasse', 'Password123!');
                      handleSelectPersona('gloria@akiwacu.bi');
                    }}
                    className="p-3 text-left rounded-xl border border-stone-200 hover:border-[#e68a00] hover:bg-amber-50/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 font-heading group-hover:text-[#e68a00]">
                        Gloria Muhimpundu
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-900 font-bold">
                        COMMISSAIRE
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                      Vote collégial R4 (quorum 2/2), contrôle des prêts & audit R8
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'juste@akiwacu.bi');
                      setValue('motDePasse', 'Password123!');
                      handleSelectPersona('juste@akiwacu.bi');
                    }}
                    className="p-3 text-left rounded-xl border border-stone-200 hover:border-[#e68a00] hover:bg-amber-50/50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 font-heading group-hover:text-[#e68a00]">
                        Juste Daxa
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold">
                        MEMBRE
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1 leading-snug">
                      Carnet personnel d'épargne, demandes de prêt & plafond R6 (3x)
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: REJOINDRE UNE TONTINE VIA CODE D'INVITATION */}
          {activeTab === 'rejoindre' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                    Invitation & Rôle
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-stone-900 font-heading mt-1">
                  Rejoindre une Tontine avec un Code
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Saisissez le code d'invitation transmis par les administrateurs de votre association.
                </p>
              </div>

              {inviteError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{inviteError}</span>
                </div>
              )}

              {/* Step 1: Enter & Verify Code */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
                <label className="block text-xs font-bold text-stone-800 uppercase font-heading mb-1.5">
                  Code d'invitation reçu
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Ex: TONTINE-MEMBRE-2026"
                    value={inviteCode}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setInviteCode(val);
                      verifyCode(val);
                    }}
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 font-mono text-sm tracking-wider uppercase focus:ring-2 focus:ring-[#e68a00] focus:border-[#e68a00] outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => verifyCode(inviteCode)}
                    disabled={isVerifyingCode || !inviteCode.trim()}
                    className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-heading font-semibold"
                  >
                    {isVerifyingCode ? 'Vérification...' : 'Vérifier'}
                  </button>
                </div>

                {/* Preset test codes */}
                <div className="mt-3 pt-3 border-t border-stone-200/70">
                  <span className="text-[11px] text-stone-500 block mb-1.5 font-medium">
                    Codes d'invitation de test prêts à l'emploi :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { code: 'TONTINE-MEMBRE-2026', label: 'Membre', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                      { code: 'TONTINE-TRESORIER-2026', label: 'Trésorier', color: 'bg-amber-50 text-amber-800 border-amber-200' },
                      { code: 'TONTINE-COMMISSAIRE-2026', label: 'Commissaire', color: 'bg-purple-50 text-purple-800 border-purple-200' },
                      { code: 'TONTINE-GESTION-2026', label: 'Gestionnaire', color: 'bg-blue-50 text-blue-800 border-blue-200' },
                    ].map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setInviteCode(item.code);
                          verifyCode(item.code);
                        }}
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded-lg border hover:opacity-80 transition-opacity ${item.color}`}
                      >
                        {item.code} ({item.label})
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Verified Badge */}
              {verifiedInvitation && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-emerald-900 font-heading">
                        Invitation valide pour {verifiedInvitation.tontineNom}
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        Rôle automatiquement assigné :{' '}
                        <strong className="font-mono uppercase">{verifiedInvitation.role}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-emerald-200 text-emerald-900">
                    Certifié
                  </span>
                </div>
              )}

              {/* Step 2: Member Account Info */}
              <form onSubmit={handleJoinSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Prénom
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Diane"
                      value={joinPrenom}
                      onChange={(e) => setJoinPrenom(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nom
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Nizigama"
                      value={joinNom}
                      onChange={(e) => setJoinNom(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="diane@email.bi"
                    value={joinEmail}
                    onChange={(e) => setJoinEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      required
                      value={joinTelephone}
                      onChange={(e) => setJoinTelephone(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      value={joinPassword}
                      onChange={(e) => setJoinPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !inviteCode.trim()}
                  className="touch-target w-full mt-2 flex items-center justify-center py-3 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#e68a00] hover:bg-[#cc7a00] disabled:opacity-50 transition-colors font-heading"
                >
                  {isSubmitting ? (
                    <span>Inscription & Adhésion en cours...</span>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      <span>Activer mon adhésion & Accéder</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: CRÉER UNE NOUVELLE TONTINE (FOUNDER ONBOARDING) */}
          {activeTab === 'creer' && (
            <div className="space-y-5">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                    Fondateur & Admin
                  </span>
                </div>
                <h2 className="text-lg font-extrabold text-stone-900 font-heading mt-1">
                  Créer une nouvelle Tontine
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Lancez votre groupe d'épargne solidaire et devenez l'administrateur principal.
                </p>
              </div>

              {createError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{createError}</span>
                </div>
              )}

              <form onSubmit={handleCreateTontineSubmit} className="space-y-4">
                <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
                  <span className="text-xs font-bold text-stone-800 uppercase font-heading block">
                    1. Identité de l'Association
                  </span>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      Nom de la tontine
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Tontine Dushirehamwe de Ngozi"
                      value={tontineNom}
                      onChange={(e) => setTontineNom(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-600 mb-1">
                      Description & Quartier / Ville
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Quartier Kanyosha, commerçants et artisans"
                      value={tontineDescription}
                      onChange={(e) => setTontineDescription(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Cotisation par membre (BIF)
                      </label>
                      <input
                        type="number"
                        step={1000}
                        min={5000}
                        required
                        value={montantCotisation}
                        onChange={(e) => setMontantCotisation(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Périodicité
                      </label>
                      <select
                        value={periodicite}
                        onChange={(e) => setPeriodicite(e.target.value as any)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                      >
                        <option value="MENSUELLE">Mensuelle</option>
                        <option value="HEBDOMADAIRE">Hebdomadaire</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                  <span className="text-xs font-bold text-amber-900 uppercase font-heading block">
                    2. Compte Fondateur (Premier Administrateur)
                  </span>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Prénom</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Jean-Marie"
                        value={adminPrenom}
                        onChange={(e) => setAdminPrenom(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Nom</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Nkurunziza"
                        value={adminNom}
                        onChange={(e) => setAdminNom(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-stone-700 mb-1">Email</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@nouvelletontine.bi"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        required
                        value={adminTelephone}
                        onChange={(e) => setAdminTelephone(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-700 mb-1">Mot de passe</label>
                      <input
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="touch-target w-full flex items-center justify-center py-3.5 px-4 rounded-xl shadow-xs text-sm font-semibold text-white bg-[#272523] hover:bg-stone-800 disabled:opacity-50 transition-colors font-heading"
                >
                  {isSubmitting ? (
                    <span>Création de la tontine en cours...</span>
                  ) : (
                    <>
                      <Building className="w-4 h-4 mr-2 text-[#e68a00]" />
                      <span>Créer la Tontine & Générer les Codes d'Invitation</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
