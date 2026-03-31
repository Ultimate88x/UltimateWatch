import { motion } from "framer-motion";
import { SearchX } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  actionLabel?: string;
  onAction?: () => void;
  showBackButton?: boolean;
}

export const EmptyState = ({
  title = "Content Not Found",
  description = "The piece you're looking for has vanished into the digital void.",
  icon: Icon = SearchX,
  actionLabel = "Go Back",
  onAction,
  showBackButton = true,
}: EmptyStateProps) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (showBackButton) {
      navigate(-1);
    }
  };

  return (
    <div className="fixed inset-0 bg-blue-background flex flex-col items-center justify-center p-6 text-center">
      <div className="absolute w-96 h-96 bg-purple-main/10 rounded-full blur-[120px] -z-10" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className="p-6 bg-white/5 border border-white/10 rounded-full backdrop-blur-xl shadow-[0_0_30px_rgba(168,85,247,0.1)]">
            <Icon className="w-16 h-16 text-purple-300/20" strokeWidth={1} />
          </div>
          
          <div className="absolute -bottom-2 -right-2 px-3 py-1 bg-purple-main/20 border border-purple-main/40 rounded-md">
            <span className="text-[10px] font-black text-purple-200 uppercase tracking-tighter">
              Empty
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            {title}
          </h2>
          <p className="text-purple-200/40 text-sm max-w-xs mx-auto font-medium italic leading-relaxed">
            "{description}"
          </p>
        </div>

        <button 
          onClick={handleAction}
          className="mt-4 px-8 py-3 bg-white/5 hover:bg-purple-main/20 border border-white/10 hover:border-purple-main/50 rounded-xl text-white text-[10px] font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-lg active:scale-95"
        >
          {actionLabel}
        </button>
      </motion.div>
    </div>
  );
};