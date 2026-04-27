import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Send, ShieldAlert, Terminal } from 'lucide-react';
import type { Comment } from '../../types/comment';
import { useParams } from 'react-router-dom';
import { Button } from '../../components/Button';
import { formatTime } from '../../components/utilities/FormatTime';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { EmptyState } from '../../components/EmptyState';

const SOCKET_URL = 'http://localhost:3000';

export default function EventRoom() {
  const { id } = useParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [isMember, setIsMember] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const currentUser = (() => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user).username : null;
    } catch {
      return null;
    }
  })();

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

      const data = await response.json();

      setIsMember(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error';
        toast.error(message);
      } finally {
        setTimeout(() => setIsLoading(false), 400);
      }
    }

    fetchMember();

    const token = localStorage.getItem('token');
    const socketInstance = io(SOCKET_URL, {
      extraHeaders: { Authorization: `Bearer ${token}` }
    });

    socketRef.current = socketInstance;

    socketInstance.emit('joinEvent', { eventId: Number(id) });

    socketInstance.on('event-chat', (newComment: Comment) => {
      setComments((prev) => [...prev, newComment]);
    });

    socketInstance.on('exception', (error: { message: string }) => {
      const errorComment: Comment = {
        username: 'SYSTEM',
        userRole: 'ERROR',
        message: error.message,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, errorComment]);
    });

    return () => {
      socketInstance.emit('leaveEvent', { eventId: Number(id) });
      socketInstance.off('event-chat');
      socketInstance.off('exception');
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !socketRef.current?.connected) return;
    
    socketRef.current.emit('event-chat', { 
      message, 
      eventId: Number(id) 
    });

    setMessage('');
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

  if (!isLoading && !isMember) {
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
    <div className="ml-9 flex flex-col h-175 w-100 bg-white/2 border border-white/5 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-md">
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
          const isUser = comment.username === currentUser;
          const isError = comment.userRole === 'ERROR';
          const isSystem = comment.username === 'SYSTEM';

          return (
            <div 
              key={index} 
              className={`group flex flex-col px-4 py-2.5 rounded-xl transition-all duration-300 ${
                isUser 
                ? 'bg-purple-main/10 border-l-2 border-purple-main/50 shadow-[inset_0_0_20px_rgba(168,85,247,0.02)]' 
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
                <span className="text-[9px] font-mono ml-auto">
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
          className="flex-1 bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm font-medium text-white focus:outline-none focus:border-purple-main/40 transition-all placeholder:text-white/10 disabled:opacity-30"
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
  );
}