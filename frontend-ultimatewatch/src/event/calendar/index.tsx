import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, 
  parseISO, addMonths, subMonths, startOfWeek, endOfWeek, 
  isSameMonth, isToday 
} from 'date-fns';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  ExternalLink, Clock, Users, X, 
  HelpCircle,
  LayoutList
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { EventPreviewCard } from '../../components/event/EventPreviewCard';
import type { EventItem } from '../../types/event-item';
import { useAdvancedNavigation } from '../../components/utilities/SmartNavigate';
import { getGoogleCalendarLink } from '../../components/utilities/CalendarUtils';
import { Button } from '../../components/Button';
import { EventTypeEnum } from '../../enums/EventTypeEnum';

export default function CalendarPage() {
  const { smartNavigate } = useAdvancedNavigation();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [hoveredEventId, setHoveredEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchCalendarEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/events/joined?page=1&limit=100`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to fetch events");
        return;
      }

      setEvents(data.data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setTimeout(() => setIsLoading(false), 600);
    }
  }, []);

  useEffect(() => {
    fetchCalendarEvents();
  }, [fetchCalendarEvents]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, EventItem[]> = {};
    events.forEach(event => {
      const key = format(parseISO(event.eventDate), 'yyyy-MM-dd');
      if (!map[key]) map[key] = [];
      map[key].push(event);
    });
    return map;
  }, [events]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-blue-background flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="relative"
        >
          <div className="w-20 h-20 border-4 border-purple-main/20 border-t-purple-main rounded-full" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-6 text-white font-inter font-bold tracking-widest uppercase text-sm"
        >
          Loading Calendar...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-background text-white font-inter relative overflow-hidden">
      <div className={`transition-all duration-500 ${selectedEvent ? 'pr-112.5 blur-sm' : 'pr-0'}`}>
        <div className="max-w-7xl mx-auto px-6">
          <header className="flex flex-row justify-between items-center mb-10 gap-6">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-purple-main/20 rounded-3xl border border-purple-main/30">
                <CalendarIcon className="text-purple-main" size={32} />
              </div>
              <div>
                <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
                  Event <span className="text-purple-main">Calendar</span>
                </h1>
                <p className="text-white/20 font-bold uppercase tracking-[0.3em] text-[9px] mt-2">
                  Timeline visualization • {format(currentMonth, 'MMMM yyyy')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/3 p-2 rounded-4xl border border-white/10 backdrop-blur-xl">
              <button 
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white cursor-pointer"
              >
                <ChevronLeft size={24} />
              </button>
              
              <button 
                onClick={() => setCurrentMonth(new Date())}
                className="px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-white/5 hover:bg-white/10 rounded-full transition-all border border-white/5 cursor-pointer"
              >
                Today
              </button>

              <button 
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-3 hover:bg-white/10 rounded-full transition-colors text-white/50 hover:text-white cursor-pointer"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </header>

          <main className="bg-white/2 border border-white/10 rounded-[3rem] overflow-hidden backdrop-blur-md relative">
            <div className="grid grid-cols-7 border-b border-white/5 bg-white/1">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                <div key={d} className="py-4 text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20">{d}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayEvents = eventsByDate[dateKey] || [];
                const isTodayDate = isToday(day);
                const isSelectedMonth = isSameMonth(day, currentMonth);

                return (
                  <div 
                    key={dateKey}
                    className={`
                      min-h-35 p-3 border-r border-b border-white/5 transition-all
                      ${!isSelectedMonth ? 'opacity-10' : 'opacity-100'}
                      ${isTodayDate ? 'bg-purple-main/3' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <span className={`
                        text-sm font-black italic
                        ${isTodayDate ? 'text-purple-main underline decoration-2 underline-offset-4' : 'text-white/30'}
                      `}>
                        {format(day, 'd')}
                      </span>
                    </div>

                    <div className="flex flex-col justify-start gap-1.5">
                      {dayEvents.map((event) => (
                        <button
                          key={event.id}
                          className="relative w-full text-left"
                          onMouseEnter={() => setHoveredEventId(event.id)}
                          onMouseLeave={() => setHoveredEventId(null)}
                          onClick={() => setSelectedEvent(event)}
                        >
                          <AnimatePresence>
                            {hoveredEventId === event.id && (
                              <EventPreviewCard event={event} />
                            )}
                          </AnimatePresence>

                          <div className={`
                            px-2 py-1.5 rounded-xl border text-[9px] font-black uppercase italic truncate tracking-tighter cursor-crosshair transition-all
                            ${event.type === 'voting_event' 
                              ? 'bg-purple-main/10 border-purple-main/20 text-purple-main-light shadow-[0_0_10px_rgba(168,85,247,0.1)]' 
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}
                            ${selectedEvent?.id === event.id ? 'border-white bg-white/10 scale-[1.02]' : ''}
                          `}>
                            {event.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          <footer className="mt-8 flex gap-8 px-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-main shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40 text-nowrap">Voting Session</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white/40 text-nowrap">Standard Session</span>
            </div>
          </footer>
        </div>
      </div>

      <AnimatePresence>
        {selectedEvent && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEvent(null)}
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            />
            
            <motion.aside 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-20 bottom-0 w-112.5 bg-blue-background/95 border-l border-white/10 flex flex-col z-50 shadow-2xl"
            >
              <div className="flex-1 overflow-y-auto custom-sidebar-scroll px-6 pt-5 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="p-4 bg-purple-main/20 rounded-2xl border border-purple-main/30 text-purple-main">
                    <CalendarIcon size={24} />
                  </div>
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="p-2 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-all cursor-pointer"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="h-80 rounded-4xl overflow-hidden border border-white/10 bg-white/5 shrink-0">
                  {selectedEvent.mainImagePath ? (
                    <img src={selectedEvent.mainImagePath} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {selectedEvent.type === EventTypeEnum.VOTING ? (
                        <LayoutList size={200} className="text-purple-main/50 group-hover:text-purple-main/75 transition-all duration-250 ease-in-out" />                          ) : (
                        <HelpCircle size={200} className="text-purple-main/50 group-hover:text-purple-main/75 transition-all duration-250 ease-in-out" />
                      )}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                      {selectedEvent.name}
                    </h2>
                    
                    <div className="min-h-3"> 
                      {selectedEvent.mediaTitles ? (
                        <p className="text-[12px] text-white/40 font-bold italic line-clamp-1">
                          {selectedEvent.mediaTitles}
                        </p>
                      ) : (
                        <p className="text-[12px] text-purple-main/30 font-black uppercase tracking-widest italic">
                          TBD • Content to be determined
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      <Clock size={14} className="text-purple-main" />
                      <span className="text-xs font-bold">{format(parseISO(selectedEvent.eventDate), 'HH:mm')}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      <Users size={14} className="text-purple-main" />
                      <span className="text-xs font-bold">{selectedEvent.currentMembers}/{selectedEvent.maxMembers}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedEvent.visibility === 'public' ? 'bg-green-400' : 'bg-yellow-400'}`} />
                      <span className="text-[10px] font-black uppercase tracking-tight opacity-70">{selectedEvent.visibility.replace('_', ' ')}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                      <span className="text-[10px] font-black uppercase tracking-tight text-purple-main-light">{selectedEvent.status}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 bg-white/5">
                      {selectedEvent.creatorImagePath ? (
                        <img src={selectedEvent.creatorImagePath} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-purple-main/20 text-[10px] font-bold">
                          {selectedEvent.creatorName?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-[8px] font-black uppercase text-white/20 tracking-[0.2em] leading-none mb-1">Organized by</p>
                      <p className="text-xs font-bold italic text-white/80">{selectedEvent.creatorName}</p>
                    </div>
                  </div>
                </div>

                <>
                  <a 
                    href={getGoogleCalendarLink(selectedEvent)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarIcon size={18} className="text-blue-400" />
                      <span className="text-xs font-bold italic text-white/80">Sync to Google Calendar</span>
                    </div>
                    <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </>
              </div>

              <div className="p-7 border-t border-white/5 bg-blue-background/95 backdrop-blur-md">
                <Button 
                  variant="primary"
                  fullWidth
                  showShine
                  size="lg"
                  icon={ExternalLink}
                  onClick={(e) => smartNavigate(`/events/${selectedEvent.id}`, e)}
                  className="italic rounded-2xl!"
                >
                  Go to event details
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}