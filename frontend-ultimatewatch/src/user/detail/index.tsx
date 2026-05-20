import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import type { ExternalUserProfile } from "../../types/external-user-profile";
import { useParams } from "react-router-dom";
import type { EventItem } from "../../types/event-item";
import type { UserMetrics } from "../../types/user-metrics";
import { Activity, Calendar, Users } from "lucide-react";
import { EmptyState } from "../../components/EmptyState";
import { useAdvancedNavigation } from "../../components/utilities/SmartNavigate";

export default function UserDetail() {
  const { smartNavigate } = useAdvancedNavigation();
  const { username } = useParams();

  const [user, setUser] = useState<ExternalUserProfile | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [metrics, setMetrics] = useState<UserMetrics>({
    createdEvents: 0,
    votes: 0,
    messages: 0
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
      const response = await fetch(`http://localhost:3000/users/profile/${username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to fetch user');
        return;
      }

      setUser(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    fetchUser();
  }, [username]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/events/created/${user?.id}?limit=3`,
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
          toast.error(data.message || "Failed to fetch events");
          return;
        }

        setEvents(data.data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error';
        toast.error(message);
      }
    };

    const getUserStatistics = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/event-metrics/user/${user?.id}`,
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
          toast.error(data.message || "Failed to retrieve event statistics");
          return;
        }

        setMetrics(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error';
        toast.error(message);
      }
    }

    if (user) {
      fetchEvents();
      getUserStatistics();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-blue-background flex flex-col items-center justify-center">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
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
          className="mt-6 text-white font-inter font-bold tracking-widest uppercase text-sm"
        >
          Loading Profile...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-blue-background flex justify-start items-start overflow-x-hidden p-10 gap-10">
      <div className="relative w-1/3 h-fit flex flex-col justify-start items-center">
        <div className="relative w-full flex flex-col justify-start items-center">
          <img 
            className="mb-2 w-65 h-auto shadow-2xl object-cover border-4 rounded-full border-white/10 transition-all duration-300 group-hover:opacity-70" 
            src={user?.imagePath || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
            alt="Profile" 
          />
          <h2 className="relative text-4xl text-white font-bold font-inter">{user?.username || 'Guest'}</h2>
        </div>
      </div>

      <div className="relative w-2/3 flex flex-col justify-start items-start gap-10">
        <div className="w-full">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
            <Activity size={14} className="text-purple-main" /> Platform Statistics
          </h3>
          <div className="grid grid-cols-3 gap-6 w-full">
            <div className="relative overflow-hidden bg-white/1 border border-white/3 rounded-xl p-5 group hover:border-white/10 transition-colors">
              <p className="text-3xl font-black tracking-tight text-white">
                {metrics?.createdEvents ?? 0}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mt-1 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-purple-main" /> 
                Events Hosted
              </p>
            </div>

            <div className="relative overflow-hidden bg-white/1 border border-white/3 rounded-xl p-5 group hover:border-white/10 transition-colors">
              <p className="text-3xl font-black tracking-tight text-white">
                {metrics?.votes ?? 0}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mt-1 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-emerald-400" /> 
                Votes Cast
              </p>
            </div>

            <div className="relative overflow-hidden bg-white/1 border border-white/3 rounded-xl p-5 group hover:border-white/10 transition-colors">
              <p className="text-3xl font-black tracking-tight text-white">
                {metrics?.messages ?? 0}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 mt-1 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-blue-400" /> 
                Messages Sent
              </p>
            </div>
          </div>
        </div>

        <div className="w-full">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4 flex items-center gap-2">
            <Calendar size={14} className="text-purple-main" /> Created Events
          </h3>
          
          <div className="flex flex-col gap-4 w-full">
            {events.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyState title="No events created yet" description="This user has yet to create a publicly accessible event" fullPage={false} showBackButton={false} />
              </motion.div>
            ) : (
              events.map((event) => {
                const isStarted = event.status === 'started';
                const isVoting = event.status === 'voting';
                
                const theme = isStarted 
                  ? { border: 'border-purple-main/30 hover:border-purple-main/50', badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20' }
                  : isVoting 
                    ? { border: 'border-blue-500/20 hover:border-blue-500/40', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' }
                    : { border: 'border-white/5 hover:border-white/10', badge: 'bg-white/5 text-white/40 border-white/10' };

                const defaultCover = "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=500&auto=format&fit=crop";
                const coverImage = event.mainImagePath || defaultCover;

                return (
                  <div 
                    key={event.id}
                    className={`relative flex h-36 w-full overflow-hidden bg-white/1 border ${theme.border} rounded-xl transition-all duration-300 group cursor-pointer`}
                    onClick={(e) => smartNavigate(`/events/${event.id}`, e)}
                  >
                    <div className="relative w-28 md:w-36 h-full overflow-hidden bg-zinc-900 shrink-0">
                      <img 
                        src={coverImage} 
                        alt={event.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-linear-to-r from-transparent via-transparent to-blue-background" />
                    </div>

                    <div className="flex flex-col justify-between flex-1 p-4 pl-2 min-w-0">
                      
                      <div className="flex items-center justify-between gap-4">
                        <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${theme.badge}`}>
                          {event.status}
                        </span>
                        <span className="text-[10px] font-medium text-white/30 uppercase tracking-wider">
                          {event.visibility.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="my-1">
                        <h4 className="text-base font-bold text-white tracking-tight group-hover:text-purple-main transition-colors truncate">
                          {event.name}
                        </h4>
                        {event.mediaTitles && (
                          <p className="text-xs text-white/40 truncate mt-0.5">
                            {event.mediaTitles}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-white/3 flex items-center justify-between text-[11px] text-white/50">
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={event.creatorImagePath} 
                            className="w-4 h-4 rounded-full border border-white/10 object-cover shrink-0" 
                            alt={event.creatorName} 
                          />
                          <span className="truncate text-white/40">
                            by <strong className="text-white/80 font-semibold">{event.creatorName}</strong>
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-white/40 font-medium shrink-0">
                          <Users size={11} className="text-white/20" />
                          <span>{event.currentMembers}/{event.maxMembers}</span>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}