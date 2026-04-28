import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createStandardEventSchema } from "./schemas/createStandardEventSchema";
import { createVotingEventSchema } from "./schemas/createVotingEventSchema";
import toast from "react-hot-toast";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { motion } from "framer-motion";
import { EventTypeEnum, type EventType } from "../../enums/EventTypeEnum";
import type { Media } from "../../types/media-item";
import { Search, SearchX, ChevronDown } from "lucide-react";
import ListMedia from "../../components/content/ListMedia";
import { EmptyState } from "../../components/EmptyState";
import { AddMediaModal } from "../../components/content/AddMediaModal";
import type { AddMedia } from "../../types/add-media-item";
import { formatDateForInput } from "../../components/utilities/FormatDateForInput";

const INITIAL_STANDARD = {
  name: '',
  description: '' as string | null,
  eventDate: new Date(new Date(Date.now() + 600000 * 6).setSeconds(0, 0)),
  maxMembers: 5,
  mediaIds: [] as number[],
};

const INITIAL_VOTING = {
  name: '',
  description: '' as string | null,
  eventDate: new Date(new Date(Date.now() + 600000 * 6).setSeconds(0, 0)),
  maxMembers: 5,
  maxMedia: 1,
  maxVotesPerMember: 1,
  votingEndDate: new Date(new Date(Date.now() + 300000 * 6).setSeconds(0, 0)),
  proposedMediaIds: [] as number[],
};

export default function CreateEvent() {
  const navigate = useNavigate();

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(false);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'movies' | 'series'>('movies');
  const [searchText, setSearchText] = useState<string>("");

  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<AddMedia[]>([]);

  const [type, setType] = useState<EventType>(EventTypeEnum.STANDARD);
  const [error, setError] = useState<{ field: string; message: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState(INITIAL_STANDARD);
  const [votingData, setVotingData] = useState(INITIAL_VOTING);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    let finalValue: string | number | Date = inputType === 'number' ? Number(value) : value;

    if (inputType === 'datetime-local' && value) {
      const dateValue = new Date(value);
      dateValue.setSeconds(0, 0);
      finalValue = dateValue;
    }

    const commonFields = ['name', 'description', 'eventDate', 'maxMembers'];

    if (commonFields.includes(name)) {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
      setVotingData(prev => ({ ...prev, [name]: finalValue }));
    } else {
      if (type === EventTypeEnum.VOTING) {
        setVotingData(prev => ({ ...prev, [name]: finalValue }));
      } else {
        setFormData(prev => ({ ...prev, [name]: finalValue }));
      }
    }

    if (error?.field === name) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const isVoting = type === EventTypeEnum.VOTING;
    
    const schema = isVoting ? createVotingEventSchema : createStandardEventSchema;
    const dataToValidate = isVoting ? votingData : formData;

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const firstError = result.error.issues[0];
      setError({ 
        field: firstError.path[0] as string, 
        message: firstError.message 
      });

      if (firstError.path[0] as string === "mediaIds" || firstError.path[0] as string === "proposedMediaIds") {
        toast.error(firstError.message);
      }
      return;
    }

    const endpoint = isVoting ? 'voting' : 'standard';
    
    try {
      const response = await fetch(`http://localhost:3000/events/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(result.data), 
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        const lowerMessage = message.toLowerCase();

        let field = 'general';

        if (lowerMessage.includes('name')) {
          field = 'name';
        } else if (lowerMessage.includes('voting end') || lowerMessage.includes('votingend')) {
          field = 'votingEndDate';
        } else if (lowerMessage.includes('vote')) {
          field = 'maxVotesPerMember';
        }else if (lowerMessage.includes('date')) {
          field = 'eventDate';
        } else if (lowerMessage.includes('member')) {
          field = 'maxMembers';
        } else if (lowerMessage.includes('votes')) {
          field = 'maxVotesPerMember';
        } else if (lowerMessage.includes('max media') || lowerMessage.includes('maxmedia')) {
          field = 'maxMedia';
        } else {
          toast.error(message);
        }

        setError({ field, message: message });
        return;
      }

      navigate('/events');

    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    }
  };

  const fetchMedia = useCallback(async () => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    setIsLoading(true);

    try {
      const url = query 
        ? `http://localhost:3000/${mediaType}/tmdb-search?query=${query}&page=${page}`
        : `http://localhost:3000/${mediaType}/tmdb-list?page=${page}`;

      const [response] = await Promise.all([
        fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        }),
        wait(750)
      ]);

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to fetch media');
        return;
      }

      setMediaList(data.mediaList);
      setLastPage(data.lastPage);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, query, mediaType]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    setPage(1);
  }, [query, mediaType]);

  useEffect(() => {
    const activeParentIds = new Set(
      selectedMedia
        .map(m => m.parentId)
        .filter((id): id is number => id !== undefined && id !== null)
    );

    const ids = selectedMedia
      .filter(m => !activeParentIds.has(m.id))
      .map(m => m.id);
    
    if (type === EventTypeEnum.VOTING) {
      setVotingData(prev => ({ ...prev, proposedMediaIds: ids }));
    } else {
      setFormData(prev => ({ ...prev, mediaIds: ids }));
    }
  }, [selectedMedia, type]);

  const toggleMediaSelection = (id: number) => {
    setSelectedMediaId(selectedMediaId === id ? null : id);
  };

  const handleAddItemsToLineup = (newItems: AddMedia[]) => {
    const itemsToAdd = newItems.filter(newItem => 
      !selectedMedia.some(existing => existing.id === newItem.id && existing.type === newItem.type)
    );

    if (itemsToAdd.length === 0) {
      toast.error("Already in your lineup");
      return;
    }

    setSelectedMedia(prevLineup => [...prevLineup, ...itemsToAdd]);

    const mainItem = newItems[newItems.length - 1];
    toast.success(`${mainItem.title} added`);
  };

  const isVoting = type === EventTypeEnum.VOTING;
  const data = isVoting ? votingData : formData;

  return (
    <div className="relative w-full bg-blue-background overflow-x-hidden px-8">
      <div className="relative mb-8 ml-4">
        <h2 className="text-5xl font-black italic uppercase tracking-tighter text-white">
          Create <span className="text-purple-main">Event</span>
        </h2>
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Create your own marathon!</p>
      </div>

      <div className="grid grid-cols-12 gap-7 items-start">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="col-span-3 h-full"
        >
          <div className="bg-white/2 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl shadow-2xl h-full">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-main/60 mb-6">General Info</h3>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <Input
                label="Event Name"
                name="name"
                value={data.name}
                onChange={handleChange}
                placeholder="Enter event name"
                error={error}
              />

              <div className="flex flex-col gap-2">
                <label className="font-bold text-white/40 ml-2 text-[10px] uppercase tracking-widest">
                  Event Type
                </label>
                <select 
                  value={type}
                  onChange={(e) => setType(e.target.value as EventType)}
                  className="w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl transition-all text-white focus:outline-none border-white/20 focus:border-purple-main focus:bg-white/20 cursor-pointer appearance-none"
                >
                  <option value={EventTypeEnum.STANDARD} className="bg-blue-background text-white">Standard Session</option>
                  <option value={EventTypeEnum.VOTING} className="bg-blue-background text-white">Voting Marathon</option>
                </select>
              </div>

              <Input
                label="Description"
                name="description"
                value={data.description || ''}
                onChange={handleChange}
                placeholder="Optional description..."
                error={error}
              />

              <div className="grid grid-cols-1 gap-4">
                {type === EventTypeEnum.VOTING && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-5 border-l-2 border-purple-main/30 pl-4 py-2 my-2"
                  >
                    <h4 className="text-[9px] font-black uppercase text-purple-main tracking-widest">Voting Settings</h4>
                    
                    <Input
                      label="Voting End Date"
                      name="votingEndDate"
                      type="datetime-local"
                      value={formatDateForInput(votingData.votingEndDate)}
                      onChange={handleChange}
                      error={error}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Max Media"
                        name="maxMedia"
                        type="number"
                        value={votingData.maxMedia.toString()}
                        onChange={handleChange}
                        error={error}
                      />
                      <Input
                        label="Votes Per Member"
                        name="maxVotesPerMember"
                        type="number"
                        value={votingData.maxVotesPerMember.toString()}
                        onChange={handleChange}
                        error={error}
                      />
                    </div>
                  </motion.div>
                )}

                <Input
                  label="Event Start Date"
                  name="eventDate"
                  type="datetime-local"
                  value={formatDateForInput(data.eventDate)}
                  onChange={handleChange}
                  error={error}
                />

                <Input
                  label="Max Members"
                  name="maxMembers"
                  type="number"
                  value={data.maxMembers.toString()}
                  onChange={handleChange}
                  error={error}
                />
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth className="mt-4 font-black italic uppercase">
                {isLoading ? "Creating..." : "Create Event"}
              </Button>
            </form>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="col-span-3 h-full"
        >
          <div className="bg-white/2 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md min-h-150 h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Selected Lineup</h3>
              <span className="text-purple-main font-mono text-xs">
                {(() => {
                  const activeParentIds = new Set(
                    selectedMedia
                      .map(m => m.parentId)
                      .filter((id): id is number => id !== undefined && id !== null)
                  );
                  return selectedMedia.filter(m => !activeParentIds.has(m.id)).length;
                })()}
              </span>
            </div>
            
            <div className="flex flex-col gap-4 overflow-y-auto pr-1 media-scrollbar h-full">
              {selectedMedia.filter(m => !m.parentId).map((media) => (
                <div key={media.id} className="flex flex-col bg-white/3 border border-white/10 rounded-xl overflow-hidden shadow-2xl">
                  
                  <div className="flex items-center gap-3 p-2.5 bg-linear-to-r from-purple-main/20 to-transparent">
                    <img src={media.posterPath} className="w-10 h-14 object-cover rounded-md border border-white/10 shadow-lg" alt="" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] font-black text-white uppercase italic truncate leading-none">
                        {media.title}
                      </h3>
                      <p className="text-[8px] font-bold text-purple-400 uppercase tracking-widest mt-1 opacity-70">
                        {media.type === 'movie' ? 'Movie' : 'Series'}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedMedia(prev => prev.filter(m => m.id !== media.id && m.parentId !== media.id))}
                      className="p-2 text-white/10 hover:text-red-500 transition-all hover:bg-red-500/10 rounded-lg cursor-pointer"
                    >
                      <SearchX size={16} />
                    </button>
                  </div>

                  <div className="flex flex-col">
                    {selectedMedia
                      .filter(item => item.parentId === media.id && item.type === 'season')
                      .map((season) => {
                        const episodes = selectedMedia.filter(item => item.parentId === season.id && item.type === 'episode');
                        const hasEpisodes = episodes.length > 0;

                        return (
                          <div key={season.id} className="flex flex-col">
                            <div className="flex justify-between items-center px-3 py-1.5 bg-white/5 border-y border-white/5">
                              <span className="text-[11px] font-bold text-white/40 uppercase tracking-tighter">
                                {season.title}
                              </span>
                              <button 
                                onClick={() => setSelectedMedia(prev => prev.filter(m => m.id !== season.id && m.parentId !== season.id))}
                                className="text-white/10 hover:text-red-400 transition-colors cursor-pointer"
                              >
                                <SearchX size={12} />
                              </button>
                            </div>

                            {hasEpisodes && (
                              <div className="flex flex-col py-0.5">
                                {episodes.map((episode) => (
                                  <div 
                                    key={episode.id} 
                                    className="group flex items-center gap-3 py-1.5 px-4 hover:bg-purple-main/5 transition-all border-b border-white/2 last:border-0"
                                  >
                                    <div className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-purple-main transition-colors shadow-[0_0_5px_rgba(168,85,247,0)] group-hover:shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
                                    <p className="text-[10px] text-white/60 group-hover:text-white/90 flex-1 truncate font-medium tracking-tight">
                                      {episode.title}
                                    </p>
                                    <button 
                                      onClick={() => setSelectedMedia(prev => prev.filter(m => m.id !== episode.id))}
                                      className="relative left-1 text-white/20 hover:text-red-400 transition-opacity cursor-pointer"
                                    >
                                      <SearchX size={11} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="col-span-6 h-full flex flex-col"
        >
          <div className="bg-white/2 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md flex flex-col h-187.5">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6 shrink-0">
              Content Explorer
            </h3>
            
            <div className="relative flex flex-col gap-6 h-full overflow-hidden">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  setQuery(searchText);
                }}
                className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-2xl focus-within:border-purple-main focus-within:bg-white/20 transition-all px-3 group"
              >
                <div className="relative flex items-center">
                  <select 
                    className="appearance-none bg-transparent py-3 pl-2 pr-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 cursor-pointer focus:outline-none hover:text-purple-main transition-colors"
                    onChange={(e) => {
                      setMediaType(e.target.value as 'movies' | 'series');
                    }}
                    value={mediaType}
                  >
                    <option value="movies" className="bg-blue-background text-white">Movies</option>
                    <option value="series" className="bg-blue-background text-white">Series</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 text-white/20 pointer-events-none" />
                </div>

                <div className="h-6 w-px bg-white/10 mx-2" />

                <input 
                  type="text"
                  value={searchText}
                  placeholder={`Search ${mediaType === 'movies' ? 'movies' : 'series'}...`}
                  className="flex-1 bg-transparent border-none py-3 px-2 text-white placeholder:text-white/20 focus:outline-none focus:ring-0 text-sm"
                  onChange={(e) => setSearchText(e.target.value)}
                />

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="p-2 text-white/20 hover:text-purple-main transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Search 
                    className="transition-transform group-hover:scale-115 group-active:scale-95" 
                    size={18} 
                  />
                </button>
              </form>

              <div className="flex-1 overflow-y-auto pr-4 media-scrollbar relative">
                {isLoading ? (
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
                      <div className="w-20 h-20 border-4 border-purple-main/20 border-t-purple-main rounded-full" />
                    </motion.div>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-6 text-white font-inter font-bold tracking-widest uppercase text-sm"
                    >
                      Loading content...
                    </motion.p>
                  </div>
                ) : mediaList.length === 0 ? (
                  <EmptyState 
                    title="No Titles Found"
                    description="Try another search."
                    icon={SearchX}
                    fullPage={false} 
                    showBackButton={false} 
                  />
                ) : (
                  <div className="flex flex-col gap-8">
                    <div className="relative">
                      <ListMedia 
                        mediaItems={mediaList} 
                        onClick={(id) => toggleMediaSelection(id)} 
                        columns={4} 
                      />

                      <AddMediaModal 
                        media={mediaList.find(m => m.id === selectedMediaId) || null}
                        mediaType={mediaType}
                        onClose={() => setSelectedMediaId(null)}
                        onAddItems={handleAddItemsToLineup}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center w-full pt-4 mt-2 border-t border-white/5 shrink-0 bg-transparent">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 1 || isLoading}
                  onClick={() => setPage(prev => prev - 1)}
                  className="text-white/40 hover:text-white"
                >
                  Previous
                </Button>
                
                <span className="text-[10px] font-mono text-purple-main">PAGE {page}</span>

                <Button
                  variant="ghost"
                  size="sm"
                  disabled={lastPage || isLoading}
                  onClick={() => setPage(prev => prev + 1)}
                  className="text-white/40 hover:text-white"
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}