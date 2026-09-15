import React, { useState, useMemo } from 'react';
import {
  Coins,
  Search,
  CheckCircle,
  Clock,
  Download,
  AlertCircle,
  FileCheck2,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  Receipt,
  RotateCcw,
} from 'lucide-react';
import {
  useCotisationsQuery,
  useCotisationQuery,
  useCreateCotisationMutation,
  useCreateCotisationBatchMutation,
  useUpdateCotisationMutation,
  useMembresQuery,
  useCyclesQuery,
} from '../api/queries';
import { Montant } from '../components/Montant';
import { LoadingSkeleton } from '../components/ui-states/LoadingSkeleton';
import { EmptyState } from '../components/ui-states/EmptyState';
import { ErrorState } from '../components/ui-states/ErrorState';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { ApiError } from '../api/types';

export const CotisationsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { data: cotisations = [], isLoading, isError, error, refetch } = useCotisationsQuery();
  const { data: membres = [] } = useMembresQuery();
  const { data: cycles = [] } = useCyclesQuery();

  const isAdminOrGestionnaire = hasRole(['ADMIN', 'GESTIONNAIRE']);
  const isTresorierOnly = hasRole(['TRESORIER']) && !isAdminOrGestionnaire;
  const isCommissaireOnly = hasRole(['COMMISSAIRE']) && !isAdminOrGestionnaire;
  const isMembreOnly = !isAdminOrGestionnaire && !isTresorierOnly && !isCommissaireOnly;
  const canCollect = isAdminOrGestionnaire || isTresorierOnly;

  // Resolve current member profile
  const currentMember = useMemo(() => {
    if (!user) return membres[0];
    return (
      membres.find((m) => m.utilisateurId === user.utilisateurId) ||
      membres.find(
        (m) =>
          m.nom.toLowerCase() === (user.nom || '').toLowerCase() &&
          m.prenom.toLowerCase() === (user.prenom || '').toLowerCase()
      ) ||
      membres[0]
    );
  }, [membres, user]);

  const memberCotisations = useMemo(() => {
    if (!currentMember) return [];
    return cotisations.filter((c) => c.membreId === currentMember.id);
  }, [cotisations, currentMember]);

  const totalMemberCotisations = useMemo(() => {
    return memberCotisations.reduce((sum, c) => sum + (c.montant || 0), 0);
  }, [memberCotisations]);

  const createCotisationMutation = useCreateCotisationMutation();
  const createBatchMutation = useCreateCotisationBatchMutation();
  const updateCotisationMutation = useUpdateCotisationMutation();

  // Active cycle
  const activeCycle = useMemo(() => cycles.find((c) => c.statut === 'OUVERT') || cycles[0], [cycles]);
  const standardAmount = activeCycle?.montantCotisation || 50000;

  // Mode selection: Compteur (Rapide 1 à 1) vs Batch (Lot) vs Historique
  const [activeTab, setActiveTab] = useState<'compteur' | 'batch' | 'liste'>(canCollect ? 'compteur' : 'liste');

  // Compteur State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembreId, setSelectedMembreId] = useState<number | null>(null);
  const [montantSaisi, setMontantSaisi] = useState<number>(standardAmount);
  const [modePaiement, setModePaiement] = useState<'ESPECES' | 'MOBILE_MONEY' | 'VIREMENT'>('ESPECES');
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<unknown | null>(null);

  // Batch Mode State
  const [batchSelectedMembres, setBatchSelectedMembres] = useState<number[]>([]);
  const [batchModePaiement, setBatchModePaiement] = useState<'ESPECES' | 'MOBILE_MONEY' | 'VIREMENT'>('ESPECES');

  // Modification modal state
  const [editingCotisation, setEditingCotisation] = useState<any | null>(null);
  const [editMontant, setEditMontant] = useState<number>(0);
  const [editModePaiement, setEditModePaiement] = useState<'ESPECES' | 'MOBILE_MONEY' | 'VIREMENT'>('ESPECES');
  const [editError, setEditError] = useState<unknown | null>(null);
  const [inspectCotisationId, setInspectCotisationId] = useState<number | null>(null);

  const { data: inspectedCotisation, isLoading: loadingInspected } = useCotisationQuery(inspectCotisationId || 0);

  // Live session total (Le Compteur motif)
  const sessionTotal = useMemo(() => {
    return cotisations.reduce((sum, c) => sum + (c.montant || 0), 0);
  }, [cotisations]);

  // Filtered members for search
  const filteredMembres = useMemo(() => {
    if (!searchQuery) return membres;
    const q = searchQuery.toLowerCase();
    return membres.filter(
      (m) =>
        m.nom.toLowerCase().includes(q) ||
        m.prenom.toLowerCase().includes(q) ||
        m.numeroMembre?.toLowerCase().includes(q)
    );
  }, [membres, searchQuery]);

  const selectedMembre = useMemo(
    () => membres.find((m) => m.id === selectedMembreId) || filteredMembres[0],
    [membres, selectedMembreId, filteredMembres]
  );

  // Submit 1 cotisation (Le Compteur)
  const handleEnregistrerCotisation = async () => {
    if (!selectedMembre || !activeCycle) return;
    setMutationError(null);
    setFeedbackSuccess(null);

    try {
      const res = await createCotisationMutation.mutateAsync({
        membreId: selectedMembre.id!,
        cycleId: activeCycle.id!,
        montant: Number(montantSaisi),
        dateCotisation: new Date().toISOString().split('T')[0],
        modePaiement,
      });

      setFeedbackSuccess(
        `Cotisation de ${montantSaisi} BIF enregistrée pour ${selectedMembre.prenom} ${selectedMembre.nom}. Reçu généré (R8).`
      );

      // Auto-advance to next member for ultra-fast meeting entry
      const currentIndex = filteredMembres.findIndex((m) => m.id === selectedMembre.id);
      if (currentIndex !== -1 && currentIndex + 1 < filteredMembres.length) {
        setSelectedMembreId(filteredMembres[currentIndex + 1].id!);
      }
    } catch (err: unknown) {
      setMutationError(err);
    }
  };

  // Submit batch cotisations
  const handleEnregistrerBatch = async () => {
    if (!activeCycle || batchSelectedMembres.length === 0) return;
    setMutationError(null);
    setFeedbackSuccess(null);

    try {
      const today = new Date().toISOString().split('T')[0];
      const payload = {
        cotisations: batchSelectedMembres.map((mId) => ({
          membreId: mId,
          cycleId: activeCycle.id!,
          montant: standardAmount,
          dateCotisation: today,
          modePaiement: batchModePaiement,
        })),
      };

      await createBatchMutation.mutateAsync(payload);
      setFeedbackSuccess(
        `Lot de ${batchSelectedMembres.length} cotisations enregistré avec succès en transaction atomique.`
      );
      setBatchSelectedMembres([]);
    } catch (err: unknown) {
      setMutationError(err);
    }
  };

  // Update existing cotisation
  const handleUpdateCotisation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCotisation) return;
    setEditError(null);

    try {
      await updateCotisationMutation.mutateAsync({
        id: editingCotisation.id,
        data: {
          montant: Number(editMontant),
          dateCotisation: editingCotisation.dateCotisation,
          modePaiement: editModePaiement,
        },
      });
      setEditingCotisation(null);
    } catch (err: unknown) {
      setEditError(err);
    }
  };

  // Download PDF Receipt
  const handleDownloadPdf = async (recuId: number) => {
    try {
      const blob = await apiClient.getRecuPdf(recuId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-REC-2026-${String(recuId).padStart(6, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Impossible de générer le PDF du reçu.');
    }
  };

  // ==========================================
  // 1. BESPOKE SCREEN: MEMBRE ADHÉRENT (Carnet personnel R8)
  // ==========================================
  if (isMembreOnly) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Member Header */}
        <div className="bg-white rounded-[14px] border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-[6px] bg-amber-100 text-amber-900">
                Mon Carnet Individuel
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-emerald-700 flex items-center font-medium">
                <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {currentMember?.prenom} {currentMember?.nom} ({currentMember?.numeroMembre})
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 font-heading mt-2">
              Mon Carnet de Cotisations
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Consultez vos cotisations enregistrées et téléchargez directement vos reçus officiels scellés (R8).
            </p>
          </div>

          <div className="px-4 py-2 bg-stone-50 rounded-[10px] border border-stone-200 text-right">
            <span className="text-[11px] text-stone-500 font-mono uppercase block">Cycle actif</span>
            <span className="font-heading font-bold text-stone-900 text-sm">{activeCycle?.libelle || 'Cycle 2026'}</span>
          </div>
        </div>

        {/* Member Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#272523] text-white rounded-[14px] p-6 border border-[#3b3835] shadow-sm">
            <span className="text-xs font-mono font-medium text-stone-400 uppercase tracking-wider block">
              Mon épargne cumulée
            </span>
            <p className="text-3xl font-extrabold font-heading text-[#e68a00] tracking-tight mt-2">
              <Montant valeur={totalMemberCotisations} />
            </p>
            <p className="text-xs text-stone-400 mt-1">
              Base de calcul du plafond de prêt R6 (3x)
            </p>
          </div>

          <div className="bg-white rounded-[14px] p-6 border border-stone-200 shadow-xs">
            <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider block">
              Versements effectués
            </span>
            <p className="text-3xl font-bold font-heading text-stone-900 tracking-tight mt-2">
              {memberCotisations.length} versement(s)
            </p>
            <p className="text-xs text-stone-500 mt-1">
              Validés par le Trésorier
            </p>
          </div>

          <div className="bg-white rounded-[14px] p-6 border border-stone-200 shadow-xs">
            <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider block">
              Reçus officiels émis (R8)
            </span>
            <p className="text-3xl font-bold font-heading text-emerald-700 tracking-tight mt-2">
              {memberCotisations.length} reçu(s)
            </p>
            <p className="text-xs text-stone-500 mt-1">
              100% scellés et immuables
            </p>
          </div>
        </div>

        {/* Member Cotisations List */}
        <div className="bg-white rounded-[14px] border border-stone-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-stone-900 font-heading mb-4">
            Historique de mes versements
          </h3>
          {memberCotisations.length === 0 ? (
            <EmptyState
              title="Aucune cotisation trouvée"
              description="Vos versements de cotisations apparaîtront ici dès que le Trésorier aura validé votre paiement lors d'une séance."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-mono uppercase text-[11px]">
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Montant</th>
                    <th className="py-3 px-3">Mode</th>
                    <th className="py-3 px-3">Preuve R8</th>
                    <th className="py-3 px-3 text-right">Reçu Officiel</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {memberCotisations.map((c) => (
                    <tr key={c.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-3 font-mono text-stone-700">{c.dateCotisation}</td>
                      <td className="py-3 px-3 font-heading font-bold text-stone-900 text-sm">
                        <Montant valeur={c.montant} />
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-[6px] bg-stone-100 text-stone-700 font-mono text-[11px]">
                          {c.modePaiement}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center text-emerald-700 font-medium">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Scellé (REC-2026-{String(c.recuId || c.id).padStart(6, '0')})
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleDownloadPdf(c.recuId || c.id)}
                          className="touch-target inline-flex items-center px-3 py-1.5 rounded-[8px] bg-stone-100 hover:bg-stone-200 text-stone-800 font-heading font-semibold text-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Bandeau fixe « Le Compteur » - Total en direct qui grimpe en réunion */}
      <div className="bg-[#272523] text-white rounded-2xl p-5 border border-[#3b3835] shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-[#e68a00] shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-stone-400 block">
              {canCollect ? 'Direction C « Le Compteur » · Total collecté' : 'Commissariat aux Comptes · Audit Cotisations (R8)'}
            </span>
            <div className="text-3xl font-extrabold font-heading text-[#e68a00] tracking-tight mt-0.5">
              <Montant valeur={sessionTotal} />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700 text-xs text-stone-300">
            <span className="text-stone-400">Cycle : </span>
            <span className="font-semibold text-white">{activeCycle?.libelle || 'Cycle 2026'}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-stone-800/80 border border-stone-700 text-xs text-stone-300">
            <span className="text-stone-400">Cotisations : </span>
            <span className="font-semibold text-[#e68a00] font-heading">{cotisations.length} reçus</span>
          </div>
        </div>
      </div>

      {/* 2. Tabs Selector (only for roles with collection authority) */}
      {canCollect ? (
        <div className="flex items-center space-x-2 border-b border-stone-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('compteur')}
            className={`touch-target px-4 py-2 rounded-xl text-sm font-heading font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === 'compteur'
                ? 'bg-[#272523] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#e68a00]" />
            <span>Saisie rapide (« Le Compteur »)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`touch-target px-4 py-2 rounded-xl text-sm font-heading font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === 'batch'
                ? 'bg-[#272523] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Layers className="w-4 h-4 text-[#e68a00]" />
            <span>Saisie par lot (Batch atomique)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('liste')}
            className={`touch-target px-4 py-2 rounded-xl text-sm font-heading font-semibold transition-colors flex items-center space-x-2 ${
              activeTab === 'liste'
                ? 'bg-[#272523] text-white shadow-xs'
                : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
            }`}
          >
            <Receipt className="w-4 h-4 text-[#e68a00]" />
            <span>Historique & Reçus ({cotisations.length})</span>
          </button>
        </div>
      ) : (
        <div className="p-3 bg-stone-100 rounded-[10px] text-xs font-mono text-stone-600 flex items-center justify-between">
          <span>Vue d'Audit & Registre des Reçus R8 · {cotisations.length} enregistrements scellés</span>
          <span className="font-bold text-stone-800">Contrôle Commissariat</span>
        </div>
      )}

      {/* Global feedback / error alert */}
      {feedbackSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{feedbackSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackSuccess(null)}
            className="text-xs text-emerald-700 underline font-medium"
          >
            Fermer
          </button>
        </div>
      )}

      {mutationError && (
        <ErrorState
          error={mutationError}
          onRetry={() => {
            setMutationError(null);
            handleEnregistrerCotisation();
          }}
        />
      )}

      {/* 3. TAB A : LE COMPTEUR — Saisie Ultra Rapide 1 Membre à la fois */}
      {activeTab === 'compteur' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Member selector column */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col h-[520px]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading font-bold text-base text-stone-900">
                Choisir un membre
              </h3>
              <span className="text-xs text-stone-400 font-mono">
                {filteredMembres.length} membres
              </span>
            </div>

            {/* Quick search input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher par nom ou numéro..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#e68a00] focus:outline-hidden"
              />
            </div>

            {/* Scrollable member list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredMembres.map((m) => {
                const isSelected = selectedMembre?.id === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSelectedMembreId(m.id!)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between touch-target ${
                      isSelected
                        ? 'border-[#e68a00] bg-amber-50/60 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-stone-900 font-heading">
                        {m.prenom} {m.nom}
                      </p>
                      <p className="text-xs text-stone-500 font-mono mt-0.5">
                        {m.numeroMembre || 'Sans N°'} · {m.telephone}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#e68a00]"></span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rapid Entry Input Area (The Counter Pad) */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                <div>
                  <span className="text-xs text-stone-500 font-mono">Membre actif en réunion :</span>
                  <h2 className="text-xl font-extrabold text-stone-900 font-heading">
                    {selectedMembre ? `${selectedMembre.prenom} ${selectedMembre.nom}` : 'Aucun membre sélectionné'}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-400 font-mono">N° de membre</span>
                  <p className="text-sm font-bold font-mono text-stone-700">
                    {selectedMembre?.numeroMembre || 'MEM-2026-X'}
                  </p>
                </div>
              </div>

              {/* Amount Selection */}
              <div className="mt-6">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-heading mb-2">
                  Montant à encaisser (BIF)
                </label>

                {/* Fast presets */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setMontantSaisi(standardAmount)}
                    className={`touch-target py-2.5 px-3 rounded-xl border text-sm font-heading font-bold transition-all ${
                      montantSaisi === standardAmount
                        ? 'border-[#e68a00] bg-amber-50 text-stone-900 ring-2 ring-[#e68a00]'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <Montant valeur={standardAmount} />
                    <span className="block text-[10px] text-stone-500 font-normal">Standard cycle</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMontantSaisi(standardAmount * 2)}
                    className={`touch-target py-2.5 px-3 rounded-xl border text-sm font-heading font-bold transition-all ${
                      montantSaisi === standardAmount * 2
                        ? 'border-[#e68a00] bg-amber-50 text-stone-900 ring-2 ring-[#e68a00]'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <Montant valeur={standardAmount * 2} />
                    <span className="block text-[10px] text-stone-500 font-normal">Double cotisation</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMontantSaisi(100000)}
                    className={`touch-target py-2.5 px-3 rounded-xl border text-sm font-heading font-bold transition-all ${
                      montantSaisi === 100000
                        ? 'border-[#e68a00] bg-amber-50 text-stone-900 ring-2 ring-[#e68a00]'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <Montant valeur={100000} />
                    <span className="block text-[10px] text-stone-500 font-normal">100 000 BIF</span>
                  </button>
                </div>

                {/* Free input field */}
                <div className="relative">
                  <input
                    type="number"
                    min="1000"
                    step="5000"
                    value={montantSaisi}
                    onChange={(e) => setMontantSaisi(Number(e.target.value))}
                    className="w-full text-2xl font-tabular font-bold py-3 px-4 rounded-xl border border-stone-300 text-stone-900 focus:ring-2 focus:ring-[#e68a00] focus:outline-hidden"
                  />
                  <span className="absolute right-4 top-4 text-sm font-bold text-stone-400 font-heading">
                    BIF
                  </span>
                </div>
              </div>

              {/* Payment Mode */}
              <div className="mt-6">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-heading mb-2">
                  Mode d'encaissement (OpenAPI Enum)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ESPECES', 'MOBILE_MONEY', 'VIREMENT'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setModePaiement(mode)}
                      className={`touch-target py-2 px-3 rounded-xl border text-xs font-heading font-semibold transition-all ${
                        modePaiement === mode
                          ? 'border-[#272523] bg-[#272523] text-white shadow-xs'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      {mode === 'ESPECES' ? 'Espèces' : mode === 'MOBILE_MONEY' ? 'Mobile Money' : 'Virement'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Validation CTA Button */}
            <div className="mt-8 pt-4 border-t border-stone-100">
              <button
                type="button"
                onClick={handleEnregistrerCotisation}
                disabled={createCotisationMutation.isPending || !selectedMembre}
                className="touch-target w-full flex items-center justify-center py-4 px-6 rounded-xl shadow-md text-base font-bold text-white bg-[#e68a00] hover:bg-[#cc7a00] focus:outline-hidden disabled:opacity-50 transition-colors font-heading"
              >
                {createCotisationMutation.isPending ? (
                  <span>Génération du reçu (R8) & écriture caisse...</span>
                ) : (
                  <>
                    <span>Valider cotisation (<Montant valeur={montantSaisi} />)</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-stone-500 mt-2">
                Règle R5 : Validateur tracé · Règle R8 : Reçu PDF numéroté émis
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. TAB B : SAISIE EN LOT (POST /api/cotisations/batch) */}
      {activeTab === 'batch' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-stone-100">
            <div>
              <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                POST /api/cotisations/batch
              </span>
              <h3 className="text-lg font-bold text-stone-900 font-heading mt-1">
                Saisie par lot atomique
              </h3>
              <p className="text-xs text-stone-600">
                Cochez les membres ayant versé leur cotisation mensuelle de {standardAmount} BIF.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setBatchSelectedMembres(membres.map((m) => m.id!))}
                className="touch-target px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium hover:bg-stone-50"
              >
                Tout cocher
              </button>
              <button
                type="button"
                onClick={() => setBatchSelectedMembres([])}
                className="touch-target px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-medium hover:bg-stone-50"
              >
                Tout décocher
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {membres.map((m) => {
              const checked = batchSelectedMembres.includes(m.id!);
              return (
                <label
                  key={m.id}
                  className={`p-3.5 rounded-xl border flex items-center space-x-3 cursor-pointer transition-all ${
                    checked
                      ? 'border-[#e68a00] bg-amber-50/50 shadow-xs'
                      : 'border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setBatchSelectedMembres([...batchSelectedMembres, m.id!]);
                      } else {
                        setBatchSelectedMembres(batchSelectedMembres.filter((id) => id !== m.id));
                      }
                    }}
                    className="w-4 h-4 rounded text-[#e68a00] focus:ring-[#e68a00]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-stone-900 font-heading">
                      {m.prenom} {m.nom}
                    </p>
                    <p className="text-xs text-stone-500 font-mono">
                      {m.numeroMembre || 'Sans N°'}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Batch CTA */}
          <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs text-stone-500">Total du lot à valider :</span>
              <p className="text-xl font-extrabold font-heading text-[#e68a00]">
                <Montant valeur={batchSelectedMembres.length * standardAmount} /> ({batchSelectedMembres.length} membres)
              </p>
            </div>

            <button
              type="button"
              onClick={handleEnregistrerBatch}
              disabled={createBatchMutation.isPending || batchSelectedMembres.length === 0}
              className="touch-target px-6 py-3 rounded-xl bg-[#272523] hover:bg-stone-800 text-white font-heading font-semibold text-sm shadow-md disabled:opacity-50 transition-colors"
            >
              {createBatchMutation.isPending ? (
                <span>Enregistrement atomique en cours...</span>
              ) : (
                <span>Confirmer l'enregistrement du lot ({batchSelectedMembres.length})</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 5. TAB C : LISTE ET HISTORIQUE (GET, PUT, PDF) */}
      {activeTab === 'liste' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-5 border-b border-stone-200 flex items-center justify-between">
            <h3 className="font-heading font-bold text-base text-stone-900">
              Historique des cotisations (GET /api/cotisations)
            </h3>
            <span className="text-xs text-stone-500 font-mono">
              Protection R8 active sur reçus émis
            </span>
          </div>

          {isLoading && <LoadingSkeleton rows={5} type="table" />}
          {isError && <ErrorState error={error} onRetry={() => refetch()} />}

          {!isLoading && cotisations.length === 0 && (
            <EmptyState
              title="Aucune cotisation enregistrée"
              description="Utilisez le mode « Le Compteur » pour enregistrer la première cotisation de ce cycle."
              actionLabel="Passer au Compteur"
              onAction={() => setActiveTab('compteur')}
            />
          )}

          {!isLoading && cotisations.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-stone-200 text-sm">
                <thead className="bg-stone-50 text-stone-500 font-heading text-xs font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Membre</th>
                    <th className="py-3 px-4 text-left">Mode</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-center">Reçu R8</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-sans">
                  {cotisations.map((cot) => {
                    const membre = membres.find((m) => m.id === cot.membreId);
                    return (
                      <tr key={cot.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs text-stone-700">
                          {cot.dateCotisation}
                        </td>
                        <td className="py-3.5 px-4 font-medium text-stone-900 font-heading">
                          {membre ? `${membre.prenom} ${membre.nom}` : `Membre #${cot.membreId}`}
                        </td>
                        <td className="py-3.5 px-4 text-xs text-stone-600">
                          <span className="px-2 py-0.5 rounded bg-stone-100 font-mono">
                            {cot.modePaiement}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold font-heading text-stone-900">
                          <Montant valeur={cot.montant} />
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {cot.verrouille ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <Lock className="w-3 h-3 mr-1" />
                              Verrouillé
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                              Non verrouillé
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => setInspectCotisationId(cot.id!)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-[6px] text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                          >
                            Consulter
                          </button>

                          {cot.recuId && (
                            <button
                              type="button"
                              onClick={() => handleDownloadPdf(cot.recuId!)}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-[6px] text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                              title="Télécharger le reçu PDF (GET /api/recus/{id}/pdf)"
                            >
                              <Download className="w-3 h-3 mr-1 text-[#e68a00]" />
                              PDF
                            </button>
                          )}

                          {canCollect && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCotisation(cot);
                                setEditMontant(cot.montant || 0);
                                setEditModePaiement((cot.modePaiement as any) || 'ESPECES');
                                setEditError(null);
                              }}
                              className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-[6px] text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                              title="Modifier (PUT /api/cotisations/{id})"
                            >
                              Modifier
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 6. MODIFICATION MODAL (PUT /api/cotisations/{id}) */}
      {editingCotisation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">
                Modifier cotisation #{editingCotisation.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCotisation(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {editingCotisation.verrouille && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start space-x-2">
                <Lock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <span className="font-bold">Avertissement Règle R8 :</span> Cette opération a déjà généré un reçu officiel. La tentative de modification renverra une erreur HTTP 409 explicative du serveur.
                </div>
              </div>
            )}

            {editError && <ErrorState error={editError} />}

            <form onSubmit={handleUpdateCotisation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Nouveau montant (BIF)
                </label>
                <input
                  type="number"
                  value={editMontant}
                  onChange={(e) => setEditMontant(Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-300 font-tabular font-bold text-lg text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Mode de paiement
                </label>
                <select
                  value={editModePaiement}
                  onChange={(e) => setEditModePaiement(e.target.value as any)}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-300 text-sm font-medium"
                >
                  <option value="ESPECES">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="VIREMENT">Virement</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingCotisation(null)}
                  className="touch-target px-4 py-2 rounded-xl border border-stone-200 text-xs font-medium hover:bg-stone-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateCotisationMutation.isPending}
                  className="touch-target px-4 py-2 rounded-xl bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold font-heading shadow-xs"
                >
                  {updateCotisationMutation.isPending ? 'Envoi...' : 'Enregistrer (PUT)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT MODAL (GET /api/cotisations/{id}) */}
      {inspectCotisationId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[14px] max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <span className="text-xs font-mono text-[#e68a00] font-bold">GET /api/cotisations/{inspectCotisationId}</span>
                <h3 className="font-heading font-bold text-lg text-stone-900">
                  Détail cotisation #{inspectCotisationId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectCotisationId(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {loadingInspected && <LoadingSkeleton rows={3} />}

            {inspectedCotisation && (
              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-[10px] border border-stone-200 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Montant versé :</span>
                    <span className="font-bold font-heading text-stone-900 text-sm"><Montant valeur={inspectedCotisation.montant} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Mode de paiement :</span>
                    <span className="font-semibold text-stone-800">{inspectedCotisation.modePaiement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Date cotisation :</span>
                    <span className="font-mono text-stone-800">{inspectedCotisation.dateCotisation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Membre ID :</span>
                    <span className="font-mono text-stone-800">#{inspectedCotisation.membreId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Cycle ID :</span>
                    <span className="font-mono text-stone-800">#{inspectedCotisation.cycleId}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                    <span className="text-stone-500">Statut R8 :</span>
                    <span className="font-mono font-bold text-stone-800">
                      {inspectedCotisation.verrouille ? 'VERROUILLÉ (Reçu émis)' : 'MODIFIABLE'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setInspectCotisationId(null)}
                    className="touch-target px-4 py-2 rounded-[6px] bg-stone-900 text-white text-xs font-heading font-semibold"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CotisationsPage;
