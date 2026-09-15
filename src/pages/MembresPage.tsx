import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Search,
  Phone,
  Calendar,
  Edit2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Ticket,
} from 'lucide-react';
import {
  useMembresQuery,
  useMembreQuery,
  useCreateMembreMutation,
  useUpdateMembreMutation,
  useUtilisateursQuery,
} from '../api/queries';
import { StatusBadge } from '../components/ui-states/StatusBadge';
import { LoadingSkeleton } from '../components/ui-states/LoadingSkeleton';
import { EmptyState } from '../components/ui-states/EmptyState';
import { ErrorState } from '../components/ui-states/ErrorState';
import { InvitationModal } from '../components/invitations/InvitationModal';

export const MembresPage: React.FC = () => {
  const { data: membres = [], isLoading, isError, error, refetch } = useMembresQuery();
  const { data: utilisateurs = [] } = useUtilisateursQuery();

  const createMembreMutation = useCreateMembreMutation();
  const updateMembreMutation = useUpdateMembreMutation();

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingMembre, setEditingMembre] = useState<any | null>(null);
  const [inspectMembreId, setInspectMembreId] = useState<number | null>(null);

  const { data: inspectedMembre, isLoading: loadingInspected } = useMembreQuery(inspectMembreId || 0);

  // Creation form state
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [telephone, setTelephone] = useState('');
  const [numeroMembre, setNumeroMembre] = useState('');
  const [dateAdhesion, setDateAdhesion] = useState(new Date().toISOString().split('T')[0]);
  const [utilisateurId, setUtilisateurId] = useState<string>('');
  const [formError, setFormError] = useState<unknown | null>(null);

  // Edit form state
  const [editNom, setEditNom] = useState('');
  const [editPrenom, setEditPrenom] = useState('');
  const [editTelephone, setEditTelephone] = useState('');
  const [editStatut, setEditStatut] = useState<'ACTIF' | 'SUSPENDU' | 'SORTI'>('ACTIF');

  const filteredMembres = membres.filter((m) => {
    const q = search.toLowerCase();
    return (
      m.nom.toLowerCase().includes(q) ||
      m.prenom.toLowerCase().includes(q) ||
      m.telephone.includes(q) ||
      m.numeroMembre?.toLowerCase().includes(q)
    );
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createMembreMutation.mutateAsync({
        nom,
        prenom,
        telephone,
        numeroMembre: numeroMembre || undefined,
        dateAdhesion,
        utilisateurId: utilisateurId ? Number(utilisateurId) : undefined,
      });
      setShowCreateModal(false);
      setNom('');
      setPrenom('');
      setTelephone('');
      setNumeroMembre('');
    } catch (err) {
      setFormError(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMembre) return;
    setFormError(null);
    try {
      await updateMembreMutation.mutateAsync({
        id: editingMembre.id,
        data: {
          nom: editNom,
          prenom: editPrenom,
          telephone: editTelephone,
          statut: editStatut,
        },
      });
      setEditingMembre(null);
    } catch (err) {
      setFormError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-900">
              Registre des membres
            </span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs text-stone-600 font-medium">GET /api/membres</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-heading mt-2">
            Membres de la tontine
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Gestion du registre officiel des adhérents et association avec les comptes utilisateurs.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowInviteModal(true)}
            className="touch-target inline-flex items-center px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-heading font-semibold text-sm shadow-xs transition-colors"
            title="Générer un lien ou code d'invitation pour un nouveau membre"
          >
            <Ticket className="w-4 h-4 mr-2 text-[#e68a00]" />
            <span>Inviter par Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowCreateModal(true);
              setFormError(null);
            }}
            className="touch-target inline-flex items-center px-4 py-2.5 rounded-xl bg-[#e68a00] hover:bg-[#cc7a00] text-white font-heading font-semibold text-sm shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            <span>Nouveau Membre</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, numéro ou téléphone..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 text-sm focus:ring-2 focus:ring-[#e68a00] focus:outline-hidden"
          />
        </div>
      </div>

      {isLoading && <LoadingSkeleton rows={5} type="table" />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && filteredMembres.length === 0 && (
        <EmptyState
          title="Aucun membre trouvé"
          description="Enregistrez un nouveau membre pour alimenter le registre de la tontine."
          actionLabel="Ajouter un membre"
          onAction={() => setShowCreateModal(true)}
        />
      )}

      {!isLoading && filteredMembres.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-stone-500 font-heading text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-left">N° Membre</th>
                  <th className="py-3.5 px-4 text-left">Nom & Prénom</th>
                  <th className="py-3.5 px-4 text-left">Téléphone</th>
                  <th className="py-3.5 px-4 text-left">Date Adhésion</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filteredMembres.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-stone-700 font-bold">
                      {m.numeroMembre || `MEM-${m.id}`}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900 font-heading">
                      {m.prenom} {m.nom}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 font-mono text-xs">
                      {m.telephone}
                    </td>
                    <td className="py-3.5 px-4 text-stone-600 text-xs font-mono">
                      {m.dateAdhesion}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={m.statut} />
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => setInspectMembreId(m.id!)}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-[6px] text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                      >
                        Consulter
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMembre(m);
                          setEditNom(m.nom);
                          setEditPrenom(m.prenom);
                          setEditTelephone(m.telephone);
                          setEditStatut(m.statut as any);
                          setFormError(null);
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 text-xs font-medium rounded-[6px] text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1 text-[#e68a00]" />
                        Modifier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">
                Nouveau membre (POST /api/membres)
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && <ErrorState error={formError} />}

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={prenom}
                    onChange={(e) => setPrenom(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Téléphone (Burundi)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+257 79 000 000"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                    N° Membre
                  </label>
                  <input
                    type="text"
                    placeholder="MEM-2026-00X"
                    value={numeroMembre}
                    onChange={(e) => setNumeroMembre(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                    Date Adhésion
                  </label>
                  <input
                    type="date"
                    required
                    value={dateAdhesion}
                    onChange={(e) => setDateAdhesion(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Lier à un compte utilisateur (optionnel)
                </label>
                <select
                  value={utilisateurId}
                  onChange={(e) => setUtilisateurId(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm"
                >
                  <option value="">Aucun compte lié</option>
                  {utilisateurs.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.prenom} {u.nom} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="touch-target px-4 py-2 rounded-xl border border-stone-200 text-xs font-medium hover:bg-stone-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={createMembreMutation.isPending}
                  className="touch-target px-5 py-2.5 rounded-xl bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold font-heading shadow-xs"
                >
                  {createMembreMutation.isPending ? 'Enregistrement...' : 'Enregistrer (POST)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL (PUT /api/membres/{id}) */}
      {editingMembre && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">
                Modifier membre #{editingMembre.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingMembre(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && <ErrorState error={formError} />}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                    Prénom
                  </label>
                  <input
                    type="text"
                    required
                    value={editPrenom}
                    onChange={(e) => setEditPrenom(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={editNom}
                    onChange={(e) => setEditNom(e.target.value)}
                    className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Téléphone
                </label>
                <input
                  type="tel"
                  required
                  value={editTelephone}
                  onChange={(e) => setEditTelephone(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Statut du membre
                </label>
                <select
                  value={editStatut}
                  onChange={(e) => setEditStatut(e.target.value as any)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-medium"
                >
                  <option value="ACTIF">ACTIF</option>
                  <option value="SUSPENDU">SUSPENDU</option>
                  <option value="SORTI">SORTI</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingMembre(null)}
                  className="touch-target px-4 py-2 rounded-xl border border-stone-200 text-xs font-medium hover:bg-stone-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateMembreMutation.isPending}
                  className="touch-target px-5 py-2.5 rounded-xl bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold font-heading shadow-xs"
                >
                  {updateMembreMutation.isPending ? 'Mise à jour...' : 'Mettre à jour (PUT)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INSPECT MODAL (GET /api/membres/{id}) */}
      {inspectMembreId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[14px] max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <span className="text-xs font-mono text-[#e68a00] font-bold">GET /api/membres/{inspectMembreId}</span>
                <h3 className="font-heading font-bold text-lg text-stone-900">
                  Dossier membre #{inspectMembreId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectMembreId(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {loadingInspected && <LoadingSkeleton rows={3} />}

            {inspectedMembre && (
              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-[10px] border border-stone-200 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Nom complet :</span>
                    <span className="font-bold text-stone-900">{inspectedMembre.prenom} {inspectedMembre.nom}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Numéro membre :</span>
                    <span className="font-mono font-semibold text-stone-800">{inspectedMembre.numeroMembre || 'Non attribué'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Téléphone :</span>
                    <span className="font-mono text-stone-800">{inspectedMembre.telephone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Date d'adhésion :</span>
                    <span className="font-mono text-stone-800">{inspectedMembre.dateAdhesion}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                    <span className="text-stone-500">Statut :</span>
                    <StatusBadge status={inspectedMembre.statut} />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setInspectMembreId(null)}
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

      {/* Member Invitation Modal */}
      <InvitationModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        defaultRole="MEMBRE"
      />
    </div>
  );
};

export default MembresPage;
