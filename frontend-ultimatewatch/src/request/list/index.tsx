import { AnimatePresence, motion } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, UserPlus, UserCheck, UserX, Trash2, RotateCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { getRelativeDate } from '../../components/utilities/RelativeDate';
import { useAdvancedNavigation } from '../../components/utilities/SmartNavigate';
import type { Request } from '../../types/request';

export default function FriendRequests() {
  const { smartNavigate } = useAdvancedNavigation();
  const [requests, setRequests] = useState<Request[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<boolean>(false);

  const fetchRequests = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/requests/${activeTab}?page=${page}&limit=5`,
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
        toast.error(data.message || "Failed to fetch friend requests");
        return;
      }

      setRequests(data.data);
      setTotalPages(data.lastPage || 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setTimeout(() => setIsLoading(false), 600);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (requestId: number, action: 'accept' | 'reject' | 'cancel') => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    setIsActionLoading(true);

    try {
      const isAccepting = action === 'accept';
      const [response] = await Promise.all([
        fetch(
          `http://localhost:3000/requests/friend-request/resolve/${requestId}`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          },
          body: JSON.stringify({ accept: isAccepting })
        }),
        wait(750)
      ]);

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to perform action");
        return;
      }

      toast.success(data.message || `Request ${action}ed successfully`);
      await fetchRequests(); 
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const deleteFriend = async (username: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/requests/friend/${username}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to perform action");
        return;
      }

      toast.success(data.message || `Friend request deleted successfully`);
      
      await fetchRequests(); 
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
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
          Loading Friend Requests
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
              <h2 className="text-2xl font-bold text-white tracking-tight">Friend Requests</h2>
              <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Manage your connections</p>
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
            
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
              <button 
                onClick={() => { setActiveTab('received'); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'received' ? 'bg-purple-main text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Received
              </button>
              <button 
                onClick={() => { setActiveTab('sent'); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'sent' ? 'bg-purple-main text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
              >
                Sent
              </button>
            </div>
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
              <EmptyState title={`No requests found`} fullPage={false} showBackButton={false} />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab + page}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 gap-3"
            >
              {requests.map((request) => (
                <div 
                  key={request.id}
                  className="group flex items-center gap-5 p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/4 hover:border-purple-main/30 transition-all duration-300"
                >
                  <div 
                    className="flex flex-1 items-center gap-5 cursor-pointer"
                    onClick={(e) => smartNavigate(`/users/${request.username}`, e)}
                  >
                    <div className="relative w-14 h-14 shrink-0">
                      <div className="absolute -inset-1 bg-purple-main/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
                      <img 
                        src={request.userImagePath || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                        className="relative w-full h-full rounded-full object-cover border border-white/10"
                        alt={request.username}
                      />
                    </div>

                    <div className="flex flex-col">
                      <h4 className="text-white font-bold text-lg group-hover:text-purple-300 transition-colors">
                        {request.username}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                        <Clock size={12} />
                        {getRelativeDate(request.createdAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {activeTab === 'received' ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="success"
                          icon={UserCheck}
                          className="w-auto px-3 group/btn overflow-hidden transition-all duration-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(request.id, 'accept');
                          }}
                          disabled={isActionLoading}
                        >
                          <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
                            Accept
                          </span>
                        </Button>

                        <Button 
                          size="sm" 
                          variant="solid-error"
                          icon={UserX}
                          className="w-auto px-3 group/btn overflow-hidden transition-all duration-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(request.id, 'reject');
                          }}
                          disabled={isActionLoading}
                        >
                          <span className="max-w-0 overflow-hidden group-hover/btn:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap">
                            Reject
                          </span>
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="solid-error"
                        icon={Trash2}
                        className="w-auto px-4 group/btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFriend(request.username);
                        }}
                        disabled={isActionLoading}
                      >
                        Cancel Request
                      </Button>
                    )}
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
