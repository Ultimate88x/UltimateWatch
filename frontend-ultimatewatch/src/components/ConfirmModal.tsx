import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, type LucideIcon } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary' | 'accent';
  icon?: LucideIcon;
}

export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'danger',
  icon: Icon = AlertTriangle
}: ConfirmModalProps) => {

  const variantStyles = {
    danger: "text-red-danger bg-red-danger/10",
    primary: "text-blue-500 bg-blue-500/10",
    accent: "text-purple-main bg-purple-main/10",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 p-4 flex items-center justify-center z-100">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative max-w-md w-full bg-blue-background shadow-2xl border rounded-3xl border-white/10 p-8 overflow-hidden"
          >
            <div className="text-center">
              <div className={`mx-auto mb-6 h-20 w-20 rounded-full flex justify-center items-center ${variantStyles[variant]}`}>
                <Icon size={40} />
              </div>

              <h3 className="mb-3 text-2xl font-black text-white uppercase italic tracking-tighter font-inter">
                {title}
              </h3>
              
              <p className="mb-8 text-gray-400 leading-relaxed">
                {description}
              </p>
              
              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1 border border-white/10 hover:bg-white/5 py-6 rounded-2xl font-bold uppercase text-xs tracking-widest"
                  onClick={onClose}
                >
                  {cancelText}
                </Button>

                <Button 
                  variant={variant === 'danger' ? 'danger' : 'solid-accent'} 
                  className="flex-1 py-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg"
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                >
                  {confirmText}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};