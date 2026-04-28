import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Pause, Play, RotateCcw, Send, ShieldAlert, Terminal } from 'lucide-react';
import type { Comment } from '../../types/comment';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { formatTime } from '../../components/utilities/FormatTime';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { EmptyState } from '../../components/EmptyState';
import type { Timer } from '../../types/timer';
import type { Member } from '../../types/member';

const SOCKET_URL = 'http://localhost:3000';

export default function EventRoom() {
  const { id } = useParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [member, setMember] = useState<Member | null>(null);

  const [timer, setTimer] = useState<Timer>({ seconds: 0, isActive: false });

  const [isLoading, setIsLoading] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

    useEffect(() => {
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
        toast.error(data?.message || `Error: ${response.status}`);
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

  useEffect(() => {
    if (!member) return;

    const token = localStorage.getItem('token');
    const socketInstance = io(SOCKET_URL, {
      extraHeaders: { Authorization: `Bearer ${token}` }
    });

    socketRef.current = socketInstance;

    socketInstance.emit('joinEvent', { eventId: Number(id) });

    socketInstance.on('event-chat', (newComment: Comment) => {
      setComments((prev) => [...prev, newComment]);
    });

    socketInstance.on('timer-update', (timerData: Timer) => {
      setTimer(timerData);
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
      socketInstance.emit('leaveEvent', { eventId: Number(id) });
      socketInstance.off('event-chat');
      socketInstance.off('timer-update');
      socketInstance.off('exception');
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [id, member]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socketRef.current?.connected) return;
    
    socketRef.current.emit('event-chat', { 
      message, 
      eventId: Number(id) 
    });

    setMessage('');
  };

  const handleTimerControl = (action: 'start' | 'pause' | 'reset' | 'update', value?: number) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('timer-control', {
      eventId: Number(id),
      action,
      value
    });
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
            title="You are not a member of this event"
            description="Please join the event to participate in the chat."
            icon={ShieldAlert}
            fullPage={true} 
            showBackButton={true} 
        />
      </div>
    )
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

          return (
            <div 
              key={index} 
              className={`group flex flex-col px-4 py-2.5 rounded-xl transition-all duration-300 ${
                isUser 
                ? 'bg-purple-main/10 border-l-2 border-purple-main/50' 
                : isError 
                ? 'bg-red-danger/5 border-l-2 border-red-danger/50'
                : 'hover:bg-white/3 border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[11px] font-black uppercase italic tracking-wider shrink-0 ${
                  isUser ? 'text-white' : isError ? 'text-red-danger' : 'text-purple-main'
                }`}>
                  {isUser ? 'You' : comment.username}
                </span>
                {!isSystem && (
                  <span className={`text-[8px] px-1.5 py-0.5 font-bold rounded uppercase italic shrink-0 border ${
                    isUser 
                    ? 'bg-purple-main/20 border-purple-main/30 text-purple-200' 
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
                isError ? 'text-red-200/60 italic' : isUser ? 'text-white' : 'text-white/80'
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

    <div className="flex-1 h-full flex flex-col">
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

        <div className="w-full mt-auto">
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

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {!timer.isActive ? (
                    <Button 
                      onClick={() => handleTimerControl('start')}
                      variant="solid-accent" 
                      className="h-20! px-12! bg-green-500/10! border-green-500/20! text-green-400! hover:bg-green-500/20! text-sm font-black italic tracking-widest rounded-2xl! shadow-[0_0_30px_rgba(74,222,128,0.05)]"
                      icon={Play}
                    > START </Button>
                  ) : (
                    <Button 
                      onClick={() => handleTimerControl('pause')}
                      variant="solid-accent" 
                      className="h-20! px-12! bg-yellow-500/10! border-yellow-500/20! text-yellow-400! hover:bg-yellow-500/20! text-sm font-black italic tracking-widest rounded-2xl!"
                      icon={Pause}
                    > PAUSE </Button>
                  )}
                  
                  <Button 
                    onClick={() => handleTimerControl('reset')}
                    variant="ghost" 
                    className="h-20! px-8! border-white/5! text-white/20 hover:text-red-danger! hover:bg-red-danger/5! text-xs font-black rounded-2xl!"
                    icon={RotateCcw}
                  > RESET </Button>
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
          )}
        </div>
      </div>
    </div>
  </div>
);
}