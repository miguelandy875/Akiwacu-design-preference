import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Coins,
  FileSpreadsheet,
  Wallet,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  CreditCard,
  FileCheck2,
  Vote,
  AlertCircle,
  Clock,
  ArrowRight,
  BookOpenCheck,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import {
  useDashboardQuery,
  useMembresQuery,
  useCotisationsQuery,
  useDemandesPretQuery,
  usePretsQuery,
  useCyclesQuery,
} from '../api/queries';
import { Montant } from '../components/Montant';
import { LoadingSkeleton } from '../components/ui-states/LoadingSkeleton';
import { ErrorState } from '../components/ui-states/ErrorState';
import { useAuth } from '../context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { data: dashboard, isLoading, isError, error, refetch } = useDashboardQuery();
  const { data: membres = [] } = useMembresQuery();
  const { data: cotisations = [] } = useCotisationsQuery();
  const { data: demandes = [] } = useDemandesPretQuery();
  const { data: prets = [] } = usePretsQuery();
  const { data: cycles = [] } = useCyclesQuery();

  const isAdminOrGestionnaire = hasRole(['ADMIN', 'GESTIONNAIRE']);
  const isTresorierOnly = hasRole(['TRESORIER']) && !isAdminOrGestionnaire;
  const isCommissaireOnly = hasRole(['COMMISSAIRE']) && !isAdminOrGestionnaire;
  const isMembreOnly = !isAdminOrGestionnaire && !isTresorierOnly && !isCommissaireOnly;

  // Active cycle
  const activeCycle = cycles.find((c) => c.statut === 'OUVERT') || cycles[0];

  // Resolve current member profile for logged-in user
  const currentMember = React.useMemo(() => {
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

  // Personal metrics for MEMBRE
  const myCotisations = React.useMemo(() => {
    if (!currentMember) return [];
    return cotisations.filter((c) => c.membreId === currentMember.id);
  }, [cotisations, currentMember]);

  const totalMyCotisations = React.useMemo(() => {
    return myCotisations.reduce((sum, c) => sum + (c.montant || 0), 0);
  }, [myCotisations]);

  const myPrets = React.useMemo(() => {
    if (!currentMember) return [];
    return prets.filter((p) => p.membreId === currentMember.id);
  }, [prets, currentMember]);

  const myActivePret = myPrets.find((p) => p.statut === 'ACTIF');

  const myDemandes = React.useMemo(() => {
    if (!currentMember) return [];
    return demandes.filter((d) => d.membreId === currentMember.id);
  }, [demandes, currentMember]);

  // Commissaire metrics
  const pendingDemandesForVote = React.useMemo(() => {
    return demandes.filter((d) => d.statut === 'SOUMISE');
  }, [demandes]);

  // Trésorier metrics
  const approvedLoansToDisburse = React.useMemo(() => {
    return demandes.filter((d) => d.statut === 'APPROUVEE');
  }, [demandes]);

  if (isLoading) {
    return <LoadingSkeleton rows={5} type="cards" />;
  }

  if (isError) {
    return <ErrorState error={error} onRetry={() => refetch()} title="Erreur de chargement du tableau de bord" />;
  }

  // ==========================================
  // 1. BESPOKE SCREEN: MEMBRE ADHÉRENT
  // ==========================================
  if (isMembreOnly) {
    const borrowingCapacity = totalMyCotisations * 3; // Règle R6: Plafond 3x l'épargne
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Adhérent */}
        <div className="bg-white rounded-[14px] border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-[6px] bg-amber-100 text-amber-900">
                Espace Adhérent
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-emerald-700 flex items-center font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {currentMember?.numeroMembre || 'MEM-2026-001'} · Actif
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 font-heading mt-2">
              Bonjour, {user?.prenom || 'Membre'} !
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Bienvenue dans votre espace tontine personnel. Consultez votre épargne, vos remboursements et vos reçus scellés (R8).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/prets"
              className="touch-target inline-flex items-center px-4 py-2.5 rounded-[10px] bg-[#e68a00] hover:bg-[#cc7a00] text-white font-heading font-semibold text-sm shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              <span>Demander un prêt</span>
            </NavLink>
          </div>
        </div>

        {/* 3 Metric Cards for Member */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Mon Épargne */}
          <div className="bg-[#272523] text-white rounded-[14px] p-6 border border-[#3b3835] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-400 uppercase tracking-wider">
                Mon épargne cumulée (R6)
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-stone-800 flex items-center justify-center text-[#e68a00]">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-3xl font-extrabold font-heading text-[#e68a00] tracking-tight">
                <Montant valeur={totalMyCotisations} />
              </p>
              <p className="text-xs text-stone-400 mt-1">
                {myCotisations.length} versement(s) scellé(s) par reçu officiel
              </p>
            </div>
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Capacité emprunt (3x) :</span>
              <span className="font-heading font-bold text-amber-300">
                <Montant valeur={borrowingCapacity} />
              </span>
            </div>
          </div>

          {/* Mon Prêt en cours */}
          <div className="bg-white rounded-[14px] p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                Mon prêt en cours
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-purple-50 flex items-center justify-center text-purple-700">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              {myActivePret ? (
                <div>
                  <p className="text-2xl font-bold font-heading text-stone-900 tracking-tight">
                    <Montant valeur={myActivePret.montantPrete} />
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Échéance : <span className="font-mono font-bold text-stone-800">{myActivePret.dateEcheance}</span> (R7)
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-bold font-heading text-stone-700">
                    Aucun prêt actif
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Vous pouvez solliciter jusqu'à {borrowingCapacity.toLocaleString('fr-FR')} BIF
                  </p>
                </div>
              )}
            </div>
            <NavLink
              to="/prets"
              className="text-xs text-stone-700 hover:text-purple-700 flex items-center font-heading font-semibold pt-3 border-t border-stone-100"
            >
              <span>{myActivePret ? "Consulter mon échéancier" : "Faire une demande"}</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>

          {/* Mes Reçus R8 */}
          <div className="bg-white rounded-[14px] p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                Mes reçus officiels (R8)
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-emerald-50 flex items-center justify-center text-emerald-700">
                <BookOpenCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-2xl font-bold font-heading text-stone-900 tracking-tight">
                {myCotisations.length} reçu(s) émis
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Conformes et téléchargeables en PDF certifié
              </p>
            </div>
            <NavLink
              to="/recus"
              className="text-xs text-stone-700 hover:text-emerald-700 flex items-center font-heading font-semibold pt-3 border-t border-stone-100"
            >
              <span>Télécharger mes reçus</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>
        </div>

        {/* Member Action Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-[14px] border border-stone-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-stone-900 font-heading mb-3 flex items-center">
              <Coins className="w-4 h-4 mr-2 text-[#e68a00]" />
              <span>Derniers versements de cotisation</span>
            </h3>
            {myCotisations.length === 0 ? (
              <p className="text-xs text-stone-500 italic py-4">Aucune cotisation enregistrée pour ce cycle.</p>
            ) : (
              <div className="space-y-2">
                {myCotisations.slice(0, 3).map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-[10px] bg-stone-50 border border-stone-200 text-xs">
                    <div>
                      <span className="font-heading font-bold text-stone-900"><Montant valeur={c.montant} /></span>
                      <span className="text-stone-400 mx-2">·</span>
                      <span className="text-stone-600 font-mono">{c.dateCotisation}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-[6px] bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold">
                      Reçu certifié
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-stone-100 text-right">
              <NavLink to="/cotisations" className="text-xs text-[#e68a00] font-heading font-bold inline-flex items-center">
                <span>Voir tout mon carnet</span>
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </NavLink>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50/50 to-stone-50 rounded-[14px] border border-amber-200/60 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-900">
                Informations du Cycle 2026
              </span>
              <h3 className="text-lg font-bold text-stone-900 font-heading mt-1">
                Cotisation mensuelle obligatoire
              </h3>
              <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                Le montant standard de la cotisation est de <span className="font-bold text-stone-900">50 000 BIF</span> par mois. 
                Les versements doivent être effectués auprès du Trésorier <span className="font-semibold text-stone-800">Klein Ndayizeye</span> (en espèces ou par Mobile Money).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-200/60 flex items-center justify-between text-xs text-amber-900">
              <span className="font-mono">Cycle actif : 01/01/2026 → 31/12/2026</span>
              <span className="font-bold">Tontine Dushirehamwe</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 2. BESPOKE SCREEN: COMMISSAIRE AUX COMPTES
  // ==========================================
  if (isCommissaireOnly) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Commissariat */}
        <div className="bg-white rounded-[14px] border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-[6px] bg-purple-100 text-purple-900">
                Commissariat aux Comptes
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-emerald-700 flex items-center font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Garant de la Règle R4 (Quorum 2 Commissaires)
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 font-heading mt-2">
              Console d'Audit & Scrutin
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Contrôlez les demandes de prêt, exprimez votre vote délibératif et vérifiez l'intégrité comptable de la tontine.
            </p>
          </div>

          <NavLink
            to="/prets"
            className="touch-target inline-flex items-center px-4 py-2.5 rounded-[10px] bg-[#e68a00] hover:bg-[#cc7a00] text-white font-heading font-semibold text-sm shadow-xs transition-colors"
          >
            <Vote className="w-4 h-4 mr-2" />
            <span>Accéder aux votes R4</span>
          </NavLink>
        </div>

        {/* Pending Votes Urgent Alert Box */}
        {pendingDemandesForVote.length > 0 ? (
          <div className="bg-amber-50 border border-amber-300 rounded-[14px] p-5 flex items-start justify-between gap-4 shadow-xs">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-[8px] bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-heading font-bold text-amber-950 text-sm">
                  {pendingDemandesForVote.length} dossier(s) de prêt en attente de votre délibération (R4)
                </h3>
                <p className="text-xs text-amber-800 mt-1">
                  Deux votes "POUR" de commissaires distincts sont strictement requis pour valider chaque dossier avant tout déblocage.
                </p>
              </div>
            </div>
            <NavLink
              to="/prets"
              className="touch-target px-3 py-1.5 rounded-[8px] bg-amber-900 hover:bg-amber-950 text-white text-xs font-heading font-bold shrink-0 self-center"
            >
              Voter maintenant
            </NavLink>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-[14px] p-4 flex items-center space-x-3 text-xs text-emerald-900">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Tous les dossiers soumis ont été délibérés. Quorum à jour pour la tontine.</span>
          </div>
        )}

        {/* Commissaire KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-[14px] p-5 border border-stone-200 shadow-xs">
            <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider block">
              Dossiers à instruire
            </span>
            <p className="text-2xl font-extrabold font-heading text-stone-900 mt-2">
              {pendingDemandesForVote.length}
            </p>
            <span className="text-[11px] text-stone-500 mt-1 block">Statut SOUMISE (R4)</span>
          </div>

          <div className="bg-white rounded-[14px] p-5 border border-stone-200 shadow-xs">
            <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider block">
              Encours prêts actifs
            </span>
            <p className="text-2xl font-extrabold font-heading text-stone-900 mt-2">
              <Montant valeur={dashboard?.pretsEnCours || 0} />
            </p>
            <span className="text-[11px] text-stone-500 mt-1 block">Sous surveillance R7</span>
          </div>

          <div className="bg-white rounded-[14px] p-5 border border-stone-200 shadow-xs">
            <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider block">
              Cotisations collectées
            </span>
            <p className="text-2xl font-extrabold font-heading text-stone-900 mt-2">
              <Montant valeur={dashboard?.cotisationsTotal || 0} />
            </p>
            <span className="text-[11px] text-stone-500 mt-1 block">100% avec reçu officiel</span>
          </div>

          <div className="bg-white rounded-[14px] p-5 border border-stone-200 shadow-xs">
            <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider block">
              Solde vérifié caisse
            </span>
            <p className="text-2xl font-extrabold font-heading text-[#e68a00] mt-2">
              <Montant valeur={dashboard?.soldeCaisse || 0} />
            </p>
            <span className="text-[11px] text-stone-500 mt-1 block">Conforme grand livre</span>
          </div>
        </div>

        {/* Commissaire Audit Guidelines */}
        <div className="bg-white rounded-[14px] border border-stone-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#e68a00]" />
            <h3 className="text-base font-bold text-stone-900 font-heading">
              Matrice de conformité du Commissariat aux Comptes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-4 bg-stone-50 rounded-[10px] border border-stone-200 space-y-1">
              <span className="font-heading font-bold text-stone-900">R4 — Règle du Double Vote</span>
              <p className="text-stone-600">
                Vous et votre co-commissaire devez voter de façon indépendante. Le système bloque toute approbation sans 2 votes POUR.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-[10px] border border-stone-200 space-y-1">
              <span className="font-heading font-bold text-stone-900">R6 — Plafond d'Endettement</span>
              <p className="text-stone-600">
                Vérifiez que le montant sollicité ne dépasse pas 3 fois l'épargne cumulée du demandeur.
              </p>
            </div>

            <div className="p-4 bg-stone-50 rounded-[10px] border border-stone-200 space-y-1">
              <span className="font-heading font-bold text-stone-900">R7 — Échéance de Fin de Cycle</span>
              <p className="text-stone-600">
                La date de remboursement finale doit strictement précéder la clôture du cycle d'épargne en cours.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. BESPOKE SCREEN: TRÉSORIER
  // ==========================================
  if (isTresorierOnly) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        {/* Header Trésorier */}
        <div className="bg-white rounded-[14px] border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-[6px] bg-emerald-100 text-emerald-900">
                Cockpit Trésorerie & Caisse
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-stone-600 font-mono">Validateur officiel R5</span>
            </div>
            <h1 className="text-2xl font-extrabold text-stone-900 font-heading mt-2">
              Gestion financière & Encaissements
            </h1>
            <p className="text-sm text-stone-600 mt-1">
              Opérez les saisies au Compteur, débloquez les prêts approuvés et maintenez l'équilibre de la caisse.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <NavLink
              to="/cotisations"
              className="touch-target inline-flex items-center px-4 py-2.5 rounded-[10px] bg-[#e68a00] hover:bg-[#cc7a00] text-white font-heading font-semibold text-sm shadow-xs transition-colors"
            >
              <Coins className="w-4 h-4 mr-2" />
              <span>Ouvrir Le Compteur</span>
            </NavLink>
          </div>
        </div>

        {/* Hero Caisse Card + Quick KPI */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Solde réel */}
          <div className="bg-[#272523] text-white rounded-[14px] p-6 border border-[#3b3835] shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-400 uppercase tracking-wider">
                Solde réel en caisse
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-stone-800 flex items-center justify-center text-[#e68a00]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-3xl font-extrabold font-heading text-[#e68a00] tracking-tight">
                <Montant valeur={dashboard?.soldeCaisse || 0} />
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Disponible pour les déblocages et opérations
              </p>
            </div>
            <NavLink
              to="/caisse"
              className="text-xs text-stone-300 hover:text-white flex items-center font-heading font-semibold pt-3 border-t border-stone-800"
            >
              <span>Accéder au grand livre de caisse</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1 text-[#e68a00]" />
            </NavLink>
          </div>

          {/* Prêts prêts pour déblocage */}
          <div className="bg-white rounded-[14px] p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                Prêts approuvés à débloquer
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-purple-50 flex items-center justify-center text-purple-700">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-3xl font-bold font-heading text-stone-900 tracking-tight">
                {approvedLoansToDisburse.length} dossier(s)
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Quorum R4 validé · En attente de déboursement
              </p>
            </div>
            <NavLink
              to="/prets"
              className="text-xs text-purple-700 hover:text-purple-900 flex items-center font-heading font-semibold pt-3 border-t border-stone-100"
            >
              <span>Débloquer les fonds en espèces</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>

          {/* Cotisations de séance */}
          <div className="bg-white rounded-[14px] p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                Cotisations collectées
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-amber-50 flex items-center justify-center text-[#e68a00]">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-2xl font-bold font-heading text-stone-900 tracking-tight">
                <Montant valeur={dashboard?.cotisationsTotal || 0} />
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Total encaissé sur le cycle actif
              </p>
            </div>
            <NavLink
              to="/cotisations"
              className="text-xs text-stone-700 hover:text-[#e68a00] flex items-center font-heading font-semibold pt-3 border-t border-stone-100"
            >
              <span>Saisir une cotisation</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>
        </div>

        {/* Trésorier Fast Operations */}
        <div className="bg-white rounded-[14px] border border-stone-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-stone-900 font-heading mb-4">
            Opérations rapides de caisse
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <NavLink
              to="/cotisations"
              className="p-4 rounded-[10px] bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors flex items-center space-x-3"
            >
              <div className="w-9 h-9 rounded-[8px] bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading font-bold text-stone-900 text-sm block">Le Compteur</span>
                <span className="text-xs text-stone-500">Saisie unitaire rapide</span>
              </div>
            </NavLink>

            <NavLink
              to="/caisse"
              className="p-4 rounded-[10px] bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors flex items-center space-x-3"
            >
              <div className="w-9 h-9 rounded-[8px] bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading font-bold text-stone-900 text-sm block">Dépôt Caisse</span>
                <span className="text-xs text-stone-500">Alimentation des fonds</span>
              </div>
            </NavLink>

            <NavLink
              to="/caisse"
              className="p-4 rounded-[10px] bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors flex items-center space-x-3"
            >
              <div className="w-9 h-9 rounded-[8px] bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading font-bold text-stone-900 text-sm block">Retrait Caisse</span>
                <span className="text-xs text-stone-500">Dépenses de séance</span>
              </div>
            </NavLink>

            <NavLink
              to="/caisse"
              className="p-4 rounded-[10px] bg-stone-50 hover:bg-stone-100 border border-stone-200 transition-colors flex items-center space-x-3"
            >
              <div className="w-9 h-9 rounded-[8px] bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <span className="font-heading font-bold text-stone-900 text-sm block">Clôture Mensuelle</span>
                <span className="text-xs text-stone-500">Arrêté des comptes</span>
              </div>
            </NavLink>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. BESPOKE SCREEN: ADMIN / GESTIONNAIRE
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Welcome message */}
      <div className="bg-white rounded-[14px] border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-[6px] bg-amber-100 text-amber-900">
              Supervision & Gouvernance
            </span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs text-emerald-700 flex items-center font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Tenant isolé (R1) · Vue 360°
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-heading mt-2">
            Tableau de Bord Exécutif
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Supervision générale de la tontine Dushirehamwe. Données agrégées calculées par le serveur.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NavLink
            to="/cotisations"
            className="touch-target inline-flex items-center px-4 py-2.5 rounded-[10px] bg-[#e68a00] hover:bg-[#cc7a00] text-white font-heading font-semibold text-sm shadow-xs transition-colors"
          >
            <Coins className="w-4 h-4 mr-2" />
            <span>Saisie Cotisations</span>
          </NavLink>
        </div>
      </div>

      {/* 2. Aggregates Grid */}
      {dashboard && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Solde Caisse */}
          <div className="bg-[#272523] text-white rounded-[14px] p-6 border border-[#3b3835] shadow-sm lg:col-span-1 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-400 uppercase tracking-wider">
                Solde réel en caisse
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-stone-800 flex items-center justify-center text-[#e68a00]">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-3xl font-extrabold font-heading text-[#e68a00] tracking-tight">
                <Montant valeur={dashboard.soldeCaisse} />
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Entrées - Sorties validées par le Trésorier (R5)
              </p>
            </div>
            <NavLink
              to="/caisse"
              className="text-xs text-stone-300 hover:text-white flex items-center font-heading font-semibold pt-3 border-t border-stone-800"
            >
              <span>Détail du grand livre</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1 text-[#e68a00]" />
            </NavLink>
          </div>

          {/* Card 2: Cotisations Totales */}
          <div className="bg-white rounded-[14px] p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                Cotisations collectées
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-amber-50 flex items-center justify-center text-[#e68a00]">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-2xl font-bold font-heading text-stone-900 tracking-tight">
                <Montant valeur={dashboard.cotisationsTotal} />
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Toutes cotisations avec reçus émis (R8)
              </p>
            </div>
            <NavLink
              to="/cotisations"
              className="text-xs text-stone-700 hover:text-[#e68a00] flex items-center font-heading font-semibold pt-3 border-t border-stone-100"
            >
              <span>Accéder au Compteur</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>

          {/* Card 3: Prêts en cours */}
          <div className="bg-white rounded-[14px] p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                Prêts débloqués actifs
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-purple-50 flex items-center justify-center text-purple-700">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-2xl font-bold font-heading text-stone-900 tracking-tight">
                <Montant valeur={dashboard.pretsEnCours} />
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Plafond 3x épargne (R6) · Échéance cycle (R7)
              </p>
            </div>
            <NavLink
              to="/prets"
              className="text-xs text-stone-700 hover:text-purple-700 flex items-center font-heading font-semibold pt-3 border-t border-stone-100"
            >
              <span>Suivi des prêts & votes</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>

          {/* Card 4: Remboursements Totaux */}
          <div className="bg-white rounded-[14px] p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                Remboursements perçus
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-emerald-50 flex items-center justify-center text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-2xl font-bold font-heading text-stone-900 tracking-tight">
                <Montant valeur={dashboard.remboursementsTotal} />
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Capital remboursé au fonds commun
              </p>
            </div>
            <NavLink
              to="/remboursements"
              className="text-xs text-stone-700 hover:text-emerald-700 flex items-center font-heading font-semibold pt-3 border-t border-stone-100"
            >
              <span>Consulter les remboursements</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>

          {/* Card 5: Membres Actifs */}
          <div className="bg-white rounded-[14px] p-6 border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-stone-500 uppercase tracking-wider">
                Membres actifs
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-blue-50 flex items-center justify-center text-blue-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-2xl font-bold font-heading text-stone-900 tracking-tight">
                {dashboard.membresActifs || 0} membres
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Inscrits dans la tontine courante
              </p>
            </div>
            <NavLink
              to="/membres"
              className="text-xs text-stone-700 hover:text-blue-700 flex items-center font-heading font-semibold pt-3 border-t border-stone-100"
            >
              <span>Registre des membres</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>

          {/* Card 6: Cycle Actuel Information */}
          <div className="bg-gradient-to-br from-stone-50 to-amber-50/40 rounded-[14px] p-6 border border-amber-200/60 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-amber-900 uppercase tracking-wider">
                Cycle actif (R2)
              </span>
              <div className="w-8 h-8 rounded-[8px] bg-amber-100 flex items-center justify-center text-amber-800">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="my-4">
              <p className="text-lg font-bold font-heading text-stone-900 tracking-tight">
                {activeCycle?.libelle || 'Cycle Annuel 2026'}
              </p>
              <p className="text-xs text-stone-600 mt-1">
                Du {activeCycle?.dateDebut || '01/01/2026'} au {activeCycle?.dateFin || '31/12/2026'} · 50 000 BIF
              </p>
            </div>
            <NavLink
              to="/cycles"
              className="text-xs text-amber-800 hover:text-amber-900 flex items-center font-heading font-semibold pt-3 border-t border-amber-200/50"
            >
              <span>Machine à états du cycle</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </NavLink>
          </div>
        </div>
      )}

      {/* 3. Business Rules Status Section (R1 to R8) */}
      <div className="bg-white rounded-[14px] border border-stone-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-[#e68a00]" />
            <h3 className="text-base font-bold text-stone-900 font-heading">
              Gouvernance et intégrité métier (Matrice R1 → R8)
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-mono">100% contrôlé côté serveur</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-stone-50 rounded-[10px] border border-stone-200">
            <span className="font-bold text-stone-900 font-mono">R1 — Isolation Tenant</span>
            <p className="text-stone-600 mt-1">tontineId extrait du JWT. Aucune fuite inter-tontines.</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-[10px] border border-stone-200">
            <span className="font-bold text-stone-900 font-mono">R2 & R3 — Garde de Cycle</span>
            <p className="text-stone-600 mt-1">Opérations financières et déblocage de prêt sur cycle OUVERT.</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-[10px] border border-stone-200">
            <span className="font-bold text-stone-900 font-mono">R4 — Quorum 2 Commissaires</span>
            <p className="text-stone-600 mt-1">Deux votes POUR de commissaires distincts requis pour approbation.</p>
          </div>

          <div className="p-3 bg-stone-50 rounded-[10px] border border-stone-200">
            <span className="font-bold text-stone-900 font-mono">R5 & R8 — Reçu & Verrou</span>
            <p className="text-stone-600 mt-1">Trésorier validateur tracé. Opération avec reçu non modifiable (409).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
