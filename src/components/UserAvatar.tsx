import React from 'react';

interface UserAvatarProps {
  name: string;
  photo?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  online?: boolean;
  showOnlineStatus?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  photo,
  size = 'md',
  online = false,
  showOnlineStatus = false,
  onClick,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm font-semibold',
    lg: 'w-12 h-12 text-base font-bold',
    xl: 'w-24 h-24 text-2xl font-black',
    '2xl': 'w-32 h-32 text-4xl font-black',
  };

  const statusIndicatorMap = {
    sm: 'w-2.5 h-2.5 right-0 bottom-0 border-[1.5px]',
    md: 'w-3 h-3 right-0 bottom-0 border-2',
    lg: 'w-3.5 h-3.5 right-0.5 bottom-0.5 border-2',
    xl: 'w-5 h-5 right-1 bottom-1 border-2',
    '2xl': 'w-6 h-6 right-1.5 bottom-1.5 border-[3px]',
  };

  const initial = (name || 'U').charAt(0).toUpperCase();

  // Subtle hash-based gradient generator for avatars without photos
  const getGradient = (str: string) => {
    const gradients = [
      'from-indigo-500 via-purple-500 to-pink-500',
      'from-cyan-500 via-blue-600 to-indigo-600',
      'from-emerald-500 via-teal-600 to-cyan-600',
      'from-amber-500 via-orange-600 to-rose-600',
      'from-violet-600 via-indigo-600 to-blue-500'
    ];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % gradients.length;
    return gradients[idx];
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-block shrink-0 select-none ${
        onClick ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      <div
        className={`rounded-2xl overflow-hidden flex items-center justify-center shadow-sm transition-transform duration-200 ${sizeMap[size]} ${
          onClick ? 'group-hover:scale-[1.03] group-active:scale-95' : ''
        } ${
          photo
            ? 'bg-slate-800'
            : `bg-gradient-to-tr ${getGradient(name)} text-white shadow-indigo-500/20`
        }`}
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="tracking-wider">{initial}</span>
        )}
      </div>

      {showOnlineStatus && (
        <span
          className={`absolute rounded-full border-slate-950 ${statusIndicatorMap[size]} ${
            online
              ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
              : 'bg-slate-500'
          }`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
