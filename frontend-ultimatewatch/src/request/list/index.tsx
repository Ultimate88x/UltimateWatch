import { AnimatePresence, motion } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, UserPlus, UserCheck, UserX } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/EmptyState';
import { formatDate } from '../../components/utilities/FormatDate';
import { Button } from '../../components/Button';

interface RequestDto {
  id: number;
  username: string;
  userImagePath: string;
  createdAt: string;
}

const FriendRequests: React.FC = () => {
  const [requests, setRequests] = useState<RequestDto[]>([]);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState<number | null>(null);

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
      if (!response.ok) throw new Error(data.message || 'Error fetching');

      setRequests(data.data);
      setTotalPages(data.lastPage || 1);
      setTotalItems(data.total || 0);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error');
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAction = async (requestId: number, action: 'accept' | 'reject' | 'cancel') => {
    setIsActionLoading(requestId);
    try {
      const endpoint = action === 'accept' ? 'accept' : 'reject';
      const response = await fetch(`http://localhost:3000/requests/${endpoint}/${requestId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.ok) {
        toast.success(`Request ${action}ed successfully`);
        // Ahora fetchRequests es accesible aquí
        fetchRequests(); 
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Action failed');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      setIsLoading(false);
    } finally {
      setIsActionLoading(null);
    }
  };

  if (isLoading && page === 1) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-2 border-purple-main/20 border-t-purple-main rounded-full"
        />
        <p className="mt-4 text-purple-200/50 font-bold uppercase tracking-widest text-[10px]">Loading Requests...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 p-6">
      {/* Header & Tabs */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-main/10 rounded-2xl border border-purple-main/20">
              <UserPlus className="text-purple-main" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Social Requests</h2>
              <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Manage your connections</p>
            </div>
          </div>
          
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            <button 
              onClick={() => { setActiveTab('received'); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'received' ? 'bg-purple-main text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Received
            </button>
            <button 
              onClick={() => { setActiveTab('sent'); setPage(1); }}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'sent' ? 'bg-purple-main text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Sent
            </button>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div className="flex flex-col gap-4 min-h-100">
        <AnimatePresence mode="wait">
          {requests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex-1 flex items-center justify-center border border-white/5 border-dashed rounded-3xl"
            >
              <EmptyState title={`No ${activeTab} requests found`} fullPage={false} showBackButton={false} />
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
                  {/* User Avatar */}
                  <div className="relative w-14 h-14 shrink-0">
                    <div className="absolute -inset-1 bg-purple-main/20 rounded-full blur opacity-0 group-hover:opacity-100 transition duration-500" />
                    <img 
                      src={request.userImagePath || 'https://cdn-icons-png.flaticon.com/512/149/149071.png'} 
                      className="relative w-full h-full rounded-full object-cover border border-white/10"
                      alt={request.username}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col">
                    <h4 className="text-white font-bold text-lg group-hover:text-purple-300 transition-colors">
                      {request.username}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/30">
                      <Clock size={12} />
                      {formatDate(request.createdAt)}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {activeTab === 'received' ? (
                      <>
                        <Button 
                          size="sm" 
                          className="bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white border-green-500/20"
                          onClick={() => handleAction(request.id, 'accept')}
                          disabled={!!isActionLoading}
                        >
                          <UserCheck size={16} />
                        </Button>
                        <Button 
                          size="sm" 
                          className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border-red-500/20"
                          onClick={() => handleAction(request.id, 'reject')}
                          disabled={!!isActionLoading}
                        >
                          <UserX size={16} />
                        </Button>
                      </>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="link"
                        className="text-white/20 hover:text-red-500"
                        onClick={() => handleAction(request.id, 'cancel')}
                        disabled={!!isActionLoading}
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

      {/* Pagination (Estilo SeasonDetail) */}
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
              onClick={() => { setPage(p => Math.max(1, p - 1)); setIsLoading(true); }} 
              disabled={page === 1 || isLoading}
            >
              Prev
            </Button>
            <Button 
              variant="link" size="sm" icon={ChevronRight} 
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); setIsLoading(true); }} 
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

export default FriendRequests;