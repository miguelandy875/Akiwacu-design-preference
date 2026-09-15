import React, { useState } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {
  useTransactionsCaisseQuery,
  useSoldeCaisseQuery,
  useCreateTransactionCaisseMutation,
  useUpdateTransactionCaisseMutation,
  useDeleteTransactionCaisseMutation,
  useCyclesQuery,
} from '../api/queries';
import { Montant } from '../components/Montant';
import { LoadingSkeleton } from '../components/ui-states/LoadingSkeleton';
import { EmptyState } from '../components/ui-states/EmptyState';
import { ErrorState } from '../components/ui-states/ErrorState';

export const CaissePage: React.FC = () => {
  const { data: transactions = [], isLoading, isError, error, refetch } = useTransactionsCaisseQuery();
  const { data: soldeData } = useSoldeCaisseQuery();
  const { data: cycles = [] } = useCyclesQuery();

  const createMutation = useCreateTransactionCaisseMutation();
  const updateMutation = useUpdateTransactionCaisseMutation();
  const deleteMutation = useDeleteTransactionCaisseMutation();

  const [selectedCycleId, setSelectedCycleId] = useState<number | 'ALL'>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTx, setEditingTx] = useState<any | null>(null);

  // Form states
  const [sens, setSens] = useState<'ENTREE' | 'SORTIE'>('ENTREE');
  const [montant, setMontant] = useState(25000);
  const [dateTransaction, setDateTransaction] = useState(new Date().toISOString().split('T')[0]);
  const [motif, setMotif] = useState('');
  const [cycleId, setCycleId] = useState<number>(cycles[0]?.id || 1);
  const [formError, setFormError] = useState<unknown | null>(null);

  const filteredTransactions = transactions.filter((tx) => {
    if (selectedCycleId === 'ALL') return true;
    return tx.cycleId === selectedCycleId;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createMutation.mutateAsync({
        sens,
        montant: Number(montant),
        dateTransaction,
        motif,
        cycleId: Number(cycleId),
      });
      setShowCreateModal(false);
      setMotif('');
    } catch (err) {
      setFormError(err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;
    setFormError(null);
    try {
      await updateMutation.mutateAsync({
        id: editingTx.id,
        data: {
          sens,
          montant: Number(montant),
          dateTransaction,
          motif,
          cycleId: Number(cycleId),
        },
      });
      setEditingTx(null);
    } catch (err) {
      setFormError(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Voulez-vous supprimer cette écriture de caisse ?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      alert('Impossible de supprimer la transaction.');
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Solde Hero Card - Direction C */}
      <div className="bg-[#272523] text-white rounded-2xl p-6 border border-[#3b3835] shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-stone-400">
            Grand Livre · GET /api/transactions-caisse/solde
          </span>
          <div className="text-3xl sm:text-4xl font-extrabold font-heading text-[#e68a00] tracking-tight mt-1">
            <Montant valeur={typeof soldeData === 'number' ? soldeData : (soldeData as any)?.solde ?? 0} />
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Solde net recalculé strictement par le serveur (Règles R1 & R5)
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
          <span>Mouvement Manuel</span>
        </button>
      </div>

      {/* 2. Filter Bar */}
      <div className="flex items-center space-x-3 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <Filter className="w-4 h-4 text-stone-400 shrink-0" />
        <span className="text-xs font-heading font-bold text-stone-700 uppercase">Filtrer par cycle :</span>
        <select
          value={selectedCycleId}
          onChange={(e) => setSelectedCycleId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
          className="py-1 px-3 rounded-lg border border-stone-300 text-xs font-medium text-stone-800"
        >
          <option value="ALL">Tous les cycles ({transactions.length} écritures)</option>
          {cycles.map((c) => (
            <option key={c.id} value={c.id}>
              {c.libelle}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <LoadingSkeleton rows={5} type="table" />}
      {isError && <ErrorState error={error} onRetry={() => refetch()} />}

      {!isLoading && filteredTransactions.length === 0 && (
        <EmptyState
          title="Aucun mouvement de caisse"
          description="Les cotisations, déblocages de prêts et remboursements génèrent des écritures dans ce grand livre."
          actionLabel="Ajouter un mouvement"
          onAction={() => setShowCreateModal(true)}
        />
      )}

      {!isLoading && filteredTransactions.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-stone-200 text-sm">
              <thead className="bg-stone-50 text-stone-500 font-heading text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 text-left">Date</th>
                  <th className="py-3.5 px-4 text-left">Type</th>
                  <th className="py-3.5 px-4 text-left">Motif / Justification</th>
                  <th className="py-3.5 px-4 text-right">Montant</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-sans">
                {filteredTransactions.map((tx) => {
                  const isEntree = tx.sens === 'ENTREE';
                  return (
                    <tr key={tx.id} className="hover:bg-stone-50/70 transition-colors">
                      <td className="py-3.5 px-4 font-mono text-xs text-stone-700">
                        {tx.dateTransaction}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold font-heading ${
                            isEntree
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isEntree ? (
                            <ArrowDownLeft className="w-3 h-3 mr-1 text-emerald-600" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3 mr-1 text-rose-600" />
                          )}
                          {tx.sens}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-stone-900">
                        {tx.motif}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold font-heading text-sm ${
                          isEntree ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {isEntree ? '+' : '-'} <Montant valeur={tx.montant} />
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTx(tx);
                            setSens((tx.sens as any) || 'ENTREE');
                            setMontant(tx.montant || 0);
                            setDateTransaction(tx.dateTransaction || '');
                            setMotif(tx.motif || '');
                            setCycleId(tx.cycleId || cycles[0]?.id || 1);
                            setFormError(null);
                          }}
                          className="p-1 text-stone-500 hover:text-[#e68a00]"
                          title="Modifier (PUT /api/transactions-caisse/{id})"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(tx.id!)}
                          className="p-1 text-stone-500 hover:text-rose-600"
                          title="Supprimer (DELETE /api/transactions-caisse/{id})"
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

      {/* CREATE MODAL (POST /api/transactions-caisse) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">
                Nouveau mouvement de caisse
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
                  Type d'opération
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSens('ENTREE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-heading font-bold ${
                      sens === 'ENTREE'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    ENTRÉE (+)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSens('SORTIE')}
                    className={`py-2 px-3 rounded-xl border text-xs font-heading font-bold ${
                      sens === 'SORTIE'
                        ? 'bg-rose-600 text-white border-rose-600'
                        : 'border-stone-200 text-stone-700'
                    }`}
                  >
                    SORTIE (-)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Montant (BIF)
                </label>
                <input
                  type="number"
                  min="1000"
                  step="1000"
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
                  value={dateTransaction}
                  onChange={(e) => setDateTransaction(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Cycle
                </label>
                <select
                  value={cycleId}
                  onChange={(e) => setCycleId(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm"
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.libelle}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Motif / Libellé
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Achat fournitures registre réunion"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm"
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
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
              <h3 className="font-heading font-bold text-lg text-stone-900">
                Modifier écriture #{editingTx.id}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="text-stone-400 hover:text-stone-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {formError && <ErrorState error={formError} />}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Montant (BIF)
                </label>
                <input
                  type="number"
                  required
                  value={montant}
                  onChange={(e) => setMontant(Number(e.target.value))}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm font-tabular font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase font-heading mb-1">
                  Motif
                </label>
                <input
                  type="text"
                  required
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  className="w-full py-2 px-3 rounded-xl border border-stone-300 text-sm"
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="touch-target px-4 py-2 rounded-xl border border-stone-200 text-xs font-medium hover:bg-stone-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updateMutation.isPending}
                  className="touch-target px-5 py-2.5 rounded-xl bg-[#e68a00] hover:bg-[#cc7a00] text-white text-xs font-bold font-heading shadow-xs"
                >
                  {updateMutation.isPending ? 'Enregistrement...' : 'Mettre à jour (PUT)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaissePage;
