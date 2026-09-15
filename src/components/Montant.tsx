import React from 'react';

interface MontantProps {
  valeur: number | null | undefined;
  className?: string;
  devise?: string;
  signe?: boolean;
}

/**
 * Formatage obligatoire des montants en BIF :
 * - Pas de décimale
 * - Séparateur d'espace pour les milliers
 * - Chiffres tabulaires
 * Ex: 1 250 000 BIF
 */
export const formatMontantBif = (valeur: number | null | undefined): string => {
  if (valeur === null || valeur === undefined || isNaN(valeur)) {
    return '0 BIF';
  }
  const arrondi = Math.round(valeur);
  const formater = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    useGrouping: true,
  });
  // Remplacer les espaces insécables normaux ou étroits par des espaces simples pour uniformité
  const formated = formater.format(arrondi).replace(/[\u202F\u00A0]/g, ' ');
  return `${formated} BIF`;
};

export const Montant: React.FC<MontantProps> = ({
  valeur,
  className = '',
  devise = 'BIF',
  signe = false,
}) => {
  if (valeur === null || valeur === undefined || isNaN(valeur)) {
    return <span className={`font-tabular font-medium ${className}`}>0 {devise}</span>;
  }

  const arrondi = Math.round(valeur);
  const formater = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
    useGrouping: true,
  });
  const formated = formater.format(Math.abs(arrondi)).replace(/[\u202F\u00A0]/g, ' ');
  const prefix = signe ? (arrondi > 0 ? '+' : arrondi < 0 ? '-' : '') : '';

  return (
    <span className={`font-tabular tracking-tight font-medium inline-block whitespace-nowrap ${className}`}>
      {prefix}{formated} {devise}
    </span>
  );
};

export default Montant;
