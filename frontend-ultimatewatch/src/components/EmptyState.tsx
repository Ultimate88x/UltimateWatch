import { motion } from "framer-motion";
import { SearchX, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  showBackButton?: boolean;
  fullPage?: boolean;
}

export const EmptyState = ({
  title = "Content Not Found",
  description = "The piece you're looking for has vanished into the digital void.",
  icon: Icon = SearchX,
  actionLabel = "Go Back",
  onAction,
  showBackButton = true,
  fullPage = true,
}: EmptyStateProps) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) onAction();
    else if (showBackButton) navigate(-1);
  };

  const containerClasses = fullPage
    ? "fixed inset-0 bg-blue-background"
    : "relative w-full min-h-[400px] h-full bg-white/[0.02] border border-white/5 border-dashed rounded-3xl mt-4";

  return (
    <div className={`${containerClasses} flex flex-col items-center justify-center p-6 text-center overflow-hidden`}>
      
      <div className={`absolute ${fullPage ? 'w-96 h-96' : 'w-64 h-64'} bg-purple-main/10 rounded-full blur-[120px] -z-10`} />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className={`
            bg-white/5 border border-white/10 rounded-full backdrop-blur-xl shadow-2xl
            ${fullPage ? 'p-8' : 'p-5'}
          `}>
            <Icon className={`${fullPage ? 'w-16 h-16' : 'w-10 h-10'} text-purple-300/30`} strokeWidth={1} />
          </div>
          
          <div className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-purple-main/20 border border-purple-main/40 rounded-md">
            <span className="text-[9px] font-black text-purple-200 uppercase tracking-tighter">
              Empty
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className={`${fullPage ? 'text-4xl' : 'text-xl'} font-black text-white uppercase tracking-tighter`}>
            {title}
          </h2>
          <p className="text-purple-200/40 text-xs max-w-xs mx-auto font-medium italic leading-relaxed">
            "{description}"
          </p>
        </div>

        {showBackButton && (
          <button 
            onClick={handleAction}
            className="mt-4 px-8 py-3 bg-white/5 hover:bg-purple-main/20 border border-white/10 hover:border-purple-main/50 rounded-xl text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-lg active:scale-95"
          >
            {actionLabel}
          </button>
        )}
      </motion.div>
    </div>
  );
};