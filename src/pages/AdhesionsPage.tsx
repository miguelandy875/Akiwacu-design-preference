import React, { useState } from 'react';
import {
  UserCheck,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  Search,
} from 'lucide-react';
import {
  useAdhesionsQuery,
  useCreateAdhesionMutation,
  useUpdateAdhesionMutation,
  useMembresQuery,
  useCyclesQuery,
} from '../api/queries';
import { StatusBadge } from '../components/ui-states/StatusBadge';
import { LoadingSkeleton } from '../components/ui-states/LoadingSkeleton';
import { EmptyState } from '../components/ui-states/EmptyState';
import { ErrorState } from '../components/ui-states/ErrorState';

export const AdhesionsPage: React.FC = () => {
  const { data: adhesions = [], isLoading, isError, error, refetch } = useAdhesionsQuery();
  const { data: membres = [] } = useMembresQuery();
  const { data: cycles = [] } = useCyclesQuery();

  const createMutation = useCreateAdhesionMutation();
  const updateMutation = useUpdateAdhesionMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdhesion, setEditingAdhesion] = useState<any | null>(null);

  // Form states
  const [selectedMembreId, setSelectedMembreId] = useState<number>(membres[0]?.id || 1);
  const [selectedCycleId, setSelectedCycleId] = useState<number>(cycles[0]?.id || 1);
  const [dateAdhesion, setDateAdhesion] = useState(new Date().toISOString().split('T')[0]);
  const [editStatut, setEditStatut] = useState<'ACTIVE' | 'CLOTUREE'>('ACTIVE');
  const [formError, setFormError] = useState<unknown | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        membreId: Number(selectedMembreId),
        cycleId: Number(selectedCycleId),
        dateAdhesion,
      });
      setShowCreateModal(false);
    } catch (err) {
      setFormError(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdhesion) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({
        id: editingAdhesion.id,
        data: {
          dateAdhesion: editingAdhesion.dateAdhesion || new Date().toISOString().split('T')[0],
          statut: editStatut,
        },
      });
      setEditingAdhesion(null);
    } catch (err) {
      setFormError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900">
              Inscriptions Cycles
            </span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs text-stone-600 font-medium">GET /api/adhesions</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-heading mt-2">
            Adhésions aux cycles
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Enregistrement de la participation des membres aux différents cycles d'épargne.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateModal(true);
            setFormError(null);
          }}
          className="touch-target inline-flex items-center px-4 py-2.5 rounded-xl bg-[#e68a00] hover:bg-[#cc7a00] text-white font-heading font-semibold text-sm shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Nouvelle Adhésion</span>
        </button>
      </div>

      {isLoading && <LoadingSkeleton rows={4} type="table" />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && adhesions.length === 0 && (
        <EmptyState
          title="Aucune adhésion enregistrée"
          description="Inscrivez un membre au cycle actif pour lui permettre de cotiser et de solliciter des prêts."
          actionLabel="Créer une adhésion"
          onAction={() => setShowCreateModal(true)}
        />
      )}

      {!isLoading && adhesions.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-stone-500 font-heading text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-left">ID</th>
                  <th className="py-3.5 px-4 text-left">Membre</th>
                  <th className="py-3.5 px-4 text-left">Cycle</th>
                  <th className="py-3.5 px-4 text-left">Date Adhésion</th>
                  <th className="py-3.5 px-4 text-center">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {adhesions.map((adh) => {
                  const membre = membres.find((m) => m.id === adh.membreId);
                  const cycle = cycles.find((c) => c.id === adh.cycleId);
                  return (
                    <tr key={adh.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-stone-600 font-bold">
                        #{adh.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-stone-900 font-heading">
                        {membre ? `${membre.prenom} ${membre.nom}` : `Membre #${adh.membreId}`}
                      </td>
                      <td className="py-3.5 px-4 text-stone-700">
                        {cycle?.libelle || `Cycle #${adh.cycleId}`}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-stone-600">
                        {adh.dateAdhesion}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <StatusBadge status={adh.statut} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingAdhesion(adh);
                            setEditStatut(adh.statut as any);
                            setFormError(null);
                          }}
                          className="inline-flex items-center px-3 py-1 text-xs font-medium rounded-lg text-stone-700 bg-stone-100 hover:bg-stone-200"
                        >
                          Modifier statut
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
                Inscrire un membre à un cycle
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
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Membre
                </label>
                <select
                  value={selectedMembreId}
                  onChange={(e) => setSelectedMembreId(Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-300 text-sm"
                >
                  {membres.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.prenom} {m.nom} ({m.numeroMembre || 'Sans N°'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Cycle cible
                </label>
                <select
                  value={selectedCycleId}
                  onChange={(e) => setSelectedCycleId(Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-300 text-sm"
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.libelle} ({c.statut})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Date d'adhésion
                </label>
                <input
                  type="date"
                  required
                  value={dateAdhesion}
                  onChange={(e) => setDateAdhesion(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-mono"
                />
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
                  disabled={createMutation.isPending}
                  className="touch-target px-5 py-2.5 rounded-xl bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold font-heading shadow-xs"
                >
                  {createMutation.isPending ? 'Enregistrement...' : 'Enregistrer (POST)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingAdhesion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">
                Modifier adhésion #{editingAdhesion.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingAdhesion(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && <ErrorState error={formError} />}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Statut de l'adhésion
                </label>
                <select
                  value={editStatut}
                  onChange={(e) => setEditStatut(e.target.value as any)}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-300 text-sm font-medium"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="CLOTUREE">CLOTUREE</option>
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAdhesion(null)}
                  className="touch-target px-4 py-2 rounded-xl border border-stone-200 text-xs font-medium hover:bg-stone-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="touch-target px-5 py-2.5 rounded-xl bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold font-heading shadow-xs"
                >
                  {updateMutation.isPending ? 'Envoi...' : 'Mettre à jour (PUT)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdhesionsPage;
