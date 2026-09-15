import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Copy,
  Check,
  Share2,
  Ticket,
  Shield,
  Coins,
  Search,
  Users,
  Building,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { Invitation } from '../../api/mock-store';
import { Role } from '../../api/types';
import { useAuth } from '../../context/AuthContext';

interface InvitationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: Role;
}

export const InvitationModal: React.FC<InvitationModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'MEMBRE',
}) => {
  const { user } = useAuth();
  const [role, setRole] = useState<Role>(defaultRole);
  const [codePersonnalise, setCodePersonnalise] = useState('');
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadInvitations();
      setRole(defaultRole);
      setErrorMsg(null);
      setSuccessCode(null);
    }
  }, [isOpen, defaultRole]);

  const loadInvitations = async () => {
    try {
      setIsLoading(true);
      const list = await apiClient.getInvitations(user?.tontineId || 1);
      setInvitations(list);
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsCreating(true);
    try {
      const inv = await apiClient.creerInvitation({
        tontineId: user?.tontineId || 1,
        role,
        codePersonnalise: codePersonnalise.trim() || undefined,
      });
      setSuccessCode(inv.code);
      setCodePersonnalise('');
      await loadInvitations();
    } catch (err: any) {
      setErrorMsg(err.message || 'Impossible de créer le code.');
    } finally {
      setIsCreating(false);
    }
  };

  const getJoinUrl = (code: string) => {
    return `${window.location.origin}/login?tab=rejoindre&code=${encodeURIComponent(code)}`;
  };

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(text);
      setTimeout(() => setCopiedCode(null), 2500);
    } else {
      setCopiedLink(text);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  const shareOnWhatsApp = (code: string, invRole: Role) => {
    const roleLabels: Record<string, string> = {
      MEMBRE: 'Membre Adhérent',
      TRESORIER: 'Trésorier de Caisse',
      COMMISSAIRE: 'Commissaire aux Comptes',
      GESTIONNAIRE: 'Gestionnaire',
    };
    const message = `👋 Muraho! Vous êtes invité(e) à rejoindre notre tontine sur la plateforme AKIWACU en tant que *${roleLabels[invRole] || invRole}*.\n\n🔑 Votre code d'invitation : *${code}*\n🔗 Lien d'activation directe : ${getJoinUrl(code)}\n\nInscrivez-vous dès maintenant pour accéder à vos cotisations, crédits et reçus certifiés.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-[#e68a00]">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                  Invitation & Onboarding
                </span>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-xs text-stone-500 font-medium">Multi-rôles</span>
              </div>
              <h2 className="text-xl font-extrabold text-stone-900 font-heading mt-0.5">
                Inviter un membre ou un rôle
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Generate Invitation Section */}
        <form onSubmit={handleCreate} className="mt-5 space-y-4">
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
            <label className="block text-xs font-bold text-stone-800 uppercase font-heading tracking-wider mb-2">
              1. Choisir le rôle attribué à l'invité
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'MEMBRE',
                  name: 'Membre',
                  desc: 'Épargne & prêts',
                  icon: Users,
                  color: 'border-emerald-200 hover:border-emerald-400 bg-emerald-50/40 text-emerald-900',
                  active: 'ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50',
                },
                {
                  id: 'TRESORIER',
                  name: 'Trésorier',
                  desc: 'Caisse & décaissements',
                  icon: Coins,
                  color: 'border-amber-200 hover:border-amber-400 bg-amber-50/40 text-amber-900',
                  active: 'ring-2 ring-amber-500 border-amber-500 bg-amber-50',
                },
                {
                  id: 'COMMISSAIRE',
                  name: 'Commissaire',
                  desc: 'Vote R4 & audit R8',
                  icon: Shield,
                  color: 'border-purple-200 hover:border-purple-400 bg-purple-50/40 text-purple-900',
                  active: 'ring-2 ring-purple-500 border-purple-500 bg-purple-50',
                },
                {
                  id: 'GESTIONNAIRE',
                  name: 'Gestionnaire',
                  desc: 'Cycles & adhérents',
                  icon: Building,
                  color: 'border-blue-200 hover:border-blue-400 bg-blue-50/40 text-blue-900',
                  active: 'ring-2 ring-blue-500 border-blue-500 bg-blue-50',
                },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = role === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id as Role)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected ? item.active : item.color
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1 text-stone-700" />
                    <p className="text-xs font-bold font-heading text-stone-900">{item.name}</p>
                    <p className="text-[10px] text-stone-500 leading-tight mt-0.5">{item.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 w-full">
              <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1.5">
                Code personnalisé (optionnel)
              </label>
              <input
                type="text"
                placeholder="Ex: TONTINE-GITEGA-2026"
                value={codePersonnalise}
                onChange={(e) => setCodePersonnalise(e.target.value.toUpperCase())}
                className="w-full px-3 py-2.5 rounded-xl border border-stone-300 text-sm font-mono focus:ring-2 focus:ring-[#e68a00] focus:border-[#e68a00] outline-hidden uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={isCreating}
              className="touch-target w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#e68a00] hover:bg-[#cc7a00] text-white font-heading font-semibold text-sm shadow-xs transition-colors shrink-0 flex items-center justify-center"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              <span>{isCreating ? 'Génération...' : 'Générer l’invitation'}</span>
            </button>
          </div>
        </form>

        {/* Newly created highlight */}
        {successCode && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 font-heading">
                ✓ Code d'invitation prêt à être partagé !
              </span>
              <span className="text-xs font-mono font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-100">
                {role}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between bg-white p-3 rounded-lg border border-emerald-200">
              <span className="font-mono text-base font-bold text-stone-900 tracking-wider">
                {successCode}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(successCode, 'code')}
                  className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 hover:bg-stone-50 font-medium flex items-center text-stone-700"
                >
                  {copiedCode === successCode ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                  {copiedCode === successCode ? 'Copié !' : 'Copier'}
                </button>
                <button
                  type="button"
                  onClick={() => copyToClipboard(getJoinUrl(successCode), 'link')}
                  className="px-3 py-1.5 text-xs rounded-lg border border-stone-300 hover:bg-stone-50 font-medium flex items-center text-stone-700"
                >
                  {copiedLink === getJoinUrl(successCode) ? <Check className="w-3.5 h-3.5 text-emerald-600 mr-1" /> : <ExternalLink className="w-3.5 h-3.5 mr-1" />}
                  Lien direct
                </button>
                <button
                  type="button"
                  onClick={() => shareOnWhatsApp(successCode, role)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5 mr-1" />
                  WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Existing Invitations List */}
        <div className="mt-6 pt-5 border-t border-stone-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-stone-700 uppercase font-heading tracking-wider">
              Codes d’invitation actifs ({invitations.length})
            </h3>
            <span className="text-xs text-stone-400">Prêts pour l'onboarding</span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="p-3 rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-stone-700 shrink-0">
                    <Ticket className="w-4 h-4 text-[#e68a00]" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm">
                        {inv.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                          inv.role === 'MEMBRE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.role === 'TRESORIER'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.role === 'COMMISSAIRE'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {inv.role}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500">
                      Créé par {inv.creePar} · {inv.nbUtilisations} adhésion(s)
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyToClipboard(inv.code, 'code')}
                    className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 text-xs flex items-center"
                    title="Copier le code"
                  >
                    {copiedCode === inv.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(getJoinUrl(inv.code), 'link')}
                    className="p-2 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-600 text-xs flex items-center"
                    title="Copier le lien direct"
                  >
                    {copiedLink === getJoinUrl(inv.code) ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => shareOnWhatsApp(inv.code, inv.role)}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Partager
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-stone-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="touch-target px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-heading font-medium text-xs"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
export default InvitationModal;
