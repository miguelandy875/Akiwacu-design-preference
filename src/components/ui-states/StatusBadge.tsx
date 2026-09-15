import React from 'react';

interface StatusBadgeProps {
  status: string | undefined;
  type?: 'general' | 'cycle' | 'pret' | 'vote' | 'membre' | 'adhesion';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'general' }) => {
  if (!status) return null;

  let colorClasses = 'bg-stone-100 text-stone-700 border-stone-200';
  let label = status;

  switch (status) {
    case 'OUVERT':
    case 'ACTIVE':
    case 'ACTIF':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      label = status === 'OUVERT' ? 'Ouvert' : status === 'ACTIVE' ? 'Active' : 'Actif';
      break;
    case 'GELE':
      colorClasses = 'bg-amber-50 text-amber-800 border-amber-200';
      label = 'Gelé';
      break;
    case 'CLOTURE':
    case 'CLOTUREE':
    case 'SOLDE':
      colorClasses = 'bg-stone-100 text-stone-600 border-stone-200';
      label = status === 'SOLDE' ? 'Soldé' : 'Clôturé';
      break;
    case 'SUSPENDU':
    case 'SUSPENDUE':
      colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
      label = 'Suspendu';
      break;
    case 'SORTI':
      colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Sorti';
      break;
    case 'SOUMISE':
      colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
      label = 'Soumise (En attente de votes)';
      break;
    case 'APPROUVEE':
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200';
      label = 'Approuvée (Quorum atteint)';
      break;
    case 'REJETEE':
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-200';
      label = 'Rejetée';
      break;
    case 'DEBLOQUEE':
      colorClasses = 'bg-purple-50 text-purple-800 border-purple-200';
      label = 'Débloquée (Prêt actif)';
      break;
    case 'EN_RETARD':
      colorClasses = 'bg-rose-100 text-rose-800 border-rose-300 font-semibold';
      label = 'En retard d’échéance';
      break;
    case 'POUR':
      colorClasses = 'bg-emerald-100 text-emerald-800 border-emerald-300';
      label = 'Pour';
      break;
    case 'CONTRE':
      colorClasses = 'bg-rose-100 text-rose-800 border-rose-300';
      label = 'Contre';
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border font-heading ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {label}
    </span>
  );
};

export default StatusBadge;
