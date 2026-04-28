import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Plus, Loader2, Clock, ChevronRight, PlayCircle, X } from "lucide-react";
import { Button } from "../Button";
import { formatDate } from "../utilities/FormatDate";
import toast from "react-hot-toast";
import type { SeasonBasic } from "../../types/season-basic";
import type { Season } from "../../types/season-detail";
import type { Episode } from "../../types/episode";
import type { AddMedia } from "../../types/add-media-item";
import type { Media } from "../../types/media-item";
import { useAdvancedNavigation } from "../utilities/SmartNavigate";

interface AddMediaModalProps {
  media: Media | null;
  mediaType: 'movies' | 'series';
  onClose: () => void;
  onAddItems: (items: AddMedia[]) => void;
}

export function AddMediaModal({ 
  media, mediaType, onClose, onAddItems 
}: AddMediaModalProps) {
  const { smartNavigate } = useAdvancedNavigation();
  const [view, setView] = useState<'main' | 'seasons' | 'episodes'>('main');
  
  const [seasons, setSeasons] = useState<SeasonBasic[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [isAddLoading, setIsAddLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingEpisodes, setIsLoadingEpisodes] = useState(false);

  useEffect(() => {
    if (!media) {
      setView('main');
      setSeasons([]);
      setSelectedSeason(null);
      setPage(1);
    }
  }, [media]);

  const fetchSeasons = async () => {
    if (!media) return;
    setIsLoading(true);
    setView('seasons');
    try {
      const response = await fetch(`http://localhost:3000/${mediaType}/${media.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to fetch seasons');
        return;
      }

      setSeasons(data.series.seasonsInfo || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      setView('main');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeasonDetail = async (seasonNumber: number) => {
    if (!media) return;
    setIsLoading(true);
    setView('episodes');
    setPage(1);
    try {
      const response = await fetch(`http://localhost:3000/seasons/series/${media.id}/${seasonNumber}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to fetch season details');
        return;
      }

      setSelectedSeason(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      setView('seasons');
    } finally {
      setTimeout(() => setIsLoading(false), 600);
    }
  };

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!selectedSeason?.tmdbId) return;
      setIsLoadingEpisodes(true);
      try {
        const response = await fetch(`http://localhost:3000/episodes/season/${selectedSeason.tmdbId}?page=${page}&limit=6`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch episodes');
          return;
        }

        setEpisodes(data.data);
        setTotalPages(data.lastPage);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      } finally {
        setTimeout(() => setIsLoadingEpisodes(false), 600);
      }
    };
    if (view === 'episodes') fetchEpisodes();
  }, [selectedSeason?.tmdbId, page, view]);

  if (!media) return null;

  const handleAddFullMedia = async () => {
    setIsAddLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/${mediaType}/${media.id}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to add media');
        return;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
      setView('seasons');
    } finally {
      setTimeout(() => {
        const item: AddMedia = {
          id: media.id,
          title: media.title,
          posterPath: media.posterPath,
          type: mediaType === 'movies' ? 'movie' : 'series'
        };
        onAddItems([item]);
        setIsAddLoading(false);
      }, 600);
    }
  };

  const handleAddSeason = () => {
    if (!selectedSeason) return;
    const items: AddMedia[] = [
      { id: media.id, title: media.title, posterPath: media.posterPath, type: 'series' },
      { id: selectedSeason.tmdbId, title: `Season ${selectedSeason.number}`, posterPath: selectedSeason.imagePath, type: 'season', parentId: media.id }
    ];
    onAddItems(items);
  };

  const handleAddEpisode = (ep: Episode) => {
    if (!selectedSeason) return;
    const items: AddMedia[] = [
      { id: media.id, title: media.title, posterPath: media.posterPath, type: 'series' },
      { id: selectedSeason.tmdbId, title: `Season ${selectedSeason.number}`, posterPath: selectedSeason.imagePath, type: 'season', parentId: media.id },
      { id: ep.tmdbId, title: `EP ${ep.number}: ${ep.title}`, posterPath: ep.imagePath, type: 'episode', parentId: selectedSeason.tmdbId }
    ];
    onAddItems(items);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-8" onClick={onClose}>
      <motion.div 
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ 
          opacity: 1, 
          scale: 1,
          maxWidth: view === 'main' ? '400px' : '700px' 
        }}
        className="bg-blue-background border border-white/10 rounded-[2.5rem] shadow-2xl w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative p-6 border-b border-white/5 flex flex-col items-center shrink-0">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 text-white/20 hover:text-white hover:bg-white/5 rounded-full transition-all cursor-pointer z-20">
            <X size={20} />
          </button>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-main mb-1">
            {view === 'main' ? 'Selection' : view === 'seasons' ? 'Seasons' : `Season ${selectedSeason?.number}`}
          </span>
          <h3 className="text-xl font-black uppercase italic text-white text-center truncate w-full">
            {view === 'episodes' ? selectedSeason?.title : media.title}
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto media-scrollbar p-6">
          <AnimatePresence mode="wait">
            {view === 'main' && (
              <motion.div key="main" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center gap-6">
                <div className="flex items-center justify-center gap-3 w-full">
                  <Button 
                    variant="primary" 
                    className="flex-1 max-w-45 py-3 text-[11px] font-black uppercase italic" 
                    onClick={handleAddFullMedia}
                    disabled={isAddLoading}
                  >
                    Add {mediaType === 'movies' ? 'Movie' : 'Series'}
                  </Button>

                  {mediaType === 'series' && (
                    <Button 
                      variant="ghost" 
                      className="flex-1 max-w-45 py-3 bg-white/5 border border-white/10 text-[11px] font-black uppercase" 
                      onClick={fetchSeasons}
                    >
                      Seasons/Episodes
                    </Button>
                  )}
                </div>

                <button 
                  onClick={(e) => smartNavigate(`/${mediaType}/${media.id}`, e)}
                  className="text-[9px] font-black uppercase tracking-[0.4em] text-white/20 hover:text-white transition-all cursor-pointer"
                >
                  — View Info —
                </button>
              </motion.div>
            )}

            {view === 'seasons' && (
              <motion.div key="seasons" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-4">
                {isLoading ? (
                  <div className="py-20 flex flex-col items-center justify-center">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}>
                      <div className="w-12 h-12 border-4 border-purple-main/20 border-t-purple-main rounded-full" />
                    </motion.div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {seasons.map((season) => (
                      <div key={season.number} className="group flex items-center justify-between p-4 bg-white/2 border border-white/5 rounded-2xl hover:bg-white/5 transition-all">
                        <div className="flex flex-col min-w-0">
                          <span className="text-[8px] font-black text-purple-main uppercase tracking-widest">Season {season.number}</span>
                          <h4 className="text-[11px] font-black text-white uppercase truncate">{season.title || `Season ${season.number}`}</h4>
                        </div>
                        <button 
                          onClick={() => fetchSeasonDetail(season.number)}
                          className="w-8 h-8 flex items-center justify-center bg-white/5 text-white/20 rounded-xl hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        >
                          <PlayCircle size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <Button variant="link" icon={ChevronLeft} onClick={() => setView('main')} className="text-[10px] uppercase font-black text-white/20 mt-4 self-center">
                  Back to Selection
                </Button>
              </motion.div>
            )}

            {view === 'episodes' && (
              <motion.div key="episodes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-8">
                {isLoading ? (
                  <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-purple-main" /></div>
                ) : selectedSeason && (
                  <>
                    <div className="flex gap-6 items-start">
                      <img src={selectedSeason.imagePath} className="w-24 aspect-2/3 object-cover rounded-xl border border-white/10 shadow-xl shrink-0" />
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-purple-main/20 border border-purple-main/30 text-purple-300 text-[8px] font-black uppercase rounded">S{selectedSeason.number}</span>
                            <span className="text-[10px] text-white/40 font-bold">{selectedSeason.releaseDate?.split('-')[0]}</span>
                          </div>
                          
                          <button 
                            onClick={handleAddSeason}
                            className="flex items-center gap-2 px-3 py-1 bg-purple-main/10 border border-purple-main/20 rounded-full hover:bg-purple-main transition-all group cursor-pointer"
                          >
                            <Plus size={10} className="text-purple-400 group-hover:text-white" />
                            <span className="text-[8px] font-black uppercase tracking-tighter text-purple-300 group-hover:text-white">Add Full Season</span>
                          </button>
                        </div>
                        <p className="text-xs text-white/60 italic leading-relaxed line-clamp-3 font-light mt-1">
                          {selectedSeason.overview || "No description available."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Episodes</h4>
                        <span className="text-[9px] text-purple-main font-bold uppercase tracking-widest">Page {page}/{totalPages}</span>
                      </div>
                      
                      {isLoadingEpisodes ? (
                        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-purple-main/20" size={20} /></div>
                      ) : (
                        episodes.map((ep) => (
                          <div key={ep.tmdbId} className="group flex flex-row gap-4 p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/4 hover:border-purple-main/20 transition-all duration-300">
                            <div className="relative w-32 aspect-video shrink-0 rounded-xl overflow-hidden border border-white/10 bg-black/20">
                              <img src={ep.imagePath} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all" alt={ep.title} />
                              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[8px] font-black text-purple-400">EP {ep.number}</div>
                            </div>

                            <div className="flex flex-col justify-center flex-1 min-w-0">
                              <div className="flex items-center gap-3 text-[8px] font-bold uppercase tracking-widest text-white/30 mb-1">
                                <span className="flex items-center gap-1"><Clock size={10}/> {ep.runtime > 0 ? `${ep.runtime}m` : 'N/A'}</span>
                                <span>{formatDate(ep.releaseDate)}</span>
                              </div>
                              <h5 className="text-[11px] font-black text-white uppercase truncate group-hover:text-purple-300 transition-colors">{ep.title}</h5>
                              <p className="text-[10px] text-white/40 line-clamp-2 mt-1 italic">{ep.overview || "No description."}</p>
                            </div>

                            <button 
                              className="self-center w-8 h-8 flex items-center justify-center bg-white/5 text-white/20 rounded-xl hover:bg-purple-main hover:text-white transition-all active:scale-90 cursor-pointer"
                              onClick={() => handleAddEpisode(ep)}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-4 py-2">
                      <div className="flex gap-1">
                        {[...Array(totalPages)].map((_, i) => (
                          <div key={i} className={`h-1 rounded-full transition-all duration-500 ${page === i + 1 ? 'w-6 bg-purple-main' : 'w-1 bg-white/10'}`} />
                        ))}
                      </div>
                      <div className="flex gap-8">
                        <Button variant="link" size="sm" icon={ChevronLeft} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || isLoadingEpisodes} className="text-[10px] uppercase font-black">Prev</Button>
                        <Button variant="link" size="sm" icon={ChevronRight} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || isLoadingEpisodes} className="text-[10px] uppercase font-black flex-row-reverse">Next</Button>
                      </div>
                    </div>
                  </>
                )}
                <Button variant="link" icon={ChevronLeft} onClick={() => setView('seasons')} className="text-[10px] uppercase font-black text-white/20 self-center">Back to Seasons</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}