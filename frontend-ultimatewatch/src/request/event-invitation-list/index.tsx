import { AnimatePresence, motion } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, UserPlus, RotateCw, Mail, Check, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { getRelativeDate } from '../../components/utilities/RelativeDate';
import { useAdvancedNavigation } from '../../components/utilities/SmartNavigate';
import type { EventInvitationRequest } from '../../types/event-invitation-request';

export default function EventInvitationRequests() {
  const { smartNavigate } = useAdvancedNavigation();
  const [requests, setRequests] = useState<EventInvitationRequest[]>([]);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const fetchRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/requests/event-invite-request/received?page=${page}&limit=5`,
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
        toast.error(data.message || "Failed to fetch event invitations");
        return;
      }

      setRequests(data.data);
      setTotalPages(data.lastPage || 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error ocurred';
      toast.error(message);
    } finally {
      setTimeout(() => setIsLoading(false), 600);
    }
  }, [page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (requestId: number, accept: boolean) => {
    setIsActionLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/events/event-invite-request/resolve/${requestId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify({ accept })
      })

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to resolve request");
        return;
      }

      toast.success(data.message);

      setRequests(prev => prev.filter(req => req.id !== requestId));
      
      if (requests.length === 1 && page > 1) {
        setPage(p => p - 1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-blue-background flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="relative"
        >
          <div className="w-20 h-20 border-4 border-purple-main/20 border-t-purple-main rounded-full" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-white font-inter font-bold tracking-widest uppercase text-sm"
        >
          Loading Event Invitations
        </motion.p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-main/10 rounded-2xl border border-purple-main/20">
              <UserPlus className="text-purple-main" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Event Invitations</h2>
              <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Your upcoming binge sessions</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchRequests}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/40 cursor-pointer hover:text-purple-main hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
              title="Refresh events"
            >
              <RotateCw 
                size={18} 
                className={`${isLoading ? 'animate-spin text-purple-main' : ''} transition-colors`} 
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 min-h-100">
        <AnimatePresence mode="wait">
          {requests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center border border-white/5 border-dashed rounded-3xl"
            >
              <EmptyState icon={Mail} title={`No invitations yet`} description="When friends invite you to a binge, they'll show up here." fullPage={false} showBackButton={false} />
            </motion.div>
          ) : (
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 gap-3"
            >
              {requests.map((request) => (
                <div 
                  key={request.id}
                  className="group flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 rounded-3xl bg-white/2 border border-white/5 hover:bg-white/4 hover:border-purple-main/30 transition-all duration-500"
                >
                  <div className="flex items-center gap-5">
                    <div 
                      className="relative w-16 h-16 shrink-0 cursor-pointer"
                      onClick={(e) => smartNavigate(`/users/${request.username}`, e)}
                    >
                      <div className="absolute -inset-1 bg-purple-main/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                      <img 
                        src={request.userImagePath || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                        className="relative w-full h-full rounded-2xl object-cover border border-white/10"
                        alt={request.username}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                         <span className="text-purple-main text-[10px] font-black uppercase tracking-tighter italic">Invitation from</span>
                         <span className="text-white/30 text-[10px] font-bold">—</span>
                         <div className="flex items-center gap-1.5 text-white/30 text-[10px] font-bold uppercase tracking-widest">
                            <Clock size={12} />
                            {getRelativeDate(request.createdAt)}
                         </div>
                      </div>
                      
                      <h4 className="text-white font-black text-xl italic uppercase tracking-tighter">
                        <span className="text-purple-300">{request.username}</span> invited you to <span className="text-purple-main group-hover:text-purple-light transition-colors cursor-pointer" onClick={(e) => smartNavigate(`/events/${request.eventId}`, e)}>{request.eventName}</span>
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="success"
                      icon={Check}
                      className="w-auto px-6 rounded-2xl group/btn overflow-hidden transition-all duration-500 font-black uppercase italic tracking-widest text-[10px]"
                      onClick={() => handleAction(request.id, true)}
                      disabled={isActionLoading}
                    >
                      <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
                        Accept Binge
                      </span>
                    </Button>

                    <Button 
                      size="sm" 
                      variant="solid-error"
                      icon={X}
                      className="w-auto px-4 rounded-2xl group/btn overflow-hidden transition-all duration-500 font-black uppercase italic tracking-widest text-[10px]"
                      onClick={() => handleAction(request.id, false)}
                      disabled={isActionLoading}
                    >
                      <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
                        Decline
                      </span>
                    </Button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-6 mt-4">
          <div className="flex gap-1.5">
            {[...Array(totalPages)].map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${page === i + 1 ? 'w-10 bg-purple-main' : 'w-1.5 bg-white/10'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-10">
            <Button 
              variant="link" size="sm" icon={ChevronLeft} 
              onClick={() => setPage(p => Math.max(1, p - 1))} 
              disabled={page === 1 || isLoading}
            >
              Prev
            </Button>
            <Button 
              variant="link" size="sm" icon={ChevronRight} 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
              disabled={page === totalPages || isLoading} 
              className="flex-row-reverse"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
