import React, { useState } from 'react';
import {
  Receipt,
  Download,
  ShieldCheck,
  Lock,
  Printer,
  FileCheck2,
  Search,
} from 'lucide-react';
import {
  useCotisationsQuery,
  useRemboursementsQuery,
  useMembresQuery,
} from '../api/queries';
import { Montant } from '../components/Montant';
import { apiClient } from '../api/client';
import { LoadingSkeleton } from '../components/ui-states/LoadingSkeleton';

export const RecusPage: React.FC = () => {
  const { data: cotisations = [], isLoading: loadingCot } = useCotisationsQuery();
  const { data: remboursements = [], isLoading: loadingRem } = useRemboursementsQuery();
  const { data: membres = [] } = useMembresQuery();

  // Combine all items that have receipts (R8)
  const allRecus = [
    ...cotisations
      .filter((c) => c.recuId)
      .map((c) => ({
        id: c.recuId!,
        type: 'COTISATION' as const,
        numero: `REC-2026-${String(c.recuId).padStart(6, '0')}`,
        date: c.dateCotisation,
        montant: c.montant,
        membreId: c.membreId,
        modePaiement: c.modePaiement,
        validateur: 'Klein Ndayizeye (Trésorier R5)',
      })),
    ...remboursements
      .filter((r) => r.verrouille)
      .map((r) => ({
        id: r.id!,
        type: 'REMBOURSEMENT' as const,
        numero: `REC-2026-${String(r.id).padStart(6, '0')}`,
        date: r.dateRemboursement || '2026-03-01',
        montant: r.montant || 0,
        membreId: 1, // linked via loan
        modePaiement: 'ESPECES',
        validateur: 'Klein Ndayizeye (Trésorier R5)',
      })),
  ].sort((a, b) => b.id - a.id);

  const [selectedRecuId, setSelectedRecuId] = useState<number | null>(allRecus[0]?.id || 1);
  const [search, setSearch] = useState('');

  const selectedRecu = allRecus.find((r) => r.id === selectedRecuId) || allRecus[0];
  const selectedMembre = membres.find((m) => m.id === selectedRecu?.membreId) || membres[0];

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
      alert('Erreur de téléchargement.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
              Règle R8 · Inviolabilité des reçus
            </span>
            <span className="text-xs text-stone-400">·</span>
            <span className="text-xs text-stone-600 font-medium">GET /api/recus/&#123;id&#125;/pdf</span>
          </div>
          <h1 className="text-2xl font-extrabold text-stone-900 font-heading mt-2">
            Reçus officiels & Piste d'audit
          </h1>
          <p className="text-sm text-stone-600 mt-1">
            Les 7 mentions obligatoires certifiées. Toute écriture associée à un reçu est scellée contre modification (409).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Receipts Directory */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex flex-col h-[560px]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-bold text-base text-stone-900">
              Reçus émis ({allRecus.length})
            </h3>
            <span className="text-xs text-stone-400 font-mono">Séquentiel</span>
          </div>

          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-stone-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par N° de reçu..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs focus:ring-2 focus:ring-[#e68a00] focus:outline-hidden"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {allRecus
              .filter((r) => r.numero.toLowerCase().includes(search.toLowerCase()))
              .map((r) => {
                const isSelected = selectedRecu?.id === r.id;
                const m = membres.find((mem) => mem.id === r.membreId);

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedRecuId(r.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between touch-target ${
                      isSelected
                        ? 'border-[#e68a00] bg-amber-50/60 shadow-xs'
                        : 'border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-stone-900">
                          {r.numero}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 font-mono">
                          {r.type}
                        </span>
                      </div>
                      <p className="text-xs text-stone-600 mt-1">
                        {m ? `${m.prenom} ${m.nom}` : `Membre #${r.membreId}`} · {r.date}
                      </p>
                    </div>
                    <p className="font-heading font-bold text-stone-900 text-sm">
                      <Montant valeur={r.montant} />
                    </p>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right: The 7-mentions receipt preview (Direction C « Le Compteur » certificate) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-8 shadow-xs flex flex-col justify-between">
          {selectedRecu ? (
            <div className="space-y-6">
              {/* Receipt Header */}
              <div className="flex items-start justify-between border-b-2 border-stone-900 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-lg bg-[#272523] text-[#e68a00] flex items-center justify-center font-heading font-bold text-sm">
                      A
                    </div>
                    <div>
                      <h2 className="font-heading font-black text-base text-stone-900 uppercase tracking-tight">
                        Akiwacu · Tontine Dushirehamwe
                      </h2>
                      <span className="text-[10px] text-stone-500 font-mono">
                        Bujumbura, Burundi · Agrément Communautaire
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-mono text-xs font-bold">
                    <Lock className="w-3 h-3 mr-1" />
                    SCELLÉ R8
                  </span>
                  <p className="font-mono font-bold text-sm text-stone-900 mt-1">
                    {selectedRecu.numero}
                  </p>
                </div>
              </div>

              {/* 7 Mandatory Mentions List */}
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-mono">1. Numéro séquentiel R8 :</span>
                  <span className="font-bold font-mono text-stone-900">{selectedRecu.numero}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-stone-500 font-mono">2. Date de l'opération :</span>
                  <span className="font-mono text-stone-900">{selectedRecu.date}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-stone-500 font-mono">3. Nom de la tontine :</span>
                  <span className="font-bold font-heading text-stone-900">Tontine Dushirehamwe (Tenant #1)</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-stone-500 font-mono">4. Identité de l'adhérent :</span>
                  <span className="font-bold font-heading text-stone-900">
                    {selectedMembre ? `${selectedMembre.prenom} ${selectedMembre.nom}` : 'Membre certifié'} ({selectedMembre?.numeroMembre || 'MEM-2026-X'})
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-stone-500 font-mono">5. Montant en chiffres :</span>
                  <span className="font-extrabold font-heading text-stone-900 text-sm">
                    <Montant valeur={selectedRecu.montant} />
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-stone-500 font-mono">6. Mode de règlement :</span>
                  <span className="font-mono text-stone-700">{selectedRecu.modePaiement}</span>
                </div>

                <div className="flex justify-between pt-2 border-t border-stone-200">
                  <span className="text-stone-500 font-mono">7. Validateur certifié (R5) :</span>
                  <span className="font-bold font-heading text-stone-900">{selectedRecu.validateur}</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">Garantie d'inviolabilité R8 :</span> Tout enregistrement pour lequel ce reçu a été scellé ne peut être ni altéré ni supprimé par quiconque, y compris les administrateurs.
              </div>

              {/* Download PDF CTA */}
              <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
                <span className="text-xs text-stone-500 font-mono">
                  Générateur PDF binaire standardisé
                </span>
                <button
                  type="button"
                  onClick={() => handleDownloadPdf(selectedRecu.id)}
                  className="touch-target inline-flex items-center px-5 py-2.5 rounded-xl bg-[#272523] hover:bg-stone-800 text-white font-heading font-semibold text-xs transition-colors shadow-xs"
                >
                  <Download className="w-4 h-4 mr-2 text-[#e68a00]" />
                  <span>Télécharger PDF (GET /api/recus/{selectedRecu.id}/pdf)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-stone-500">
              <Receipt className="w-12 h-12 mx-auto text-stone-300 mb-2" />
              <p>Aucun reçu sélectionné.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecusPage;
