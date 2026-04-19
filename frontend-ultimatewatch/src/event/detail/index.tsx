import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import type { Event } from '../../types/event';
import type { Member } from '../../types/member';
import { EmptyState } from '../../components/EmptyState';
import { Film, Calendar, Users, Info, Tv, PlayCircle, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../components/Button';
import { getRelativeDate } from '../../components/utilities/RelativeDate';
import { useAdvancedNavigation } from '../../components/utilities/SmartNavigate';

export default function EventDetail() {
  const { smartNavigate } = useAdvancedNavigation();
  const { id } = useParams();
  const [event, setEvent] = useState<Event | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isMembersLoading, setIsMembersLoading] = useState(true);
  
  const [isLoading, setIsLoading] = useState(true);

  const fetchEvent = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/events/${id}`,
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
        toast.error(data.message || "Failed to fetch event");
        return;
      }

      setEvent(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  }, [id]);

  const fetchMembers = useCallback(async () => {
    setIsMembersLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/members/event/${id}?page=${page}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to fetch members");
        return;
      }

      setMembers(data.data);
      setTotalPages(data.lastPage || 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
      setIsLoading(false);
    } finally {
      setTimeout(() => setIsMembersLoading(false), 250);
    }
  }, [id, page]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    if (event) fetchMembers();
  }, [event, fetchMembers]);

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
          Loading Event...
        </motion.p>
      </div>
    );
  }

  if (!event) {
    return <EmptyState icon={Film} title='Event not found' />;
  }

  return (
    <div className="relative w-full bg-cover bg-blue-background flex flex-col justify-start items-center overflow-x-hidden">
      <div className="absolute w-full h-150 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-b from-purple-main/20 via-blue-background/80 to-blue-background" />
        {event.media?.[0]?.imagePath && (
          <img 
            src={event.media[0].imagePath} 
            className="w-full h-full object-cover opacity-20 blur-sm" 
            alt="background"
          />
        )}
      </div>

      <div className="relative w-full max-w-400 mx-auto px-6 pt-10 flex flex-col gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-2"
        >
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter leading-none flex flex-col">
            <span className="text-purple-main/45 text-sm mb-2 tracking-[0.5em] font-black italic non-italic">
              {event.type.replace('_', ' ')} // {getEventStatusUI(event.status).label}
            </span>
            <div>
              {event.name.split(' ')[0]} <span className="text-purple-main/45">{event.name.split(' ').slice(1).join(' ')}</span>
            </div>
          </h1>

          <div className="flex flex-wrap gap-6 items-center mt-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 ${getEventStatusUI(event.status).color}`}>
              {getEventStatusUI(event.status).dot && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-current"></span>
                </span>
              )}
              <span className="text-[10px] font-black uppercase tracking-widest">
                {event.status}
              </span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden md:block" />

            <div className="flex items-center gap-2 text-white/60">
              <Calendar size={18} className="text-purple-main" />
              <span className="text-sm font-bold uppercase">{getRelativeDate(event.eventDate)}</span>
            </div>

            <div className="flex items-center gap-2 text-white/60">
              <Users size={18} className="text-purple-main" />
              <span className="text-sm font-bold uppercase">{members.length} / {event.maxMembers}</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-12 gap-6">
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white/2 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
              <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] mb-4 text-white/30">
                <Info size={14} /> Event Description
              </h3>
              <p className="text-white/70 leading-relaxed italic font-medium">
                {event.description || "No description provided for this binge session."}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <h3 className="flex items-center gap-3 text-xs font-black uppercase tracking-[0.3em] pl-2 text-white/30">
                <Tv size={14} /> Lineup Schedule
              </h3>
              
              <div className="flex flex-col gap-3">
                {event.media?.map((m, idx) => (
                  <motion.button 
                    key={m.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex group bg-[#0c0c0c] border border-white/5 rounded-2xl overflow-hidden hover:border-purple-main/30 transition-all shadow-xl cursor-pointer"
                    onClick={(e) => smartNavigate(`/${m.type === 'tv' ? 'series' : 'movies'}/${m.id}`, e)}
                  >
                    <div className="flex items-center p-3 gap-6">
                      <img src={m.imagePath} className="w-23 h-31 object-cover rounded-lg shadow-lg" alt={m.title} />
                      <div className="flex-1">
                        <h4 className="text-xl font-black uppercase italic group-hover:text-purple-main transition-colors leading-tight">
                          {m.title}
                        </h4>
                        {m.subMediaEvent && m.subMediaEvent?.length > 0 && (<p className="text-white/20 text-[10px] font-bold uppercase tracking-widest mt-1">
                          {m.subMediaEvent?.length || 0} Segments
                        </p>)}
                      </div>
                    </div>

                    {m.subMediaEvent && m.subMediaEvent.length > 0 && (
                      <div className="p-4 grid grid-cols-2 gap-4 bg-black/40 border-t border-white/5">
                        {m.subMediaEvent.map((sub, sIdx) => (
                          <div 
                            key={sIdx} 
                            className="group relative h-24 flex items-center overflow-hidden bg-white/5 border border-white/10 rounded-lg hover:border-purple-main/50 transition-all -skew-x-2 hover:skew-x-0"
                          >
                            <div className="absolute left-0 top-0 w-24 h-full overflow-hidden skew-x-2 group-hover:skew-x-0 transition-all">
                              <img src={sub.imagePath} className="w-full h-full object-cover scale-125" />
                              <div className="absolute inset-0 bg-purple-main/40 mix-blend-overlay" />
                            </div>

                            <div className="ml-28 flex flex-col skew-x-2 group-hover:skew-x-0 transition-all">
                              <span className="text-[7px] font-black text-purple-main uppercase tracking-[0.3em]">Sequence_{sIdx + 1}</span>
                              <h5 className="text-[11px] font-black text-white uppercase italic leading-tight">
                                {sub.title}
                              </h5>
                              <div className="mt-2 flex gap-1">
                                {[1,2,3].map(i => (
                                  <div key={i} className={`h-0.5 w-3 rounded-full ${i === 1 ? 'bg-purple-main' : 'bg-white/10'}`} />
                                ))}
                              </div>
                            </div>
                            
                            <div className="absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <PlayCircle size={20} className="text-purple-main" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <div className="bg-purple-main p-8 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.15)] flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <Shield size={160} />
              </div>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter">Ready for the marathon?</h4>
              <p className="text-white/80 text-xs font-bold leading-tight">Join the session to interact and vote with the community.</p>
              <Button variant="solid-accent" className="bg-white text-purple-main hover:bg-white/90 py-6 rounded-2xl mt-2 font-black">
                JOIN BINGE NOW
              </Button>
            </div>

            <div className="bg-white/2 border border-white/5 rounded-3xl p-6 flex flex-col gap-5 backdrop-blur-sm">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white/30">
                  Members
                </h3>
                <span className="text-[10px] font-bold text-purple-main/40 uppercase font-mono">
                  {page} / {totalPages}
                </span>
              </div>

              <div className="flex flex-col gap-4">
                <AnimatePresence mode="popLayout">
                  {isMembersLoading ? (
                    [...Array(10)].map((_, i) => (
                      <div key={`skeleton-${i}`} className="flex items-center gap-3 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5" />
                        <div className="flex flex-col gap-2 flex-1">
                          <div className="h-2.5 w-24 bg-white/10 rounded-full" />
                          <div className="h-2 w-12 bg-white/5 rounded-full" />
                        </div>
                      </div>
                    ))
                  ) : (
                    members.map((member) => (
                      <motion.div
                        key={member.name}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                      >
                        <button 
                          className="relative flex items-center gap-3 group cursor-pointer"
                          onClick={(e) => smartNavigate(`/users/${member.name}`, e)}
                        >
                          <div className="relative shrink-0">
                            <img src={member.imagePath} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt={member.name} />
                            {member.role === 'owner' && (
                              <div className="absolute -top-1 -right-1 bg-purple-main w-3 h-3 rounded-full border-2 border-[#0a0a0a]" />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-black uppercase italic truncate group-hover:text-purple-300 transition-colors">
                              {member.name}
                            </span>
                            <span className="text-[8px] font-bold uppercase text-white/20">
                              {member.role}
                            </span>
                          </div>
                        </button>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-auto! px-2! text-[10px] tracking-[0.2em]"
                    icon={ChevronLeft}
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </Button>

                  <div className="flex gap-1.5 items-center">
                    {[...Array(totalPages)].map((_, i) => (
                      <div 
                        key={i} 
                        className={`h-1 rounded-full transition-all duration-500 ${
                          page === i + 1 ? 'w-4 bg-purple-main shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'w-1 bg-white/10'
                        }`} 
                      />
                    ))}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-auto! px-2! text-[10px] tracking-[0.2em] flex-row-reverse"
                    icon={ChevronRight}
                    onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
