import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy } from 'lucide-react';
import { Button } from '../Button';
import toast from 'react-hot-toast';

export type VoteResult = {
  id: number;
  title: string;
  imagePath: string;
  type: string;
  count: number;
};

interface EventResultsModalProps {
  eventId: number;
  isOpen: boolean;
  onClose: () => void;
  maxWinners: number;
  eventName: string;
}

export const EventResultsModal = ({
  eventId,
  isOpen,
  onClose,
  maxWinners,
  eventName,
}: EventResultsModalProps) => {
  const [mediaList, setMediaList] = useState<VoteResult[]>([]);
  const [isMediaLoading, setIsMediaLoading] = useState(false);

  const fetchMedia = React.useCallback(async () => {
    setIsMediaLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/events/results/${eventId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to fetch event results");
        return;
      }

      setMediaList(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setTimeout(() => setIsMediaLoading(false), 500);
    }
  }, [eventId]);

  useEffect(() => {
    if (isOpen) fetchMedia();
  }, [isOpen, fetchMedia]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-10"
        >
          <div className="absolute inset-0 bg-blue-background/90 backdrop-blur-2xl" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="relative w-full max-w-5xl h-[85vh] bg-white/5 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-main">Classification</h2>
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                  {eventName} <span className="text-white/20">Results</span>
                </h3>
              </div>
              <Button variant="ghost" size="sm" icon={X} onClick={onClose} className="w-auto! pl-2 pr-0 rounded-full" />
            </div>

            <div className="flex-1 overflow-y-auto p-8 media-scrollbar">
              {isMediaLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center py-20">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    className="relative"
                  >
                    <div className="w-10 h-10 border-4 border-purple-main/20 border-t-purple-main rounded-full" />
                  </motion.div>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 text-white font-inter font-bold tracking-widest uppercase text-xs"
                  >
                    Loading results...
                  </motion.p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {mediaList.map((result, index) => {
                    const isWinner = index < maxWinners;
                    return (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`relative flex items-center gap-6 p-4 rounded-2xl transition-all ${
                          isWinner 
                          ? 'bg-amber-400/10 border border-amber-400/30 shadow-[0_0_20px_rgba(251,191,36,0.05)]' 
                          : 'bg-white/2 border border-white/5 opacity-60'
                        }`}
                      >
                        <div className={`shrink-0 rounded-lg overflow-hidden bg-black border border-white/10 ${
                          result.type === 'episode' ? 'w-32 h-20' : 'w-16 h-24'
                        }`}>
                          <img src={result.imagePath} className="w-full h-full object-cover" alt={result.title} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm ${isWinner ? 'bg-amber-400 text-black' : 'bg-white/10 text-white/40'}`}>
                              {result.type === 'tv' ? 'SERIES' : result.type?.toUpperCase()}
                            </span>
                            {isWinner && (
                              <span className="flex items-center gap-1 text-[9px] font-black text-amber-400 uppercase tracking-widest">
                                <Trophy size={10} /> Winner
                              </span>
                            )}
                          </div>
                          <h4 className="text-xl font-black uppercase tracking-tighter text-white truncate leading-tight">
                            {result.title}
                          </h4>
                        </div>

                        <div className="text-right pr-4 shrink-0">
                          <div className={`text-2xl font-mono font-black leading-none ${isWinner ? 'text-white' : 'text-white/40'}`}>
                            {result.count}
                          </div>
                          <div className="text-[9px] font-bold text-white/30 uppercase tracking-widest mt-1">Votes</div>
                        </div>

                        {isWinner && (
                          <div className="absolute inset-y-0 right-0 w-1 bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,1)]" />
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-6 bg-black/40 border-t border-white/5 text-center">
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.3em]">
                Based on {mediaList.reduce((acc, curr) => acc + curr.count, 0)} total community votes
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};