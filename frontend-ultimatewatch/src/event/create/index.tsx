import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEventSchema } from "./schemas/createEventSchema";
import toast from "react-hot-toast";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { motion } from "framer-motion";
import { EventTypeEnum, type EventType } from "../../enums/EventTypeEnum";
import { useAdvancedNavigation } from "../../components/utilities/SmartNavigate";
import type { Media } from "../../types/media-item";
import { Search, SearchX, ChevronDown } from "lucide-react";
import ListMedia from "../../components/content/ListMedia";
import { EmptyState } from "../../components/EmptyState";

export default function CreateEvent() {
  const navigate = useNavigate();
  const { smartNavigate } = useAdvancedNavigation();

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(false);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [query, setQuery] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'movies' | 'series'>('movies');
  const [searchText, setSearchText] = useState<string>("");

  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);

  const [type, setType] = useState<EventType>(EventTypeEnum.STANDARD);
  const [error, setError] = useState<{ field: string; message: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMedia, setIsLoadingMedia] = useState(false);

  const [formData, setFormData] = useState(() => ({
    name: '',
    description: null as string | null,
    eventDate: new Date(Date.now() + 6000000),
    maxMembers: 10,
		mediaIds: [],
  }));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (error?.field === name) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const result = createEventSchema.safeParse(formData);
    if (!result.success) {
      const error = result.error.issues[0];
      setError({ 
        field: error.path[0] as string, 
        message: error.message 
      });
      return;
    }
    
    try {
			const response = await fetch('http://localhost:3000/events/standard', {
				method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
				body: JSON.stringify(formData),
			});

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        
        let field = 'general';
        if (message.toLowerCase().includes('name')) field = 'name';
        else if (message.toLowerCase().includes('date')) field = 'eventDate';
        else if (message.toLowerCase().includes('member')) field = 'maxMembers';

        if (field === 'general') {
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

  const toggleMediaSelection = (id: number) => {
    setSelectedMediaId(selectedMediaId === id ? null : id);
  };

  const addMediaToLineup = async (media: Media) => {
    if (formData.mediaIds.includes(media.id as never)) {
      toast.error("Already in your lineup");
      setSelectedMediaId(null);
      return;
    }

    setIsLoadingMedia(true);

    try {
      const response = await fetch(`http://localhost:3000/${mediaType}/${media.id}`);

      if (!response.ok) {
        toast.error("Failed to add media to lineup");
      }

      setFormData(prev => ({
        ...prev,
        mediaIds: [...prev.mediaIds, media.id as never]
      }));
      toast.success(`${media.title} added to lineup`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';
      toast.error(message);
    } finally {
      setSelectedMediaId(null);
    }
  };

  const renderMediaOverlay = () => {
    if (!selectedMediaId) return null;

    const currentMedia = mediaList.find((m) => m.id === selectedMediaId);
    const title = currentMedia?.title || "Unknown Title";

    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" 
        onClick={() => setSelectedMediaId(null)}
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="bg-blue-background border border-white/10 p-8 rounded-[2.5rem] shadow-2xl flex flex-col gap-4 min-w-70 max-w-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col items-center mb-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-main mb-1">
              Selected Content
            </span>
            <h4 className="text-sm font-black uppercase italic text-white text-center leading-tight">
              {title}
            </h4>
          </div>
          
          <div className="h-px w-full bg-white/5 my-2" />

          <Button 
            variant="primary" 
            fullWidth 
            className="font-black italic uppercase text-xs py-4"
            onClick={() => currentMedia && addMediaToLineup(currentMedia)}
            isLoading={isLoadingMedia}
          >
            Add to Lineup
          </Button>

          <Button 
            variant="ghost" 
            fullWidth 
            className="text-white/40 hover:text-white uppercase text-[10px] font-black tracking-widest"
            onClick={(e) => smartNavigate(`/${mediaType}/${selectedMediaId}`, e)}
          >
            View Details
          </Button>
        </motion.div>
      </div>
    );
  };

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
                value={formData.name}
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
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="Optional description..."
                error={error}
              />

              <div className="grid grid-cols-1 gap-4">
                  <Input
                  label="Event Date"
                  name="eventDate"
                  type="datetime-local"
                  value={formData.eventDate instanceof Date ? formData.eventDate.toISOString().slice(0, 16) : formData.eventDate}
                  onChange={handleChange}
                  error={error}
                  />

                  <Input
                  label="Max Members"
                  name="maxMembers"
                  type="number"
                  value={formData.maxMembers.toString()}
                  onChange={handleChange}
                  error={error}
                  />
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth className="mt-4 font-black italic uppercase">
                Create Event
              </Button>
            </form>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="col-span-3 h-full"
        >
          <div className="bg-white/2 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md min-h-150 h-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Selected Lineup</h3>
              <span className="text-purple-main font-mono text-xs">{formData.mediaIds.length}</span>
            </div>
            
            <div className="flex flex-col gap-3">
              {formData.mediaIds.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-white/5 rounded-3xl">
                  <p className="text-[10px] text-white/10 font-black uppercase italic">No media selected yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-125 overflow-y-auto pr-2 media-scrollbar">
                  {formData.mediaIds.map((id) => {
                    const item = mediaList.find(m => m.id === id);
                    if (!item) return null;

                    return (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        key={id}
                        className="group relative flex items-center gap-4 bg-white/5 border border-white/5 p-3 rounded-2xl hover:bg-white/10 hover:border-purple-main/30 transition-all"
                      >
                        <div className="relative shrink-0 w-10 h-14 overflow-hidden rounded-lg border border-white/10 bg-white/5">
                          {item.posterPath ? (
                            <img 
                              src={item.posterPath} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                              <Search size={12} className="text-white/10" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 flex flex-col min-w-0">
                          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-purple-main/60 mb-0.5">
                            {mediaType === 'movies' ? 'Movie' : 'Series'}
                          </span>
                          <p className="text-[10px] font-black text-white/90 uppercase italic truncate leading-tight">
                            {item.title}
                          </p>
                        </div>

                        <button 
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              mediaIds: prev.mediaIds.filter(mediaId => mediaId !== id)
                            }));
                          }}
                          className="p-2 text-white/10 hover:text-red-500 transition-all cursor-pointer"
                        >
                          <SearchX size={14} className="group-hover:scale-110 transition-transform" /> 
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              )}
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

                      {renderMediaOverlay()}
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