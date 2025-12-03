
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  isLoading?: boolean;
  accentColor?: 'indigo' | 'rose' | 'emerald' | 'blue' | 'amber' | 'violet'; // Added violet
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  accentColor = 'indigo',
  ...props 
}) => {
  // Base styles including micro-interactions (transform, transition)
  const baseStyles = "inline-flex items-center justify-center px-4 py-2 rounded-xl font-bold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0 active:scale-[0.97] hover:-translate-y-0.5";
  
  // Dynamic color maps with more vibrant shadows and gradients
  // Note: Updated for Dark Mode support via CSS variables or utility classes is assumed in parent, 
  // but specific text colors here are explicit.
  const colorMap = {
    indigo: {
      primary: "bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 ring-indigo-500 border border-transparent",
      secondary: "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-indigo-300 shadow-sm hover:shadow-md hover:shadow-indigo-500/10 ring-indigo-200",
      ghost: "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 ring-indigo-200"
    },
    rose: {
      primary: "bg-gradient-to-r from-rose-500 to-rose-400 hover:from-rose-400 hover:to-rose-300 text-white shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 ring-rose-500 border border-transparent",
      secondary: "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-rose-300 shadow-sm hover:shadow-md hover:shadow-rose-500/10 ring-rose-200",
      ghost: "text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-900/30 ring-rose-200"
    },
    emerald: {
      primary: "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 ring-emerald-500 border border-transparent",
      secondary: "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-300 shadow-sm hover:shadow-md hover:shadow-emerald-500/10 ring-emerald-200",
      ghost: "text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/30 ring-emerald-200"
    },
    blue: {
      primary: "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 ring-blue-500 border border-transparent",
      secondary: "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-blue-300 shadow-sm hover:shadow-md hover:shadow-blue-500/10 ring-blue-200",
      ghost: "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 ring-blue-200"
    },
    amber: {
      primary: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 ring-amber-500 border border-transparent",
      secondary: "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-amber-300 shadow-sm hover:shadow-md hover:shadow-amber-500/10 ring-amber-200",
      ghost: "text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50/50 dark:hover:bg-amber-900/30 ring-amber-200"
    },
    violet: {
      primary: "bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 ring-violet-500 border border-transparent",
      secondary: "bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-violet-300 shadow-sm hover:shadow-md hover:shadow-violet-500/10 ring-violet-200",
      ghost: "text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-900/30 ring-violet-200"
    }
  };

  const dangerStyle = "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 hover:border-red-200 shadow-sm ring-red-200";

  let variantStyle = colorMap[accentColor][variant];
  if (variant === 'danger') variantStyle = dangerStyle;

  return (
    <button 
      className={`${baseStyles} ${variantStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="opacity-90 tracking-wide text-sm">處理中...</span>
        </>
      ) : children}
    </button>
  );
};
