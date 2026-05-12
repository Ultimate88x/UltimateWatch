import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import type { Member } from '../../types/member';
import { EmptyState } from '../../components/EmptyState';
import { Film, Calendar, Users, Info, Shield, ChevronLeft, ChevronRight, Trophy, LogOut, Play, UserPlus, Trash, AlertTriangle, Settings, Clapperboard, UserMinus } from 'lucide-react';
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
import { EventAccessRequestsModal } from '../../components/event/EventAccessRequestsModal';
import { EventTypeEnum } from '../../enums/EventTypeEnum';
import { EditEventModal } from '../../components/event/update/EditEventModal';
import { MemberRoleEnum, type MemberRole } from '../../enums/MemberRoleEnum';

export default function EventDetail() {
  const { smartNavigate } = useAdvancedNavigation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [event, setEvent] = useState<EnhancedEvent | null>(null);

  const [canSeeEvent, setCanSeeEvent] = useState<boolean | null>(null);
  const [canAddContent, setCanAddContent] = useState<boolean>(false);

  const [members, setMembers] = useState<Member[]>([]);
  const [member, setMember] = useState<Member | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [membersLoading, setMembersLoading] = useState(true);

  const [mediaList, setMediaList] = useState<MediaEvent[] | null>(null);
  const [isMediaLoading, setIsMediaLoading] = useState(true);

  const [votedMediaIds, setVotedMediaIds] = useState<number[]>([]);

  const [accessRequestId, setAccessRequestId] = useState<number | null>(null);

  const [showResults, setShowResults] = useState(false);

  const [kickedMember, setKickedMember] = useState<Member | null>(null);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isDeleteRequestModalOpen, setIsDeleteRequestModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isAccessRequestsModalOpen, setIsAccessRequestsModalOpen] = useState(false);
  const [isDeleteEventModalOpen, setIsDeleteEventModalOpen] = useState(false);
  const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
  const [isKickingMemberModalOpen, setIsKickingMemberModalOpen] = useState(false);
  
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
      setCanAddContent(data.type === EventTypeEnum.STANDARD && data.status === 'waiting');
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

  const fetchMember = useCallback(async () => {
    if (!id) return;

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
        setIsOwner(data.role === MemberRoleEnum.OWNER);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    }
  }, [id]);

  const fetchMembers = useCallback(async () => {
    setMembersLoading(true);
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
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      setIsLoading(false);
    } finally {
      setTimeout(() => setMembersLoading(false), 250);
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

      fetchMember();
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

      fetchMember();
      fetchEvent();
      if (event?.visibility === EventVisibilityEnum.REQUEST_ONLY) fetchAccessRequest();
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
        `http://localhost:3000/requests/access-request/${accessRequestId}`,
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

  const handleAddMedia = async (mediaId: number) => {
    try {
      const addUrl: string = event?.status === 'voting' ? 'suggest' : 'add';
      const response = await fetch(`http://localhost:3000/events/${addUrl}/${id}/${mediaId}`, {
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

  const cancelEvent = async () => {
    try {
      const response = await fetch(`http://localhost:3000/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to delete event");
        return;
      }

      toast.success(data.message);
      navigate('/events');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    }
  };

  const handleKickMember = async () => {
    if (!kickedMember)  return;

    setIsActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/members/kick`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            kickedUserId: kickedMember.userId,
            eventId: id
          }),
        }
      );
      
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to kick member");
        setIsActionLoading(false);
        return;
      }

      toast.success(data.message);

      setKickedMember(null);
      setIsKickingMemberModalOpen(false);
      fetchMembers(); 
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

    const handleChangeRole = async (targetMember: Member, role: MemberRole) => {
    if (!window.confirm(`Are you sure you want to kick ${targetMember.name}?`)) return;

    setIsActionLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/members/update-role`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            targetUserId: targetMember.userId,
            eventId: id,
            role
          }),
        }
      );
      
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update member's role");
        setIsActionLoading(false);
        return;
      }

      toast.success(data.message);

      fetchMembers(); 
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setIsActionLoading(false);
    }
  };

  useEffect(() => {
    if (canSeeEvent) {
      fetchEvent();
    }
  }, [fetchEvent, canSeeEvent]);

  useEffect(() => {
    if (canSeeEvent) {
      fetchMember();
    }
  }, [fetchMember, canSeeEvent]);

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

  const addTitle = canAddContent
    ? "Add to the lineup" 
    : "Missing something?";

  const addSubtitle = canAddContent
    ? "Add a new movie or series to the list"
    : "Suggest a movie or series to the voting pool";

  const addButton = canAddContent
    ? "Add Media"
    : "Add Suggestion";

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
          <h1 className="text-8xl font-black italic uppercase tracking-tighter leading-none flex flex-col">
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
          <div className="col-span-8 flex flex-col gap-6">
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
                    
                    {event.status === 'voting' && member && event.maxVotesPerMember && (
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
                      ? member 
                        ? `Select up to ${event.maxVotesPerMember === 1 ? 'a' : event.maxVotesPerMember} title${event.maxVotesPerMember === 1 ? '' : 's'} you want to watch!` 
                        : 'Join the event to vote!' 
                      : 'Planned marathon lineup'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {member && (event.status === 'voting' || canAddContent && isOwner) && (
                  <motion.button 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setIsAddModalOpen(true)}
                    className="group relative overflow-hidden bg-purple-main/5 border border-purple-main/20 rounded-2xl p-6 cursor-pointer hover:bg-purple-main/10 transition-all border-dashed"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-main/20 flex items-center justify-center text-purple-main group-hover:scale-110 transition-transform">
                          <Film size={24} />
                        </div>
                        <div>
                          <h4 className="text-start text-white font-black uppercase italic tracking-tighter text-lg">
                            {addTitle}
                          </h4>
                          <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">
                            {addSubtitle}
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-purple-main text-white text-[10px] font-black uppercase tracking-widest rounded-lg shadow-lg group-hover:bg-purple-light transition-colors">
                        {addButton}
                      </div>
                    </div>
                    
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <Film size={100} />
                    </div>
                  </motion.button>
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
                    {mediaList && mediaList.length > 0 ? (
                      mediaList.map((m) => (
                        <MediaEventCard
                          key={m.id}
                          media={m}
                          event={event!}
                          isMember={!!member}
                          votedMediaIds={votedMediaIds}
                          onEventUpdate={fetchMedia}
                          isOwner={isOwner}
                        />
                      ))
                    ) : (
                      <EmptyState
                        title="No media found"
                        description="It seems this event doesn't have any content yet."
                        icon={Clapperboard}
                        actionLabel="Add Content"
                        showBackButton={false}
                        fullPage={false}
                      />
                    )}
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
                {!member && event.visibility !== EventVisibilityEnum.REQUEST_ONLY ? (
                  <Button 
                    variant="solid-accent" 
                    onClick={() => setIsJoinModalOpen(true)}
                    className="w-full bg-white text-purple-main hover:bg-white/60 py-6 rounded-2xl font-black shadow-lg"
                    disabled={event.status === 'finished' || event.visibility === EventVisibilityEnum.PRIVATE || isActionLoading}
                  >
                    Become a Member
                  </Button>
                ) : !member && event.visibility === EventVisibilityEnum.REQUEST_ONLY ? (
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
                      disabled={event.status === 'voting' || event.status === 'finished' || mediaList?.length === 0 || new Date(event.eventDate) > new Date()}
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

              {isOwner && event.visibility === EventVisibilityEnum.REQUEST_ONLY && event.status !== 'finished' && (
                <Button
                  variant="outline"
                  fullWidth
                  icon={Users}
                  onClick={() => setIsAccessRequestsModalOpen(true)}
                  className="rounded-2xl border-white/20 text-white bg-white/10 hover:bg-white/20 hover:border-white/40 mt-2"
                >
                  Manage Requests
                </Button>
              )}

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

              {isOwner && (event.status === 'voting' || event.status === 'waiting') && (
                <Button
                  variant="secondary"
                  fullWidth
                  icon={Settings}
                  onClick={() => setIsEditEventModalOpen(true)}
                >
                  Manage Event Settings
                </Button>
              )}

              {isOwner && event.status !== 'started' && (
                <Button
                  variant="danger"
                  fullWidth
                  icon={AlertTriangle}
                  onClick={() => setIsDeleteEventModalOpen(true)}
                >
                  Cancel Event
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
                    {membersLoading ? (
                      [...Array(10)].map((_, i) => (
                        <motion.div 
                          key={`skeleton-${i}`} 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3 animate-pulse"
                        >
                          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5" />
                          <div className="flex flex-col gap-2 flex-1">
                            <div className="h-2.5 w-24 bg-white/10 rounded-full" />
                            <div className="h-2 w-12 bg-white/5 rounded-full" />
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      [
                        member && event.status !== 'finished' && members.length < event.maxMembers && (
                          <motion.div
                            key="invite-button"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
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
                        ),

                        ...members.map((m) => (
                          <motion.div
                            key={m.name}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            layout
                            className="group flex items-center justify-between px-3 py-2 rounded-xl hover:bg-white/3 transition-all duration-200"
                          >
                            <button 
                              className="flex items-center gap-3 min-w-0 cursor-pointer"
                              onClick={(e) => smartNavigate(`/users/${m.name}`, e)}
                            >
                              <div className="relative shrink-0">
                                <img 
                                  src={m.imagePath} 
                                  className="w-10 h-10 rounded-xl object-cover border border-white/10 group-hover:border-purple-main/30 transition-colors" 
                                  alt={m.name} 
                                />
                                {m.role === 'owner' && (
                                  <div className="absolute -top-1 -right-1 bg-purple-main w-3 h-3 rounded-full border-2 border-[#0a0a0a] shadow-lg shadow-purple-main/20" />
                                )}
                              </div>
                              
                              <div className="flex flex-col min-w-0 text-left">
                                <span className="text-[11px] font-black uppercase italic truncate group-hover:text-purple-300 transition-colors leading-none mb-1">
                                  {m.name}
                                </span>
                                <span className={`text-[8px] font-bold uppercase tracking-tighter ${m.role === 'moderator' ? 'text-blue-400' : 'text-white/20'}`}>
                                  {m.role}
                                </span>
                              </div>
                            </button>

                            <div className="flex items-center gap-1">
                              {isOwner && m.userId !== member?.userId && (
                                <div className="flex opacity-0 group-hover:opacity-100 transition-all duration-200">
                                  {Object.values(MemberRoleEnum)
                                    .filter((role) => role !== m.role)
                                    .map((role) => (
                                      <button
                                        key={role}
                                        onClick={() => handleChangeRole(m, role)}
                                        className="p-1.5 text-[7px] font-black uppercase text-white/40 hover:text-purple-main hover:bg-purple-main/10 rounded-md transition-all cursor-pointer"
                                        title={`Make ${role}`}
                                      >
                                        {role === 'moderator' ? 'MOD' : role === 'owner' ? 'OWN' : 'MEM'}
                                      </button>
                                    ))}
                                </div>
                              )}

                              {member?.role !== MemberRoleEnum.MEMBER && m.name !== member?.name && m.role !== 'owner' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setKickedMember(m);
                                    setIsKickingMemberModalOpen(true);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-white/20 hover:text-red-danger hover:bg-red-danger/10 rounded-lg transition-all duration-200 cursor-pointer"
                                  title="Kick member"
                                >
                                  <UserMinus size={14} />
                                </button>
                              )}
                            </div>
                          </motion.div>
                        ))
                      ]
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

      <EventAccessRequestsModal 
        isOpen={isAccessRequestsModalOpen}
        onClose={() => setIsAccessRequestsModalOpen(false)}
        eventId={id}
        onAccept={fetchMembers}
      />

      <div className="h-500">
        <Modal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)}
        >
          <SearchForMedia 
            selectedMedia={mediaList as unknown as AddMedia[]}
            onSelectMedia={(mediaId: number) => {
              handleAddMedia(mediaId);
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

      <ConfirmModal
        isOpen={isDeleteEventModalOpen}
        onClose={() => setIsDeleteEventModalOpen(false)}
        onConfirm={cancelEvent}
        title="Cancel Event"
        description="You are about to cancel this event and delete all its contents. Are you sure?"
        confirmText="Yes, Cancel"
        cancelText="Don't Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={isKickingMemberModalOpen}
        onClose={() => { 
          setKickedMember(null);
          setIsKickingMemberModalOpen(false)
        }}
        onConfirm={handleKickMember}
        title="Kick Member"
        description="You are about to kick this member from the event. Are you sure?"
        confirmText="Yes, Kick"
        cancelText="Don't Kick"
        variant="danger"
      />

      <EditEventModal 
        isOpen={isEditEventModalOpen} 
        onClose={() => setIsEditEventModalOpen(false)} 
        event={event} 
        onUpdate={fetchEvent}
      />
    </div>
  );
};
