import { motion, AnimatePresence } from 'framer-motion';
import { X, History, PlayCircle, ListOrdered } from 'lucide-react';
import { MediaCard } from './MediaCard';
import type { EventMediaRoom } from '../../types/event-media-room';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: EventMediaRoom[];
}

export function PlaylistModal({ isOpen, onClose, media }: PlaylistModalProps) {
  const history = media.filter(m => ['watched', 'skipped'].includes(m.status)).sort((a, b) => b.order - a.order);
  const current = media.filter(m => m.status === 'current');
  const pending = media.filter(m => m.status === 'pending').sort((a, b) => a.order - b.order);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
          />

          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="relative w-full max-w-7xl h-[85vh] bg-[#0c0c0c] border border-white/10 rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Event <span className="text-purple-main">Manifest</span>
                </h2>
                <div className="flex gap-4 mt-1">
                   <span className="text-[10px] font-mono text-white/20 uppercase">Total: {media.length} items</span>
                </div>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 overflow-hidden min-h-0">
              
              <div className="flex flex-col border-r border-white/5 bg-black/20 min-h-0">
                <div className="p-5 border-b border-white/5 flex items-center gap-3 text-white/40 shrink-0">
                  <History size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Archive</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 media-scrollbar">
                  {history.map(m => <MediaCard key={m.id} media={m} />)}
                </div>
              </div>

              <div className="flex flex-col bg-purple-main/3 min-h-0">
                <div className="p-5 border-b border-purple-main/10 flex items-center gap-3 text-purple-main shrink-0">
                  <PlayCircle size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Now Playing</span>
                </div>
                <div className="flex-1 p-8 overflow-y-auto media-scrollbar">
                  {current.map(m => (
                    <div key={m.id} className="scale-110 origin-top mb-8">
                      <MediaCard media={m} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col border-l border-white/5 bg-black/20 min-h-0">
                <div className="p-5 border-b border-white/5 flex items-center gap-3 text-white/40 shrink-0">
                  <ListOrdered size={18} />
                  <span className="text-xs font-black uppercase tracking-widest">Up Next</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4 media-scrollbar">
                  {pending.map((m, i) => <MediaCard key={m.id} media={m} isNext={i === 0} />)}
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}