import { CheckCircle2, SkipForward, Activity } from 'lucide-react';
import type { EventMediaRoom } from '../../types/event-media-room';

interface MediaCardProps {
  media: EventMediaRoom;
  isNext?: boolean;
}

export function MediaCard({ media, isNext }: MediaCardProps) {
  const isCurrent = media.status === 'current';
  const isWatched = media.status === 'watched';
  const isSkipped = media.status === 'skipped';
  
  const isEpisode = media.type === 'episode';

  return (
    <div className={`group relative flex items-center gap-5 p-2 pr-6 rounded-2xl transition-all duration-300 w-full min-w-87.5 ${
      isCurrent 
        ? 'bg-white/3 shadow-lg shadow-black/20' 
        : 'hover:bg-white/2'
    }`}>
      
      <div className={`relative shrink-0 overflow-hidden rounded-xl bg-white/5 border border-white/5 transition-all duration-500 ${
        isEpisode 
          ? 'w-32 h-20'
          : 'w-16 h-24'
      }`}>
        <img 
          src={media.imagePath} 
          alt={media.title} 
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            (isWatched || isSkipped) ? 'opacity-20' : 'opacity-100'
          }`}
        />
        
        {isCurrent && (
          <div className="absolute inset-0 bg-purple-main/20 flex items-center justify-center">
            <Activity size={isEpisode ? 24 : 20} className="text-white animate-pulse" />
          </div>
        )}
        
        {(isWatched || isSkipped) && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
             {isWatched ? <CheckCircle2 size={24} className="text-white/40" /> : <SkipForward size={24} className="text-white/40" />}
          </div>
        )}

        {isNext && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-purple-main rounded-sm text-[7px] font-black text-black uppercase tracking-widest">
            Next
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[10px] font-mono font-bold text-white/20">
            {String(media.order + 1).padStart(2, '0')}
          </span>
          
          <span className='text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/40'>
            {media.type === 'tv' ? 'Series' : media.type}
          </span>
        </div>

        <h4 className={`text-sm font-bold truncate transition-colors ${
          (isWatched || isSkipped) ? 'text-white/20 line-through' : 'text-white/90'
        }`}>
          {media.title}
        </h4>

        {isCurrent && (
          <p className="text-[9px] font-black text-purple-main uppercase tracking-widest mt-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-main animate-ping" />
            Playing now
          </p>
        )}
      </div>

      {isCurrent && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-0.5 bg-purple-main shadow-[0_0_10px_#a855f7]" />
      )}
    </div>
  );
}