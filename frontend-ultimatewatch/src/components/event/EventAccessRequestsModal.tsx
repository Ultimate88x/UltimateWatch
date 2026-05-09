import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../Button';
import { EmptyState } from '../EmptyState';
import type { Request } from '../../types/request';
import { getRelativeDate } from '../utilities/RelativeDate';

interface EventAccessRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string | undefined;
  onAccept: () => void;
}

export const EventAccessRequestsModal = ({ isOpen, onClose, eventId, onAccept }: EventAccessRequestsModalProps) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    const fetchAccessRequests = async () => {
      if (!isOpen || !eventId) return;
      
      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:3000/events/access-requests/${eventId}?page=${page}&limit=4`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to fetch access requests");
          return;
        }

        setRequests(data.data);
        setTotalPages(data.lastPage);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      } finally {
        setTimeout(() => setLoading(false), 400);
      }
    };

    fetchAccessRequests();
  }, [isOpen, page, eventId]);

  const handleResolveRequest = async (requestId: number, accept: boolean) => {
    try {
      const response = await fetch(`http://localhost:3000/events/event-access-request/resolve/${requestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ accept }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to resolve request");
        return;
      }

      toast.success(accept ? "Request accepted" : "Request declined");
      
      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      if (requests.length === 1 && page > 1) {
        setPage(p => p - 1);
      }

      if (accept) {
        onAccept();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl"
          >
            <div className="p-8 pb-4 flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-main/10 border border-purple-main/20">
                    <Users className="w-4 h-4 text-purple-main" />
                  </div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-main">Admin</h2>
                </div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                  Join <span className="text-white/20">Requests</span>
                </h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                icon={X} 
                onClick={onClose} 
                className="w-auto! pr-1 rounded-full hover:bg-white/5" 
              />
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-4 custom-scrollbar min-h-87.5 max-h-112.5">
              {loading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="w-12 h-12 border-4 border-purple-main/20 border-t-purple-main rounded-full"
                  />
                  <p className="mt-4 text-white/40 font-bold tracking-[0.2em] uppercase text-[10px]">Checking requests...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <EmptyState icon={Users} title="All clear" description="No pending access requests for this event." fullPage={false} showBackButton={false} />
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence mode="popLayout">
                    {requests.map((request, index) => (
                      <motion.div
                        key={request.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center gap-4 p-3 rounded-2xl bg-white/3 border border-white/5 group"
                      >
                        <img 
                          src={request.userImagePath} 
                          className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10" 
                          alt={request.username} 
                        />
                        
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-md font-bold text-white truncate leading-none mb-1">
                            {request.username}
                          </span>
                          <span className="text-[9px] text-white/30 uppercase font-bold tracking-wider">
                             Requested {getRelativeDate(request.createdAt)}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-9! h-9 p-0 rounded-xl hover:bg-red-500/10 group/decline"
                            onClick={() => handleResolveRequest(request.id, false)}
                          >
                            <X className="w-4 h-4 text-white/20 group-hover/decline:text-red-500 transition-colors" />
                          </Button>
                          <Button
                            variant="solid-accent"
                            size="sm"
                            className="w-9! h-9 p-0 rounded-xl"
                            onClick={() => handleResolveRequest(request.id, true)}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="p-6 bg-white/2 border-t border-white/5 flex items-center justify-between">
              {totalPages > 1 ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ChevronLeft}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-auto! px-3"
                  />
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={ChevronRight}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-auto! px-3 flex-row-reverse"
                  />
                </>
              ) : (
                <div className="w-full text-center">
                  <p className="text-[9px] font-bold text-white/10 uppercase tracking-[0.3em]">
                    End of list
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};