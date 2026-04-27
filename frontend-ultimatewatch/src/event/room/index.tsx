import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Comment } from '../../types/comment';
import { useParams } from 'react-router-dom';
import { formatDate } from '../../components/utilities/FormatDate';

const SOCKET_URL = 'http://localhost:3000';

export default function EventRoom() {
  const { id } = useParams();
  const [comments, setComments] = useState<Comment[]>([]);
  const [message, setMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const socketRef = useRef<Socket | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Creamos la instancia
    const socketInstance = io(SOCKET_URL, {
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      setIsConnected(true);
      socketInstance.emit('joinEvent', { eventId: Number(id) });
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    socketInstance.on('event-chat', (newComment: Comment) => {
      setComments((prev) => [...prev, newComment]);
    });

    socketInstance.on('exception', (err: { message: string }) => {
      const errorComment: Comment = {
        username: 'SYSTEM',
        userRole: 'ERROR',
        message: `${err.message}`,
        createdAt: new Date().toISOString(),
      };
      setComments((prev) => [...prev, errorComment]);
    });

    return () => {
      socketInstance.off('event-chat');
      socketInstance.off('exception');
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.disconnect();
      socketRef.current = null;
    };
  }, [id]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    const socket = socketRef.current;

    if (!message.trim() || !socket?.connected) return;

    socket.emit('event-chat', {
      message: message,
      eventId: Number(id)
    });

    setMessage('');
  };

  return (
    <div className="fixed inset-0 bg-blue-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl flex flex-col h-[80vh]">
        
        <div className="p-4 border-b bg-gray-50 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Event Room Chat</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {comments.map((comment, index) => {
            const isError = comment.userRole === 'ERROR';
            return (
              <div key={index} className={`flex flex-col ${isError ? 'animate-pulse' : ''}`}>
                <div className="flex items-baseline space-x-2">
                  <span className={`font-bold ${isError ? 'text-red-600' : 'text-blue-600'}`}>{comment.username}</span>
                  <span className={`text-[10px] uppercase font-bold px-1 rounded ${isError ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                    {comment.userRole}
                  </span>
                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className={`mt-1 p-2 rounded-r-lg rounded-bl-lg border-l-2 ${isError ? 'bg-red-50 text-red-800 border-red-500 italic' : 'bg-gray-50 text-gray-700 border-blue-200'}`}>
                  {comment.message}
                </p>
              </div>
            );
          })}
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t flex gap-2 bg-gray-50 rounded-b-lg">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isConnected ? "Type a message..." : "Connecting..."}
            disabled={!isConnected}
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:bg-gray-200"
          />
          <button
            type="submit"
            disabled={!isConnected || !message.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-full font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}