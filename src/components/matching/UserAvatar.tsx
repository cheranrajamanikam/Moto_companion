import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface UserAvatarProps {
  src: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isVerified?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  src,
  name,
  size = 'md',
  isVerified = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-16 h-16 text-base',
    xl: 'w-24 h-24 text-xl',
  };

  const badgeSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className={`relative inline-block ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-slate-700/80 shadow-md`}
          onError={(e) => {
            // Fallback on broken image
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : null}
      <div
        className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-orange-500 to-amber-600 font-semibold text-white flex items-center justify-center border-2 border-slate-700/80 shadow-md ${
          src ? 'hidden' : ''
        }`}
      >
        {getInitials(name)}
      </div>

      {isVerified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 bg-emerald-500 text-white p-0.5 rounded-full ring-2 ring-[#0B0F17] flex items-center justify-center"
          title="KYC Verified Rider"
        >
          <ShieldCheck className={badgeSizes[size]} />
        </span>
      )}
    </div>
  );
};
