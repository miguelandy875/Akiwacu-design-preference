import React, { useState } from 'react';
import {
  FileCheck2,
  Plus,
  Lock,
  Download,
  Trash2,
  Edit2,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  useRemboursementsQuery,
  useRemboursementQuery,
  usePretsQuery,
  useMembresQuery,
  useCreateRemboursementMutation,
  useUpdateRemboursementMutation,
  useDeleteRemboursementMutation,
} from '../api/queries';
import { Montant } from '../components/Montant';
import { LoadingSkeleton } from '../components/ui-states/LoadingSkeleton';
import { EmptyState } from '../components/ui-states/EmptyState';
import { ErrorState } from '../components/ui-states/ErrorState';
import { apiClient } from '../api/client';

export const RemboursementsPage: React.FC = () => {
  const { data: remboursements = [], isLoading, isError, error, refetch } = useRemboursementsQuery();
  const { data: prets = [] } = usePretsQuery();
  const { data: membres = [] } = useMembresQuery();

  const createMutation = useCreateRemboursementMutation();
  const updateMutation = useUpdateRemboursementMutation();
  const deleteMutation = useDeleteRemboursementMutation();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRemboursement, setEditingRemboursement] = useState<any | null>(null);
  const [inspectRemboursementId, setInspectRemboursementId] = useState<number | null>(null);

  const { data: inspectedRemboursement, isLoading: loadingInspected } = useRemboursementQuery(inspectRemboursementId || 0);

  // Form states
  const [pretId, setPretId] = useState<number>(prets[0]?.id || 1);
  const [montant, setMontant] = useState(50000);
  const [dateRemboursement, setDateRemboursement] = useState(new Date().toISOString().split('T')[0]);
  const [modePaiement, setModePaiement] = useState<'ESPECES' | 'MOBILE_MONEY' | 'VIREMENT'>('ESPECES');
  const [formError, setFormError] = useState<unknown | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        pretId: Number(pretId),
        montant: Number(montant),
        dateRemboursement,
      });
      setShowCreateModal(false);
    } catch (err) {
      setFormError(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRemboursement) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({
        id: editingRemboursement.id,
        data: {
          pretId: editingRemboursement.pretId,
          montant: Number(montant),
          dateRemboursement,
        },
      });
      setEditingRemboursement(null);
    } catch (err) {
      setFormError(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Supprimer ce remboursement ?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert('Impossible de supprimer ce remboursement.');
    }
  };

  const handleDownloadPdf = async (recuId: number) => {
    try {
      const blob = await apiClient.getRecuPdf(recuId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recu-remboursement-REC-2026-${String(recuId).padStart(6, '0')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert('Erreur lors du téléchargement du reçu.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
              Remboursements & Reçus R8
            </span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs text-stone-600 font-medium">GET /api/remboursements</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-heading mt-2">
            Remboursements de prêts
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Enregistrement des versements de capital, génération de reçus officiels et clôture automatique du prêt.
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
          <span>Enregistrer Versement</span>
        </button>
      </div>

      {isLoading && <LoadingSkeleton rows={5} type="table" />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && remboursements.length === 0 && (
        <EmptyState
          title="Aucun remboursement enregistré"
          description="Enregistrez les versements des emprunteurs pour mettre à jour l'échéancier et réinjecter les fonds en caisse."
          actionLabel="Enregistrer un remboursement"
          onAction={() => setShowCreateModal(true)}
        />
      )}

      {!isLoading && remboursements.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-stone-500 font-heading text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-left">Date</th>
                  <th className="py-3.5 px-4 text-left">Prêt & Emprunteur</th>
                  <th className="py-3.5 px-4 text-left">Mode</th>
                  <th className="py-3.5 px-4 text-right">Montant</th>
                  <th className="py-3.5 px-4 text-center">Reçu R8</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {remboursements.map((r) => {
                  const pret = prets.find((p) => p.id === r.pretId);
                  const membre = membres.find((m) => m.id === pret?.membreId);

                  return (
                    <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-stone-700">
                        {r.dateRemboursement}
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-stone-900 font-heading">
                          {membre ? `${membre.prenom} ${membre.nom}` : `Prêt #${r.pretId}`}
                        </p>
                        <span className="text-xs text-stone-500 font-mono">Dossier Prêt #{r.pretId}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-stone-100 font-mono text-xs text-stone-700">
                          {modePaiement}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-heading text-emerald-700 text-sm">
                        <Montant valeur={r.montant} />
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {r.verrouille ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <Lock className="w-3 h-3 mr-1" />
                            Scellé R8
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400">Non scellé</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setInspectRemboursementId(r.id!)}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-[6px] text-stone-700 bg-stone-100 hover:bg-stone-200"
                        >
                          Consulter
                        </button>
                        {r.verrouille && (
                          <button
                            type="button"
                            onClick={() => handleDownloadPdf(r.id!)}
                            className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-[6px] text-stone-700 bg-stone-100 hover:bg-stone-200"
                            title="Télécharger reçu officiel (R8)"
                          >
                            <Download className="w-3 h-3 mr-1 text-[#e68a00]" />
                            PDF
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingRemboursement(r);
                            setMontant(r.montant || 0);
                            setDateRemboursement(r.dateRemboursement || '');
                            setFormError(null);
                          }}
                          className="p-1 text-stone-500 hover:text-[#e68a00]"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id!)}
                          className="p-1 text-stone-500 hover:text-rose-600"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
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
                Enregistrer un remboursement (POST)
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
                  Prêt cible
                </label>
                <select
                  value={pretId}
                  onChange={(e) => setPretId(Number(e.target.value))}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-300 text-sm"
                >
                  {prets.map((p) => {
                    const m = membres.find((mem) => mem.id === p.membreId);
                    return (
                      <option key={p.id} value={p.id}>
                        Prêt #{p.id} - {m ? `${m.prenom} ${m.nom}` : `Membre #${p.membreId}`} ({p.montantAccorde} BIF)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Montant remboursé (BIF)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="5000"
                  required
                  value={montant}
                  onChange={(e) => setMontant(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-tabular font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Date
                </label>
                <input
                  type="date"
                  required
                  value={dateRemboursement}
                  onChange={(e) => setDateRemboursement(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Mode de règlement
                </label>
                <select
                  value={modePaiement}
                  onChange={(e) => setModePaiement(e.target.value as any)}
                  className="w-full py-2.5 px-3 rounded-xl border border-stone-300 text-sm"
                >
                  <option value="ESPECES">Espèces</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                  <option value="VIREMENT">Virement</option>
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
                  disabled={createMutation.isPending}
                  className="touch-target px-5 py-2.5 rounded-xl bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold font-heading shadow-xs"
                >
                  {createMutation.isPending ? 'Enregistrement...' : 'Valider Versement (POST)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingRemboursement && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">
                Modifier remboursement #{editingRemboursement.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingRemboursement(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {editingRemboursement.verrouille && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start space-x-2">
                <Lock className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
                <div>
                  <span className="font-bold">Avertissement R8 :</span> Cette opération a déjà un reçu officiel émis. La mise à jour sera rejetée par le serveur avec une erreur 409.
                </div>
              </div>
            )}

            {formError && <ErrorState error={formError} />}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Nouveau montant
                </label>
                <input
                  type="number"
                  required
                  value={montant}
                  onChange={(e) => setMontant(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-tabular font-bold"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingRemboursement(null)}
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

      {/* INSPECT MODAL (GET /api/remboursements/{id}) */}
      {inspectRemboursementId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-[14px] max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <span className="text-xs font-mono text-[#e68a00] font-bold">GET /api/remboursements/{inspectRemboursementId}</span>
                <h3 className="font-heading font-bold text-lg text-stone-900">
                  Détail remboursement #{inspectRemboursementId}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectRemboursementId(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {loadingInspected && <LoadingSkeleton rows={3} />}

            {inspectedRemboursement && (
              <div className="space-y-4">
                <div className="p-4 bg-stone-50 rounded-[10px] border border-stone-200 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Montant remboursé :</span>
                    <span className="font-bold font-heading text-stone-900 text-sm"><Montant valeur={inspectedRemboursement.montant} /></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Date versement :</span>
                    <span className="font-mono text-stone-800">{inspectedRemboursement.dateRemboursement}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Dossier prêt lié :</span>
                    <span className="font-mono font-bold text-stone-800">Prêt #{inspectedRemboursement.pretId}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                    <span className="text-stone-500">Verrouillage R8 :</span>
                    <span className="font-mono font-bold text-stone-800">
                      {inspectedRemboursement.verrouille ? 'SCELLÉ (Reçu émis)' : 'NON SCELLÉ'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setInspectRemboursementId(null)}
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

export default RemboursementsPage;
