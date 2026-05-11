import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Clock, List, Pause, Play, RotateCcw, Send, ShieldAlert, Terminal } from 'lucide-react';
import type { Comment } from '../../types/comment';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { formatTime } from '../../components/utilities/FormatTime';
import toast from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { EmptyState } from '../../components/EmptyState';
import type { Timer } from '../../types/timer';
import type { Member } from '../../types/member';
import type { EventMediaRoom } from '../../types/event-media-room';
import { MediaCard } from '../../components/event/MediaCard';
import { PlaylistModal } from '../../components/event/PlayListModal';
import { ConfirmModal } from '../../components/ConfirmModal';

const SOCKET_URL = 'http://localhost:3000';

export default function EventRoom() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [eventStatus, setEventStatus] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [member, setMember] = useState<Member | null>(null);
  const [eventMedia, setEventMedia] = useState<EventMediaRoom[]>([]);

  const [timer, setTimer] = useState<Timer>({ seconds: 0, isActive: false });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEndEventModalOpen, setIsEndEventModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  useEffect(() => {
    if (!id) return;

    const fetchMember = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/members/exists/${id}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
        );

      const contentType = response.headers.get("content-type");
      let data = null;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      }

      if (!response.ok) {
        toast.error(data?.message || 'Failed to fetch user member');
        return;
      }

      if (data) {
        setMember(data);
      }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error';
        toast.error(message);
      } finally {
        setTimeout(() => setIsLoading(false), 400);
      }
    }

    fetchMember();
  }, [id]);

  const fetchEventStatus = useCallback(async () => {
    if (!id) return;
    
    try {
      const response = await fetch(
        `http://localhost:3000/events/status/${id}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      const data = await response.text();

      if (!response.ok) {
        toast.error('Failed to fetch event status');
        return;
      }

      setEventStatus(data as 'waiting' | 'started' | 'finished');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    }
  }, [id]);

  const fetchEventMedia = useCallback(async () => {
    if (!id) return;

    try {
      const response = await fetch(
        `http://localhost:3000/events/room/${id}/media`,
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
        toast.error(data?.message || 'Failed to fetch event media');
        return;
      }

      setEventMedia(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setTimeout(() => setIsLoading(false), 400);
    }
  }, [id]);

  const changeEventStatus = async (start: boolean) => {
    if (!id) return;

    if (!socketRef.current?.connected) return;

    if (start) {
      socketRef.current.emit('start-event', { 
        eventId: Number(id) 
      });
    } else {
      socketRef.current.emit('end-event', { 
        eventId: Number(id) 
      });
    }
  };

  const handleTimerControl = useCallback((action: 'start' | 'pause' | 'reset' | 'update', value?: number) => {
    if (!socketRef.current?.connected) {
      console.warn("Socket not connected, cannot control timer");
      return;
    }

    socketRef.current.emit('timer-control', {
      eventId: Number(id),
      action,
      value
    });
  }, [id]);

  useEffect(() => {
    if (member) {
      fetchEventStatus();
    }
  }, [member, fetchEventStatus]);

  useEffect(() => {
    if (member || eventStatus === 'waiting' || eventStatus === 'started') {
      fetchEventMedia();
    }
  }, [member, fetchEventMedia, eventStatus]);

  useEffect(() => {
    if (!member) return;

    const token = localStorage.getItem('token');
    const socketInstance = io(SOCKET_URL, {
      extraHeaders: { Authorization: `Bearer ${token}` }
    });

    socketRef.current = socketInstance;

    socketInstance.emit('join-event', { eventId: Number(id) });

    socketInstance.on('event-chat', (newComment: Comment) => {
      setComments((prev) => [...prev, newComment]);
    });

    socketInstance.on('timer-update', (timerData: Timer) => {
      setTimer(timerData);
    });

    socketInstance.on('event-status', (status: string) => {
      setEventStatus(status);

      if (status === 'finished') {
        navigate('/');
      } else if (status === 'kicked') {
        setMember(null);
      }
    });

    socketInstance.on('manifest-updated', (updatedItems: EventMediaRoom[]) => {
      setEventMedia((prev) => {
        const newMedia = prev.map((item) => {
          const match = updatedItems.find((u) => u.id === item.id);
          if (match) {
            return { ...item, status: match.status, order: match.order };
          }
          return item;
        });

        return [...newMedia].sort((a, b) => a.order - b.order);
      });
    });

    socketInstance.on('exception', (error: { message: string }) => {
      const errorComment: Comment = {
        username: 'SYSTEM',
        userRole: 'ERROR',
        message: error.message,
        createdAt: new Date().toISOString(),
      };

      toast.error(error.message);
      setComments((prev) => [...prev, errorComment]);
    });

    return () => {
      socketInstance.emit('leave-event', { eventId: Number(id) });
      socketRef.current?.removeAllListeners();
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [id, member, navigate]);

  const previewData = useMemo(() => {
    const current = eventMedia.find(m => m.status === 'current');
    const lastWatched = [...eventMedia]
      .filter(m => ['watched', 'skipped'].includes(m.status))
      .sort((a, b) => b.order - a.order)[0];
    const nextUp = eventMedia
      .filter(m => m.status === 'pending')
      .sort((a, b) => a.order - b.order)[0];

    return { lastWatched, current, nextUp };
  }, [eventMedia]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socketRef.current?.connected) return;
    
    socketRef.current.emit('event-chat', { 
      message, 
      eventId: Number(id) 
    });

    setMessage('');
  };

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const mins = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
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
          Loading Event Room...
        </motion.p>
      </div>
    );
  }

  if (!isLoading && !member) {
    return (
      <div className="w-full h-screen overflow-hidden">
        <EmptyState 
            title="Event doesn't exist or you are not a member"
            description="Please join the event to participate."
            icon={ShieldAlert}
            fullPage={true} 
            showBackButton={true} 
        />
      </div>
    )
  }

  if (!isLoading && (eventStatus === 'voting' || eventStatus === 'finished' || eventMedia.length === 0)) {
    return (
      <div className="w-full h-screen overflow-hidden">
        <EmptyState 
            title="This event as either finished or hasn't started yet"
            description="You are either too late or too soon."
            icon={ShieldAlert}
            fullPage={true} 
            showBackButton={true} 
        />
      </div>
    )
  }

  if (!isLoading && eventStatus === 'waiting') {
    return (
      <div className="w-full h-[85vh] overflow-hidden flex items-center justify-center bg-blue-background">
        {member?.role?.toLowerCase() === 'owner' ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white/2 border border-white/5 rounded-[40px] backdrop-blur-md">
            
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-main animate-pulse" />
                  <span className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">
                    Event Status: Waiting
                  </span>
                </div>
                
                <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter mt-4">
                  READY TO <span className="text-purple-main">START</span>
                </h2>
                
                <p className="text-white/40 text-sm max-w-md mt-2">
                  Click the button below to initialize the event for all participants.
                </p>
              </div>

              <Button 
                variant="primary"
                size="lg"
                showShine={true}
                icon={Play}
                onClick={() => changeEventStatus(true)}
                className="mt-4"
              >
                Start Session
              </Button>

              <div className="flex items-center gap-3 opacity-20 mt-4">
                <div className="w-8 h-px bg-white" />
                <span className="text-[9px] font-black uppercase tracking-widest italic">
                  Authorized Host: {member?.name}
                </span>
                <div className="w-8 h-px bg-white" />
              </div>
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full max-w-3xl mx-auto px-6 text-center">
            <div className="relative mb-10 p-10 bg-white/1 border border-white/5 rounded-[50px] backdrop-blur-2xl">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-purple-main/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(168,85,247,0.15)]">
                  <Clock size={40} className="text-purple-main" />
                </div>

                <div className="space-y-2">
                  <span className="text-purple-main font-black uppercase tracking-[0.4em] text-[10px] italic">
                    Coming Soon
                  </span>
                  <h2 className="text-6xl font-black text-white italic uppercase tracking-tighter leading-none">
                    THE ROOM IS <br />
                    <span className="text-white/20">NOT OPEN YET</span>
                  </h2>
                </div>
              </div>
              
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-purple-main/5 blur-[100px] rounded-full" />
            </div>

            <div className="max-w-md">
              <p className="text-white/50 text-lg font-medium leading-relaxed">
                You're early! This event is scheduled, but the host hasn't opened the doors to the room yet.
              </p>

              <p className="mt-6 text-white/20 text-sm italic">
                Once the countdown ends and the host starts the session, 
                this page will transform into the live experience.
              </p>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4">
              <Button 
                variant="secondary" 
                size="md" 
                onClick={() => window.history.back()}
                className="text-white/60 hover:text-white"
              >
                Return
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-start gap-8 ml-9 h-[85vh] w-[calc(100vw-100px)]">
      <div className="flex flex-col h-full w-[45vh] bg-white/2 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md shrink-0">
        <div className="p-4 border-b border-white/5 bg-white/2 flex justify-between items-center shrink-0">
          <div className="flex flex-col border-l-2 border-purple-main pl-3">
            <h2 className="text-sm font-black text-white italic uppercase tracking-tighter flex items-center gap-2">
              <Terminal size={16} className="text-purple-main" />
              Live <span className="text-purple-main/60">Chat</span>
            </h2>
          </div>
        </div>

        <div 
          ref={scrollRef} 
          className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scroll-smooth"
        >
          {comments.map((comment, index) => {
            const isUser = comment.username === member?.name;
            const isError = comment.userRole === 'ERROR';
            const isSystem = comment.username === 'SYSTEM';
            const isNotice = comment.userRole === 'NOTICE';

            return (
              <div 
                key={index} 
                className={`group flex flex-col px-4 py-2.5 rounded-xl transition-all duration-300 ${
                  isUser 
                    ? 'bg-purple-main/10 border-l-2 border-purple-main/50' 
                    : isError 
                    ? 'bg-red-danger/5 border-l-2 border-red-danger/50'
                    : isNotice
                    ? 'bg-amber-500/5 border-l-2 border-amber-500/50 italic'
                    : 'hover:bg-white/3 border-l-2 border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[11px] font-black uppercase italic tracking-wider shrink-0 ${
                    isUser 
                      ? 'text-white' 
                      : isError
                      ? 'text-red-danger' 
                      : isNotice 
                      ? 'text-amber-400' 
                      : 'text-purple-main'
                  }`}>
                    {isUser ? 'You' : isSystem ? 'System' : comment.username}
                  </span>

                  {(!isSystem || isNotice) && (
                    <span className={`text-[8px] px-1.5 py-0.5 font-bold rounded uppercase italic shrink-0 border ${
                      isUser 
                        ? 'bg-purple-main/20 border-purple-main/30 text-purple-200' 
                        : isNotice
                        ? 'bg-amber-500/20 border-amber-500/30 text-amber-200'
                        : 'bg-white/5 border-white/10 text-white/30'
                    }`}>
                      {comment.userRole}
                    </span>
                  )}

                  <span className="text-[9px] font-mono ml-auto opacity-30">
                    {formatTime(comment.createdAt)}
                  </span>
                </div>

                <p className={`text-sm leading-relaxed ${
                  isError 
                    ? 'text-red-200/60 italic' 
                    : isNotice 
                    ? 'text-amber-100/70' 
                    : isUser 
                    ? 'text-white' 
                    : 'text-white/80'
                }`}>
                  {comment.message}
                </p>
              </div>
            );
          })}
        </div>

        <form onSubmit={sendMessage} className="p-4 bg-white/2 border-t border-white/5 flex gap-2 items-center shrink-0">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type message..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-medium text-white focus:outline-none focus:border-purple-main/40 transition-all placeholder:text-white/10"
          />
          <Button
            type="submit"
            variant="solid-accent"
            size="sm"
            icon={Send}
            className="pr-1.5 w-11! h-11! rounded-xl!" 
            disabled={!message.trim()}
          />
        </form>
      </div>

      <div className="flex-1 h-full flex flex-col gap-5">
        <div className="flex-1 relative bg-white/2 border border-white/5 rounded-[40px] p-12 backdrop-blur-md shadow-2xl overflow-hidden flex flex-col justify-center items-center">
          
          <div className={`absolute inset-0 transition-colors duration-1000 -z-10 ${timer.isActive ? 'bg-green-500/3' : 'bg-transparent'}`} />
          <div className={`absolute top-0 right-0 w-150 h-150 blur-[150px] transition-colors duration-1000 -z-10 ${timer.isActive ? 'bg-green-500/10' : 'bg-purple-main/5'}`} />

          <div className="flex flex-col items-center justify-center flex-1">
            <div className="relative group">
              <div className={`absolute inset-0 blur-[100px] opacity-30 transition-colors duration-1000 ${timer.isActive ? 'bg-green-400' : 'bg-purple-main/20'}`} />
              
              <span className="relative text-[15rem] leading-none font-mono font-black text-white tracking-tighter tabular-nums select-none drop-shadow-[0_10px_50px_rgba(0,0,0,0.5)]">
                {formatTimer(timer.seconds)}
              </span>
            </div>
            
            <div className="flex items-center gap-4 mt-6">
              <div className={`w-3 h-3 rounded-full ${timer.isActive ? 'bg-green-400 animate-pulse shadow-[0_0_15px_rgba(74,222,128,0.5)]' : 'bg-white/10'}`} />
              <p className="text-sm font-black text-white/20 uppercase tracking-[1.5em] ml-4">
                {timer.isActive ? 'Session Active' : 'Session Paused'}
              </p>
            </div>
          </div>

          <div className="w-full mt-8">
            {member?.role?.toLowerCase() === 'owner' && (
              <div className="flex flex-col gap-6">
                
                <div className="flex items-center gap-6">
                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent" />
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {[300, 60, 30, 10].map((seconds) => (
                        <button 
                          key={`minus-${seconds}`}
                          onClick={() => handleTimerControl('update', -seconds)}
                          className="px-3 py-1.5 bg-white/2 hover:bg-red-danger/10 border border-white/5 rounded-lg text-2xs font-black text-white/20 hover:text-red-danger transition-all uppercase tracking-tighter cursor-pointer"
                        >
                          -{seconds >= 60 ? `${seconds/60}m` : `${seconds}s`}
                        </button>
                      ))}
                    </div>

                    <div className="w-px h-4 bg-white/10" />

                    <div className="flex items-center gap-2">
                      {[10, 30, 60, 300].map((seconds) => (
                        <button 
                          key={`plus-${seconds}`}
                          onClick={() => handleTimerControl('update', seconds)}
                          className="px-3 py-1.5 bg-white/2 hover:bg-green-400/10 border border-white/5 rounded-lg text-2xs font-black text-white/20 hover:text-green-400 transition-all uppercase tracking-tighter cursor-pointer"
                        >
                          +{seconds >= 60 ? `${seconds/60}m` : `${seconds}s`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-px flex-1 bg-linear-to-r from-transparent via-white/10 to-transparent" />
                </div>

                <div className="flex flex-col gap-4">
                  <AnimatePresence mode="wait">
                    {member?.role?.toLowerCase() === 'owner' && eventStatus === 'waiting' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2 px-2"
                      >
                        <div className="w-1.5 h-1.5 bg-purple-main rounded-full animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        <span className="text-[10px] font-black text-purple-main/80 uppercase tracking-[0.25em] italic">
                          Press to start the event
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {!timer.isActive ? (
                        <Button 
                          onClick={() => handleTimerControl('start')}
                          variant="solid-accent" 
                          className="h-20! px-12! bg-green-500/10! border-green-500/20! text-green-400! hover:bg-green-500/20! text-sm font-black italic tracking-widest rounded-2xl! shadow-[0_0_30px_rgba(74,222,128,0.05)]"
                          icon={Play}
                        > 
                          START
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => handleTimerControl('pause')}
                          variant="solid-accent" 
                          className="h-20! px-12! bg-yellow-500/10! border-yellow-500/20! text-yellow-400! hover:bg-yellow-500/20! text-sm font-black italic tracking-widest rounded-2xl!"
                          icon={Pause}
                        > 
                          PAUSE 
                        </Button>
                      )}
                      
                      <Button 
                        onClick={() => handleTimerControl('reset')}
                        variant="ghost" 
                        className="h-20! px-8! border-white/5! text-white/20 hover:text-red-danger! hover:bg-red-danger/5! text-xs font-black rounded-2xl!"
                        icon={RotateCcw}
                      > 
                        RESET 
                      </Button>

                      <div className="w-px h-16 bg-white/5 mx-2" />
  
                      <Button 
                        onClick={() => setIsEndEventModalOpen(true)}
                        variant="solid-error" 
                        className="h-20! px-10! text-xs font-black rounded-2xl!"
                        icon={ShieldAlert}
                      >
                        FINISH EVENT
                      </Button>
                    </div>

                    <div className="flex items-center gap-6 pl-8 border-l border-white/5">
                      <div className="text-right">
                        <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] block mb-0.5">Authorized</span>
                        <span className="text-xl font-black text-white italic uppercase tracking-tighter">
                          {member?.name}
                        </span>
                      </div>
                      <div className="h-12 w-1 bg-purple-main shadow-[0_0_15px_rgba(168,85,247,0.5)] rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-auto w-full bg-black/40 border rounded-[30px] border-white/5 backdrop-blur-md shrink-0 overflow-hidden">
          <div className="px-8 py-4 flex justify-between items-center border-b border-white/5 bg-white/2">
            <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Timeline Preview</h3>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center gap-2 px-4 py-1.5 bg-purple-main/10 hover:bg-purple-main text-purple-main hover:text-black rounded-lg border border-purple-main/20 transition-all duration-300 text-[10px] font-bold uppercase cursor-pointer"
            >
              <List size={14} /> Full List
            </button>
          </div>

          <div className="grid grid-cols-3 divide-x divide-white/5 items-start">
            
            <div className="p-6 flex flex-col gap-4">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] px-2">
                Recently Finished
              </span>
              {previewData.lastWatched ? (
                <MediaCard media={previewData.lastWatched} />
              ) : (
                <div className="h-24 border border-dashed border-white/5 rounded-2xl flex items-center justify-center bg-white/1">
                  <span className="text-[8px] text-white/10 font-bold uppercase tracking-widest">History Empty</span>
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col gap-4 bg-purple-main/1">
              <span className="text-[8px] font-black text-purple-main uppercase tracking-[0.4em] px-2 animate-pulse">
                Now Playing
              </span>
              {previewData.current ? (
                <MediaCard media={previewData.current} />
              ) : (
                <div className="h-24 border border-dashed border-purple-main/10 rounded-2xl flex items-center justify-center">
                  <span className="text-[8px] text-purple-main/20 font-bold uppercase tracking-widest">Standby Mode</span>
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col gap-4">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.3em] px-2">
                Coming Up Next
              </span>
              <div className="flex flex-col gap-3">
                {previewData.nextUp ? (
                  <MediaCard media={previewData.nextUp} isNext={true} />
                ) : (
                  <div className="h-24 border border-dashed border-white/5 rounded-2xl flex items-center justify-center bg-white/1">
                    <span className="text-[8px] text-white/10 font-bold uppercase tracking-widest">End of Queue</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PlaylistModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        media={eventMedia}
        socketRef={socketRef}
        eventId={id}
        isOwner={member?.role === "owner"}
      />

      <ConfirmModal
        isOpen={isEndEventModalOpen}
        onClose={() => setIsEndEventModalOpen(false)}
        onConfirm={() => changeEventStatus(false)}
        title="End Event"
        description="You are about to end this event. All participants will be redirected out of the event in 10 seconds. Are you sure?"
        confirmText="Yes, End"
        cancelText="Not yet"
        variant="danger"
      />
    </div>
  );
}