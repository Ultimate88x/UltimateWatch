import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { User, UserX, ChevronLeft, ChevronRight, Calendar, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "../../components/Button";
import { EmptyState } from "../../components/EmptyState";
import { useAdvancedNavigation } from "../../components/utilities/SmartNavigate";
import type { Request } from "../../types/request";
import { formatDate } from "../../components/utilities/FormatDate";

export default function FriendsList() {
  const { smartNavigate } = useAdvancedNavigation();
  
  const [friends, setFriends] = useState<Request[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalFriends, setTotalFriends] = useState(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchFriends = useCallback(async () => {
    setIsLoading(true);
    const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      const [response] = await Promise.all([
        fetch(`http://localhost:3000/requests/friends?page=${page}&limit=20`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }),
        wait(600),
      ]);

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to fetch friends');
        return;
      }

      setFriends(data.data);
      setLastPage(data.lastPage);
      setTotalFriends(data.total);

      if (page > 1 && data?.data.length > 10) {
        document.getElementById('friends-header')?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Connection error";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchFriends();
  }, [fetchFriends]);

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

      toast.success(data.message || `Friend deleted successfully`);
      
      await fetchFriends(); 
      
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      toast.error(message);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  if (isLoading && friends.length === 0) {
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
          Loading Friend Network
        </motion.p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-blue-background flex flex-col justify-start items-center overflow-x-hidden">
      <div className="relative w-full max-w-7xl flex flex-col gap-10">
        
        <div id="friends-header" className="flex flex-col gap-2 w-full">
          <div className="flex justify-between items-end">
            <div className="flex flex-col gap-1">
              <h2 className="text-4xl text-white font-black font-inter uppercase tracking-tight">
                My Friends
              </h2>
              <div className="flex items-center gap-2">
                <div className="h-1 w-12 bg-purple-main shadow-[0_0_12px_#A855F7] rounded-full" />
                <p className="text-purple-main text-[10px] font-bold tracking-[0.2em] uppercase">
                  Network Size: {totalFriends}
                </p>
              </div>
            </div>
            
            {friends.length > 0 && (
              <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-inner">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || isLoading}
                  className="p-2 text-white/40 hover:text-purple-main hover:bg-white/5 rounded-xl disabled:opacity-10 transition-all"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="text-white font-mono text-xs tracking-widest px-2">
                  {page.toString().padStart(2, '0')} / {lastPage.toString().padStart(2, '0')}
                </span>
                <button 
                  onClick={() => setPage(p => Math.min(lastPage, p + 1))}
                  disabled={page === lastPage || isLoading}
                  className="p-2 text-white/40 hover:text-purple-main hover:bg-white/5 rounded-xl disabled:opacity-10 transition-all"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col w-full gap-2 min-h-125">
          <AnimatePresence mode="wait">
            {friends.length === 0 && !isLoading ? (
              <EmptyState 
                title="Empty Network" 
                description="You haven't added any friends yet." 
                icon={UserX} 
                fullPage={false} 
                showBackButton={false} 
              />
            ) : (
              friends.map((friend, index) => (
                <motion.div
                  key={friend.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-purple-main/30 rounded-2xl transition-all duration-300 cursor-pointer"
                  onClick={(e) => smartNavigate(`/users/${friend.username}`, e)}
                >
                  <div className="flex items-center gap-6">
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500 overflow-hidden border border-white/10 bg-[#0a0a0a]">
                        {friend.userImagePath ? (
                          <img src={friend.userImagePath} alt={friend.username} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-purple-main/40"><User size={20} /></div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col">
                      <h3 className="text-white font-bold text-base tracking-tight group-hover:text-purple-main transition-colors uppercase">
                        {friend.username}
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-white/30 uppercase tracking-widest mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> Added {formatDate(friend.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 px-2">
                    <div className="flex items-center gap-4 ml-2">
                      <div className="hidden md:flex flex-col items-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[9px] text-purple-main font-black tracking-widest uppercase">View Profile</span>
                        <div className="h-0.5 w-8 bg-purple-main rounded-full" />
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/20 group-hover:text-purple-main group-hover:border-purple-main/50 transition-all">
                        <ExternalLink size={16} />
                      </div>
                    </div>

                    <Button
                      variant="glass"
                      size="sm"
                      className="w-auto px-3 opacity-50 group-hover:opacity-100 transition-all duration-300"
                      icon={Trash2}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteFriend(friend.username);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {friends.length > 0 && (
          <div className="w-full flex items-center justify-between mt-4 border-t border-white/5 pt-8">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-medium">
              Displaying {friends.length} contacts per page
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                disabled={page === 1 || isLoading}
                onClick={() => { setPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="border border-white/5 bg-white/5 rounded-xl text-white/50 hover:text-white hover:bg-purple-main/10 px-6"
              >
                Previous
              </Button>
              
              <Button
                variant="ghost"
                disabled={page === lastPage || isLoading}
                onClick={() => { setPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="border border-white/5 bg-white/5 rounded-xl text-white/50 hover:text-white hover:bg-purple-main/10 px-6"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}