import React from 'react';
import { Check } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ size = 'sm', showTooltip = true }) => {
  const sizeClasses = {
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-[11px]',
    lg: 'w-6 h-6 text-xs'
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-500 text-white shadow-sm shadow-sky-500/30 font-black shrink-0 ${sizeClasses[size]}`}
      title={showTooltip ? "Verified Official Account" : undefined}
    >
      <Check size={iconSizes[size]} strokeWidth={3.5} />
    </span>
  );
};
