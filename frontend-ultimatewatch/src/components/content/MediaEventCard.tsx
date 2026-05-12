import { motion } from 'framer-motion';
import type { EnhancedEvent } from '../../types/voting-event';
import type { MediaEvent } from '../../types/media-event';
import { Button } from '../Button';
import type { SubMediaEvent } from '../../types/sub-media-event';
import { useAdvancedNavigation } from '../utilities/SmartNavigate';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { X } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';

interface MediaEventCardProps {
  media: MediaEvent;
  event: EnhancedEvent;
  isMember: boolean;
  votedMediaIds: number[];
  onEventUpdate?: () => void;
  isOwner: boolean;
}

export const MediaEventCard = ({
  media: m,
  event,
  isMember,
  votedMediaIds,
  onEventUpdate = () => {},
  isOwner,
}: MediaEventCardProps) => {
  const { smartNavigate } = useAdvancedNavigation();

  const [isVoteLoading, setIsVoteLoading] = useState(false);

  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [isRemoveMediaModalOpen, setIsRemoveMediaModalOpen] = useState(false);

  const isVoting = event.status === 'voting';
  const hasSubMedia = m.subMediaEvent && m.subMediaEvent.length > 0;

  const handleVote = async (mediaId: number, eventId: number) => {
    if (
      !votedMediaIds.includes(mediaId) && 
      event?.type === 'voting_event' && 
      event.maxVotesPerMember && 
      votedMediaIds.length >= event.maxVotesPerMember
    ) {
      toast.error(`You can only vote for ${event.maxVotesPerMember} ${event.maxVotesPerMember === 1 ? 'option' : 'options'}`);
      return;
    }

    setIsVoteLoading(true);
    const method = votedMediaIds.includes(mediaId) ? 'DELETE' : 'POST';

    try {
      const response = await fetch(`http://localhost:3000/votes`, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          eventId: eventId,
          mediaId: mediaId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to process vote request");
        setIsVoteLoading(false)
        return;
      }

      toast.success(data.message);
      
      onEventUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error ocurred';
      toast.error(message);
    } finally {
      setTimeout(() => setIsVoteLoading(false), 250);
    }
  };

  const removeMedia = async () => {
    try {
      const response = await fetch(`http://localhost:3000/events/remove/${event.id}/${selectedMediaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to remove media");
        return;
      }

      toast.success(data.message);
      
      onEventUpdate();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error ocurred';
      toast.error(message);
    } finally {
      setSelectedMediaId(null);
    }
  };

  const renderVoteButton = (id: number) => (
    <Button
      variant="secondary"
      className={`
        w-auto! h-10 px-8 text-[10px] font-black uppercase transition-all 
        flex items-center justify-center group/vote active:translate-y-0.5 rounded-lg!
        ${votedMediaIds.includes(id)
          ? 'bg-amber-400/10 border-amber-400/40 text-amber-400 hover:bg-red-500! hover:text-black! hover:border-red-500!'
          : 'bg-white/5 border-white/10 text-white/60 hover:bg-amber-400! hover:text-black! hover:border-amber-400!'
        }
      `}
      onClick={() => handleVote(id, event.id)}
      disabled={isVoteLoading}
    >
      <span className="hidden group-hover/vote:block">
        {votedMediaIds.includes(id) ? 'REMOVE VOTE' : 'CONFIRM VOTE'}
      </span>
      <span className="group-hover/vote:hidden tracking-widest flex items-center gap-2">
        {votedMediaIds.includes(id) && <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />}
        {votedMediaIds.includes(id) ? 'VOTED' : 'SELECT'}
      </span>
    </Button>
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative flex flex-col bg-white/2 border border-white/5 rounded-sm shadow-2xl overflow-hidden"
    >
      <div
        className="flex items-stretch bg-white/3 border border-white/5 cursor-pointer hover:border-purple-main/50"
        onClick={(e) => smartNavigate(`/${m.type === "movie" ? "movies" : "series"}/${m.id}`, e)}
      >
        <div className="relative w-20 h-32 shrink-0 bg-black">
          <img src={m.imagePath} className="w-full h-full object-cover" alt={m.title} />
        </div>

        <div className="flex flex-1 flex-col justify-center px-6 relative">
          <div className="flex items-center gap-4 mb-1">
            <span className={`text-[8px] font-black px-1.5 py-0.5 uppercase rounded-sm ${isVoting ? 'bg-amber-400 text-black' : 'bg-purple-main text-white'}`}>
              {m.type === "tv" ? "SERIES" : m.type?.toUpperCase()}
            </span>

            {isVoting && (
              <span className="text-amber-400 font-mono text-[9px] font-black tracking-widest">
                {m.isVotable ? m.count ?? 0 : 'NOT A VOTING OPTION. ADD IT!'} {m.isVotable ? m.count === 1 ? 'VOTE' : 'VOTES' : ''}
              </span>
            )}
          </div>

          <h4 className="flex text-lg font-black uppercase tracking-tighter text-white leading-none truncate max-w-[70%]">
            {m.title}
          </h4>

          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-6">
              {(event.status === 'voting' || event.status === 'waiting') && isOwner && (!m.isVotable || m.isVotable === true) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedMediaId(m.id);
                    setIsRemoveMediaModalOpen(true);
                  }}
                  className="w-10 h-10 flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:bg-red-500 hover:text-black hover:border-red-500 transition-all active:translate-y-0.5 rounded-lg cursor-pointer"
                  title="Remove"
                >
                  <X size={16} strokeWidth={3} />
                </button>
              )}

              {isVoting && isMember && m.isVotable && (
                <div 
                  onClick={(e) => e.stopPropagation()} 
                  className="inline-block"
                >
                  {renderVoteButton(m.id)}
                </div>
              )}
            </div>
        </div>
      </div>

      {hasSubMedia && (
        <div className={`flex flex-col p-3 gap-2 bg-black/60 ${isVoting ? 'border-t-2 border-amber-400/30' : ''}`}>
          {m.subMediaEvent!.map((sub: SubMediaEvent, sIdx: number) => {
            const isSeason = sub.type === 'season';
            const imgContainerClass = isSeason ? "w-20 h-32" : "w-48 h-24";

            return (
              <div
                key={sIdx}
                className={`group relative flex items-stretch bg-white/3 hover:bg-white/8 transition-all border border-transparent overflow-hidden ${isVoting ? 'hover:border-amber-400/50' : 'hover:border-purple-main/30'
                  }`}
              >
                <div className={`${imgContainerClass} overflow-hidden shrink-0 border-r border-white/10 relative`}>
                  <img src={sub.imagePath} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all" alt={sub.title} />
                </div>

                <div className="flex flex-1 items-center justify-between px-6 py-4">
                  <div className="flex flex-col min-w-0 pr-4">
                    <div className="flex items-center gap-3 mb-1">
                      <p className={`text-[7px] font-black uppercase tracking-widest ${isVoting ? 'text-amber-400' : 'text-purple-main'}`}>
                        {sub.type?.toUpperCase()}
                      </p>
                      {isVoting && (
                        <span className="text-[9px] font-mono font-bold text-white/40 tracking-tighter uppercase">
                          {sub.count} {sub.count === 1 ? 'VOTE' : 'VOTES'}
                        </span>
                      )}
                    </div>
                    <h5 className={`font-black text-white/90 uppercase leading-none truncate ${isSeason ? 'text-sm' : 'text-xs'}`}>
                      {sub.title}
                    </h5>
                  </div>

                  <div className="flex items-center gap-6">
                    {(event.status === 'voting' || event.status === 'waiting') && isOwner && (
                      <button
                        title="Remove"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 transition-all hover:border-red-500 hover:bg-red-500 hover:text-black active:translate-y-0.5 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMediaId(sub.id);
                          setIsRemoveMediaModalOpen(true);
                        }}
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    )}

                    {isVoting && isMember && (
                      <div 
                        className="inline-block" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderVoteButton(sub.id)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={isRemoveMediaModalOpen}
        onClose={() => {
          setSelectedMediaId(null);
          setIsRemoveMediaModalOpen(false)
        }}
        onConfirm={removeMedia}
        title="Delete Media"
        description="You are about to remove the selected media from the event. Continue?"
        confirmText="Yes, Remove"
        cancelText="Don't Remove"
        variant="accent"
      />
    </motion.div>
  );
};