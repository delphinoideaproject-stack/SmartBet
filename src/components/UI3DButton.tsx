import React from 'react';
import { LucideIcon } from 'lucide-react';

interface UI3DButtonProps {
  id?: string;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'indigo' | 'danger' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  badge?: string;
  type?: 'button' | 'submit' | 'reset';
  fullWidth?: boolean;
}

export const UI3DButton: React.FC<UI3DButtonProps> = ({
  id,
  onClick,
  children,
  variant = 'cyan',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  className = '',
  badge,
  type = 'button',
  fullWidth = false,
}) => {
  const variantClasses = {
    cyan: 'btn-3d-cyan text-white font-bold',
    emerald: 'btn-3d-emerald text-white font-bold',
    amber: 'btn-3d-amber text-slate-950 font-extrabold',
    indigo: 'btn-3d-indigo text-white font-bold',
    danger: 'btn-3d-danger text-white font-bold',
    dark: 'btn-3d-dark text-slate-200 font-semibold border border-slate-700/60',
  };

  const sizeClasses = {
    sm: 'px-3.5 py-1.5 text-xs rounded-xl gap-1.5',
    md: 'px-5 py-2.5 text-sm rounded-2xl gap-2',
    lg: 'px-7 py-3.5 text-base rounded-2xl gap-2.5 tracking-wide',
  };

  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        group relative inline-flex items-center justify-center cursor-pointer select-none overflow-hidden
        transition-all duration-150 active:translate-y-[4px] outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
    >
      {/* Subtle Immersive Shine Overlay */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        Icon && iconPosition === 'left' && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      )}

      <span className="relative z-10">{children}</span>

      {!loading && Icon && iconPosition === 'right' && (
        <Icon className={`relative z-10 ${size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'}`} />
      )}

      {badge && (
        <span className="relative z-10 ml-1.5 px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-black/40 text-white border border-white/20">
          {badge}
        </span>
      )}
    </button>
  );
};
