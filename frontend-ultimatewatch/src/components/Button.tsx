import type { LucideIcon } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'secondary' | 'ghost' | 'outline' | 'success' | 'glass' | 'danger-outline' | 'link';
  children: React.ReactNode;
  icon?: LucideIcon;
  isLoading?: boolean;
  showShine?: boolean;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Button = ({ 
  variant = 'primary', 
  children, 
  className, 
  icon: Icon, 
  isLoading, 
  showShine,
  fullWidth,
  size = 'md',
  ...props 
}: ButtonProps) => {
  
const variants = {
    primary: "bg-purple-main hover:bg-purple-600 text-white shadow-xl shadow-purple-main/20",
    danger: "bg-red-danger hover:bg-red-700 text-white shadow-lg",
    secondary: "bg-white/5 hover:bg-white/10 text-white border border-white/10",
    ghost: "bg-transparent hover:bg-white/10 text-white/70",
    outline: "bg-transparent border-2 border-white/20 hover:border-purple-main text-white",
    glass: "bg-white/5 text-white border border-white/10 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/50",
    "danger-outline": "bg-transparent border border-red-danger/50 text-red-danger hover:bg-red-danger hover:text-white uppercase",
    link: "bg-transparent p-0 text-white/60 hover:text-white underline-offset-4 hover:underline font-normal",
    success: "bg-emerald-500/80 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20",
    warning: "bg-amber-500/80 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20",
  };

  const sizes = {
    sm: "py-2 px-3 text-sm",
    md: "py-3 px-4",
    lg: "py-4 px-6 text-lg",
  };

  const isLink = variant === 'link';

  return (
    <button
      {...props}
      disabled={isLoading || props.disabled}
      className={`
        relative transition-all duration-300 cursor-pointer active:scale-95 flex items-center justify-center gap-2 group
        ${isLink ? "" : "rounded-xl font-bold overflow-hidden"}
        ${fullWidth ? "w-full" : isLink ? "w-auto" : "w-60"}
        ${variants[variant]} 
        ${!isLink && sizes[size]}
        ${isLoading ? "opacity-70 cursor-not-allowed" : ""}
        ${className}
      `}
    >
      {showShine && !isLoading && !isLink && (
        <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
      )}

      {isLoading ? (
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        Icon && <Icon size={isLink ? 16 : 20} className="transition-transform duration-300" />
      )}

      <span className={`${isLoading ? "invisible" : "visible"} ${!isLink && 'uppercase tracking-wider'}`}>
        {children}
      </span>
      
      {isLoading && <span className="absolute inset-0 flex items-center justify-center">Processing...</span>}
    </button>
  );
};