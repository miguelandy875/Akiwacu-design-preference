import React from 'react';
import { LucideIcon, FolderOpen, Plus } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: LucideIcon;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon: Icon = FolderOpen,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white rounded-xl border border-dashed border-stone-300 my-4">
      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 mb-4">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-stone-900 font-heading mb-1">{title}</h3>
      <p className="text-sm text-stone-500 max-w-sm mb-6">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          type="button"
          className="touch-target inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-xs text-white bg-[#e68a00] hover:bg-[#cc7a00] focus:outline-hidden transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};
