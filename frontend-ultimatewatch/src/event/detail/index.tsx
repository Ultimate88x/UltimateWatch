import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import type { Member } from '../../types/member';
import { EmptyState } from '../../components/EmptyState';
import { Film, Calendar, Users, Info, Shield, ChevronLeft, ChevronRight, Trophy, LogOut, Play, UserPlus, Trash } from 'lucide-react';
import { Button } from '../../components/Button';
import { getRelativeDate } from '../../components/utilities/RelativeDate';
import { useAdvancedNavigation } from '../../components/utilities/SmartNavigate';
import type { MediaEvent } from '../../types/media-event';
import type { EnhancedEvent } from '../../types/voting-event';
import { MediaEventCard } from '../../components/content/MediaEventCard';
import { EventResultsModal } from '../../components/event/EventResultsModal';
import { ConfirmModal } from '../../components/ConfirmModal';
import type { AddMedia } from '../../types/add-media-item';
import { Modal } from '../../components/Modal';
import { SearchForMedia } from '../../components/content/SearchForMedia';
import { InviteFriendsModal } from '../../components/event/InviteFriendsModal';
import { EventVisibilityEnum } from '../../enums/EventVisibility';

export default function EventDetail() {
  const { smartNavigate } = useAdvancedNavigation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState<EnhancedEvent | null>(null);

  const [canSeeEvent, setCanSeeEvent] = useState<boolean | null>(null);

  const [members, setMembers] = useState<Member[]>([]);
  const [isMember, setIsMember] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isMembersLoading, setIsMembersLoading] = useState(true);

  const [mediaList, setMediaList] = useState<MediaEvent[] | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(true);

  const [votedMediaIds, setVotedMediaIds] = useState<number[]>([]);
  const [isVoteLoading, setIsVoteLoading] = useState(false);

  const [accessRequestId, setAccessRequestId] = useState<number | null>(null);

  const [showResults, setShowResults] = useState(false);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDeleteRequestModalOpen, setIsDeleteRequestModalOpen] = useState(false);
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  
  const [isActionLoading, setIsActionLoading] = useState(false);
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

  const fetchMedia = React.useCallback(async () => {
    setIsMediaLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/events/media/${id}`,
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
        toast.error(data.message || "Failed to fetch event media");
        return;
      }

      setMediaList(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setTimeout(() => setIsMediaLoading(false), 250);
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
      setIsMember(data.data.some((member: Member) => member.isCurrentUser));
      setTotalPages(data.lastPage || 1);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      setIsLoading(false);
    } finally {
      setTimeout(() => setIsMembersLoading(false), 250);
    }
  }, [id, page]);

  const fetchAccessRequest = useCallback(async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/requests/event-access-request/sent/${id}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
      );

      let data = null;
      
      const text = await response.text();
      if (text) {
        data = JSON.parse(text);
      }

      if (!response.ok) {
        toast.error(data.message || "Failed to fetch if event access request exists");
        return;
      }

      if (data) {
        setAccessRequestId(data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    };
  }, [id]);

  useEffect(() => {
    const checkCanSeeEvent = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/events/can-see/${id}`,
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
          toast.error(data.message || "Failed to check if user can see event");
          return;
        }

        setCanSeeEvent(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error';
        toast.error(message);
      } finally {
        if (!canSeeEvent) {
          setTimeout(() => setIsLoading(false), 400);
        }
      }
    }

    checkCanSeeEvent();
  }, [id, canSeeEvent]);

  useEffect(() => {
    const fetchVotes = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/votes/event/${id}`,
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
          toast.error(data.message || "Failed to fetch user votes");
          return;
        }

        setVotedMediaIds(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error';
        toast.error(message);
      };
    }

    if (mediaList) fetchVotes();
  }, [id, mediaList]);

  const handleJoinEvent = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/events/join/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to join event");
        setIsActionLoading(false);
        return;
      }

      fetchEvent();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/events/request-access/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to request access to event");
        setIsActionLoading(false);
        return;
      }

      toast.success(data.message);

      fetchAccessRequest();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleLeaveEvent = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/events/leave/${id}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to leave event");
        setIsActionLoading(false);
        return;
      }

      toast.success(data.message);

      fetchEvent();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteRequestAccess = async () => {
    setIsActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/events/access-request/${accessRequestId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete request to event");
        setIsActionLoading(false);
        return;
      }

      toast.success(data.message);

      setAccessRequestId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSendSuggestion = async (mediaId: number) => {
    console.log("Suggesting media with ID:", mediaId);
    try {
      const response = await fetch(`http://localhost:3000/events/suggest/${id}/${mediaId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to suggest media");
        setMediaList(prevList => prevList ? prevList.filter(m => m.id !== mediaId) : []);
        return;
      }

      toast.success(data.message);
      fetchMedia();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    }
  };

  useEffect(() => {
    if (canSeeEvent) {
      fetchEvent();
    }
  }, [fetchEvent, canSeeEvent]);

  useEffect(() => {
    if (event) {
      fetchMedia();
      fetchMembers();
      fetchAccessRequest();
    }
  }, [event, fetchMedia, fetchMembers, fetchAccessRequest]);

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

  if (canSeeEvent === false) {
    return <EmptyState icon={Shield} title='You do not have permission to view this event' description='The visibility to this event is limited' />;
  }

  if (!event) {
    return <EmptyState icon={Film} title='Event not found' />;
  }

  return (
    <div className="relative w-full bg-cover bg-blue-background flex flex-col justify-start items-center overflow-x-hidden">
      <div className="absolute w-full h-150 pointer-events-none">
        <div className="absolute inset-0 bg-linear-to-b from-purple-main/20 via-blue-background/80 to-blue-background" />
        {mediaList?.[0]?.imagePath && (
          <img 
            src={mediaList[0].imagePath} 
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

            <div className="flex items-center gap-2 text-white/60">
              <Shield size={18} className="text-purple-main" />
              <span className="text-sm font-bold uppercase tracking-wider">
                {event.visibility?.replace('_', ' ')}
              </span>
            </div>

            {event.status === 'voting' && (
              <>
                <div className="h-4 w-px bg-white/10 hidden md:block" />
                {event.votingEndDate && (
                  <div className="flex items-center gap-2 text-amber-400/80">
                    <Calendar size={18} />
                    <span className="text-sm font-bold uppercase">
                      Voting Ends: {getRelativeDate(event.votingEndDate)}
                    </span>
                  </div>
                )}

                {event.maxVotesPerMember && (
                  <div className="flex items-center gap-2 text-white/60">
                    <Shield size={18} className="text-amber-400" />
                    <span className="text-sm font-bold uppercase">
                      Limit: {event.maxVotesPerMember} Votes
                    </span>
                  </div>
                )}

                {event.maxMedia && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-amber-400/5 border border-amber-400/20 rounded-full">
                    <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                    <span className="text-[9px] text-amber-400 font-black uppercase tracking-[0.2em] italic">
                      Picking {event.maxMedia} Winner{event.maxMedia > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </>
            )}
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
              <div className={`flex items-center gap-4 border-l-4 pl-4 py-1 ${event.status === 'voting' ? 'border-amber-400' : 'border-purple-main'}`}>
                <div className="flex flex-col flex-1">
                  <div className="flex justify-between items-end w-full">
                    <h3 className="text-sm font-black uppercase italic tracking-tighter text-white">
                      {event.status === 'voting' ? 'VOTE' : 'LINEUP'}
                    </h3>
                    
                    {event.status === 'voting' && isMember && event.maxVotesPerMember && (
                      <div className="flex flex-col items-end">
                        <span className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em]">Your Activity</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-white/60 italic uppercase tracking-tighter">
                            Available Votes:
                          </span>
                          <span className={`text-xs font-mono font-black ${votedMediaIds.length >= event.maxVotesPerMember ? 'text-purple-main' : 'text-amber-400'}`}>
                            {event.maxVotesPerMember - votedMediaIds.length} / {event.maxVotesPerMember}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.3em] mt-1">
                    {event.status === 'voting' 
                      ? isMember 
                        ? `Select up to ${event.maxVotesPerMember === 1 ? 'a' : event.maxVotesPerMember} title${event.maxVotesPerMember === 1 ? '' : 's'} you want to watch!` 
                        : 'Join the event to vote!' 
                      : 'Planned marathon lineup'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {isMember && event.status === 'voting' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setIsSuggestModalOpen(true)}
                    className="group relative overflow-hidden bg-purple-main/5 border border-purple-main/20 rounded-2xl p-6 cursor-pointer hover:bg-purple-main/10 transition-all border-dashed"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-main/20 flex items-center justify-center text-purple-main group-hover:scale-110 transition-transform">
                          <Film size={24} />
                        </div>
                        <div>
                          <h4 className="text-white font-black uppercase italic tracking-tighter text-lg">
                            Missing something?
                          </h4>
                          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                            Suggest a movie or series to the voting pool
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-purple-main text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg group-hover:bg-purple-light transition-colors">
                        Add Suggestion
                      </div>
                    </div>
                    
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Film size={100} />
                    </div>
                  </motion.div>
                )}
                {isMediaLoading ? (
                  <div className="h-full w-full flex flex-col items-center justify-center py-20">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="relative"
                    >
                      <div className="w-10 h-10 border-4 border-purple-main/20 border-t-purple-main rounded-full" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-6 text-white font-inter font-bold tracking-widest uppercase text-xs"
                    >
                      Loading content...
                    </motion.p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {mediaList?.map((m) => (
                      <MediaEventCard
                        key={m.id}
                        media={m}
                        event={event!}
                        isMember={isMember}
                        votedMediaIds={votedMediaIds}
                        isVoteLoading={isVoteLoading}
                        setIsVoteLoading={setIsVoteLoading}
                        onEventUpdate={fetchMedia}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-span-4 flex flex-col gap-6">
            <div className="bg-purple-main p-8 rounded-3xl shadow-[0_0_40px_rgba(168,85,247,0.15)] flex flex-col gap-4 relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                <Shield size={160} />
              </div>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter">{event.status === 'finished' ? 'Marathon Complete!' : 'Ready for the marathon?'}</h4>
              <p className="text-white/80 text-xs font-bold leading-tight">{event.status === 'finished' ? 'The marathon has ended.' : 'Join the session to interact with the community.'}</p>
              <div className="w-full">
                {!isMember && event.visibility !== EventVisibilityEnum.REQUEST_ONLY ? (
                  <Button 
                    variant="solid-accent" 
                    onClick={() => setIsJoinModalOpen(true)}
                    className="w-full bg-white text-purple-main hover:bg-white/60 py-6 rounded-2xl font-black shadow-lg"
                    disabled={event.status === 'finished' || event.visibility === EventVisibilityEnum.PRIVATE || isActionLoading}
                  >
                    Become a Member
                  </Button>
                ) : !isMember && event.visibility === EventVisibilityEnum.REQUEST_ONLY ? (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="solid-accent"
                      onClick={() => setIsRequestModalOpen(true)}
                      className="w-full bg-white text-purple-main hover:bg-white/60 py-6 rounded-2xl font-black shadow-lg"
                      disabled={event.status === 'finished' || isActionLoading || !!accessRequestId}
                    >
                      Request Access
                    </Button>

                    {accessRequestId && (<Button
                      variant="danger"
                      onClick={() => setIsDeleteRequestModalOpen(true)}
                      icon={Trash}
                      className="w-auto! pl-5 pr-3.5 py-6 rounded-2xl border border-white/10"
                      disabled={isActionLoading}
                      title="Delete Access Request"
                    />)}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="solid-accent"
                      onClick={() => navigate(`/events/${event.id}/room`)}
                      icon={Play}
                      className="w-full bg-white text-purple-main hover:bg-white/60 py-6 rounded-2xl font-black shadow-lg"
                      disabled={event.status === 'voting' || event.status === 'finished'}
                    >
                      Join Session
                    </Button>

                    <Button
                      variant="danger"
                      onClick={() => setIsLeaveModalOpen(true)}
                      icon={LogOut}
                      className="w-auto! px-4 py-6 rounded-2xl border border-white/10"
                      disabled={event.status === 'finished' || isActionLoading}
                      title="Leave Event"
                    />
                  </div>
                )}
              </div>

              {event.type === "voting_event" && (
                <Button
                  variant="outline"
                  fullWidth
                  icon={Trophy}
                  onClick={() => setShowResults(true)}
                  className="rounded-2xl border-white/20 text-white hover:border-amber-400! hover:text-amber-400"
                >
                  {event.status === 'finished' ? 'View Final Results' : 'Live Ranking'}
                </Button>
              )}
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
                    <>
                      {isMember && event.status !== 'finished' && members.length < event.maxMembers && (
                        <motion.div
                          initial={{ opacity: 0, x: 10 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="w-full flex items-center gap-3 p-2 rounded-xl border border-dashed border-purple-main/30 bg-purple-main/5 hover:bg-purple-main/10 transition-all group cursor-pointer"
                          >
                            <div className="w-10 h-10 rounded-xl bg-purple-main/20 flex items-center justify-center text-purple-main group-hover:scale-110 transition-transform">
                              <UserPlus size={18} />
                            </div>
                            <div className="flex flex-col items-start min-w-0">
                              <span className="text-[11px] font-black uppercase italic text-purple-main">
                                Invite your squad
                              </span>
                              <span className="text-[8px] font-bold uppercase text-purple-main/40">
                                {event.maxMembers - members.length} slots available
                              </span>
                            </div>
                          </button>
                        </motion.div>
                      )}

                      {members.map((member) => (
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
                              <span className="flex text-[11px] font-black uppercase italic truncate group-hover:text-purple-300 transition-colors">
                                {member.name}
                              </span>
                              <span className="flex text-[8px] font-bold uppercase text-white/20">
                                {member.role}
                              </span>
                            </div>
                          </button>
                        </motion.div>
                      ))}
                    </>
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

      <InviteFriendsModal 
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        eventId={id}
      />

      <div className="h-500">
        <Modal 
          isOpen={isSuggestModalOpen} 
          onClose={() => setIsSuggestModalOpen(false)}
        >
          <SearchForMedia 
            selectedMedia={mediaList as unknown as AddMedia[]}
            onSelectMedia={(mediaId: number) => {
              handleSendSuggestion(mediaId);
              setIsSuggestModalOpen(false);
            }}
            cols={5}
          />
        </Modal>
      </div>

      <EventResultsModal 
        eventId={event.id}
        isOpen={showResults}
        onClose={() => setShowResults(false)}
        maxWinners={event.maxMedia || 1}
        eventName={event.name}
      />

      <ConfirmModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onConfirm={handleJoinEvent}
        title="Join Event"
        description="You are about to join this event. You'll be able participate in the live session."
        confirmText="Let's Go!"
        cancelText="Not now"
        variant="accent"
        icon={Play}
      />

      <ConfirmModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onConfirm={handleRequestAccess}
        title="Request Access"
        description="You are about ask for access to join this event. If accepted, you'll be able participate in the live session."
        confirmText="Let's Go!"
        cancelText="Not now"
        variant="accent"
        icon={Play}
      />

      <ConfirmModal
        isOpen={isLeaveModalOpen}
        onClose={() => setIsLeaveModalOpen(false)}
        onConfirm={handleLeaveEvent}
        title="Leave Event"
        description="You are about to leave this event. Are you sure?"
        confirmText="Yes, Leave"
        cancelText="Don't Leave"
        variant="danger"
      />

      <ConfirmModal
        isOpen={isDeleteRequestModalOpen}
        onClose={() => setIsDeleteRequestModalOpen(false)}
        onConfirm={handleDeleteRequestAccess}
        title="Delete Access Request"
        description="You are about to delete your request to join this event. Are you sure?"
        confirmText="Yes, Delete"
        cancelText="Don't Delete"
        variant="danger"
      />
    </div>
  );
};
