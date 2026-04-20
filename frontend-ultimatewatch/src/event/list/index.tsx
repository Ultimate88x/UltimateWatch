import { AnimatePresence, motion } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, ArrowRight, Users, HelpCircle, Eye, RotateCw } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EmptyState } from '../../components/EmptyState';
import { Button } from '../../components/Button';
import { getRelativeDate } from '../../components/utilities/RelativeDate';
import { useAdvancedNavigation } from '../../components/utilities/SmartNavigate';
import type { EventItem } from '../../types/event-item';

export default function EventList() {
  const { smartNavigate } = useAdvancedNavigation();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'joined' | 'created'>('available');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvents = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/events/${activeTab}?page=${page}`,
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
        toast.error(data.message || "Failed to fetch available events");
        return;
      }

      setEvents(data.data);
      setTotalPages(data.lastPage || 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
      setIsLoading(false);
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  }, [page, activeTab]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const getEventStatusUI = (status: string) => {
    switch (status) {
      case 'voting':
        return { label: 'Voting in Progress', color: 'text-amber-400', bar: 'bg-amber-400/50', btn: 'Go Vote', dot: false };
      case 'started':
        return { label: 'Binge Started', color: 'text-green-500', bar: 'bg-green-500/50', btn: 'Watch Live', dot: true };
      case 'finished':
        return { label: 'Marathon Ended', color: 'text-white/20', bar: 'bg-white/10', btn: 'Archived', dot: false };
      case 'waiting':
      default:
        return { label: 'Waiting for Start Date', color: 'text-purple-main', bar: 'bg-purple-main/50', btn: 'Join Binge', dot: false };
    }
  };

  const getTabConfig = (tab: 'available' | 'joined' | 'created') => {
    switch (tab) {
      case 'joined':
        return {
          title: "My",
          accent: "Marathons",
          description: "Manage and track your binge sessions"
        };
        case 'created':
          return {
            title: "Host",
            accent: "Control",
            description: "Manage, edit and oversee the marathons you've organized"
          };
      case 'available':
      default:
        return {
          title: "Binge",
          accent: "Discovery",
          description: "Join synchronized marathons and community sessions"
        };
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
          Loading Events...
        </motion.p>
      </div>
    );
  }

  const tabUI = getTabConfig(activeTab);

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-10 pb-20">
      <div className="flex flex-row justify-between items-end gap-6 border-l-4 border-purple-main pl-6">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none transition-all duration-300">
            {tabUI.title} <span className="text-purple-main/50">{tabUI.accent}</span>
          </h2>
          <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em] transition-all duration-300">
            {tabUI.description}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchEvents}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-white/40 cursor-pointer hover:text-purple-main hover:bg-white/10 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh events"
          >
            <RotateCw 
              size={18} 
              className={`${isLoading ? 'animate-spin text-purple-main' : ''} transition-colors`} 
            />
          </button>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 self-start md:self-auto">
            <button 
              onClick={() => { 
                setIsLoading(true);
                setActiveTab('available');
                setPage(1); 
              }}
              className={`px-6 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'available' ? 'bg-purple-main text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Available
            </button>
            <button 
              onClick={() => { 
                setIsLoading(true);
                setActiveTab('joined');
                setPage(1); 
              }}
              className={`px-6 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'joined' ? 'bg-purple-main text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Joined
            </button>
            <button 
              onClick={() => { 
                setIsLoading(true);
                setActiveTab('created');
                setPage(1); 
              }}
              className={`px-6 py-2 rounded-lg text-xs font-bold cursor-pointer transition-all ${activeTab === 'created' ? 'bg-purple-main text-white shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Created
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <AnimatePresence mode="wait">
          {events.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState title="No events found" fullPage={false} showBackButton={false} />
            </motion.div>
          ) : (
            <motion.div key={activeTab + page} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
              {events.map((event, idx) => {
                const ui = getEventStatusUI(event.status);
                const isFinished = event.status === 'finished';

                return (
                  <div key={idx} className={`group relative flex flex-row border border-white/5 rounded-3xl overflow-hidden transition-all duration-500 shadow-xl ${isFinished ? 
                    'bg-white/1 opacity-60' : 
                    'bg-white/2 hover:bg-white/4 hover:border-purple-main/30'}`}>
                    
                    <div className="w-36 h-auto relative shrink-0 overflow-hidden bg-[#111] border-r border-white/5">
                      {event.mainImagePath ? (
                        <img 
                          src={event.mainImagePath} className="w-full h-full object-cover transition-all duration-700 saturate-[0.6] brightness-[0.9] group-hover:saturate-100 group-hover:brightness-110" 
                          alt={event.name} 
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <HelpCircle size={88} className="text-purple-main/50 group-hover:text-purple-main/75 transition-all duration-250 ease-in-out" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent z-10" />
                    </div>

                    <div className="flex-1 p-6 flex flex-col justify-between gap-4 z-10 min-w-0">
                      <div className="max-w-4xl w-full flex flex-col justify-between h-full gap-4">
                        
                        <div className="flex flex-col gap-1 min-w-0"> 
                          <div className="flex items-center gap-3 mb-2 shrink-0">
                            <span className="bg-purple-main/10 text-purple-main border border-purple-main/20 px-2 py-1.5 rounded text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                              {event.type.replace('_', ' ')}
                            </span>
                            <div className={`h-px w-4 shrink-0 ${ui.bar}`} />
                            <span className={`text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${ui.color}`}>{ui.label}</span>
                          </div>

                          <h4 className={`text-2xl font-black uppercase italic truncate w-full ${isFinished ? 'text-white/40' : 'text-white group-hover:text-purple-300 transition-all duration-250 ease-in-out'}`}>
                            {event.name}
                          </h4>
                          <p className="text-white/30 text-xs italic truncate w-full">
                            {event.mediaTitles || "Binge Session"}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 items-end gap-6 pt-4 border-t border-white/5 w-full">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Members</span>
                            <div className="flex items-center gap-2 text-white font-black text-sm">
                              <Users size={14} className={isFinished ? 'text-white/10' : 'text-purple-main shrink-0'} />
                              <span className={isFinished ? 'text-white/20' : ''}>{event.currentMembers}/{event.maxMembers}</span>
                            </div>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">Timing</span>
                            <div className="flex items-center gap-2 text-white/70 font-bold text-xs">
                              <Clock size={14} className={isFinished ? 'text-white/10' : 'text-purple-main shrink-0'} />
                              <span className={`truncate ${isFinished ? 'text-white/20' : ''}`}>{getRelativeDate(event.eventDate)}</span>
                            </div>
                          </div>
                          <div className="relative -bottom-1.5 flex flex-col items-start min-w-0 italic">
                            <span className="text-[8px] font-black text-white/20 uppercase tracking-widest font-sans not-italic">Host</span>
                            <div className="flex items-center gap-2.5 min-w-0 w-full">
                              <img src={event.creatorImagePath} className="w-6 h-6 rounded-md border border-white/10 shrink-0" alt="host" />
                              <span className={`text-[11px] font-bold truncate ${isFinished ? 'text-white/20' : 'text-white'}`}>
                                {event.creatorName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`md:w-56 shrink-0 border-t md:border-t-0 md:border-l border-white/5 p-6 flex flex-col items-center justify-center gap-3 ${isFinished ? 'bg-white/1' : 'bg-white/2'}`}>
                      <Button 
                        variant="ghost"
                        icon={Eye}
                        disabled={isFinished}
                        className="w-full py-4 rounded-2xl font-black uppercase text-[10px] border border-white/5 hover:border-white/10"
                        onClick={() => smartNavigate(`/events/${event.id}`)}
                      >
                        Details
                      </Button>

                      <Button 
                        variant={isFinished ? "secondary" : "solid-accent"}
                        icon={ArrowRight}
                        showShine={!isFinished}
                        disabled={isFinished}
                        className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] ${!isFinished && 'shadow-[0_0_20px_rgba(168,85,247,0.15)]'}`}
                        onClick={() => !isFinished && console.log("Join")}
                      >
                        {ui.btn}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-1.5 flex items-center gap-1 shadow-2xl">
            <Button 
              variant="ghost" 
              className="w-14! h-12! rounded-xl!"
              icon={ChevronLeft}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              {""}
            </Button>

            <div className="h-8 w-px bg-white/10 mx-2" />

            <div className="px-6 flex items-center gap-3 select-none min-w-45 justify-center">
              <span className="text-[10px] font-black text-white/40 tracking-widest">PAGE</span>
              
              <div className="bg-white/5 px-3 py-1 rounded-md border border-white/5 min-w-10 flex justify-center">
                <span className="font-mono text-purple-main font-black">
                  {page.toString().padStart(2, '0')}
                </span>
              </div>

              <span className="text-[10px] font-black text-white/10 tracking-widest">OF</span>
              
              <span className="font-mono text-white/40 font-bold">
                {totalPages.toString().padStart(2, '0')}
              </span>
            </div>

            <div className="h-8 w-px bg-white/10 mx-2" />

            <Button 
              variant="solid-accent" 
              className="w-14! h-12! rounded-xl!" 
              icon={ChevronRight}
              showShine={!isLoading}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              {""}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
