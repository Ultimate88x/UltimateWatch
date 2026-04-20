import { AnimatePresence, motion } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../Button';
import { formatDate } from '../utilities/FormatDate';
import { EmptyState } from '../EmptyState';
import type { Season } from '../../types/season-detail';
import type { Episode } from '../../types/episode';

interface SeasonDetailProps {
  seriesTmdbId: number;
  activeSeason: number | string;
}

const SeasonDetail: React.FC<SeasonDetailProps> = ({ seriesTmdbId, activeSeason }) => {
  const [season, setSeason] = useState<Season | null>(null);

  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [page, setPage] = useState(1);
  const [totalEpisodes, setTotalEpisodes] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSeasonDetail = async () => {
      try {
        const response = await fetch(`http://localhost:3000/seasons/series/${seriesTmdbId}/${activeSeason}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch season details');
          return;
        }

        setSeason(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      } finally {
        setTimeout(() => setIsLoading(false), 600);
      }
    };

    fetchSeasonDetail();
  }, [seriesTmdbId, activeSeason]);

  useEffect(() => {
    const fetchEpisodes = async () => {
      setLoadingEpisodes(true);
      try {
        const response = await fetch(`http://localhost:3000/episodes/season/${season?.tmdbId}?page=${page}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch episodes');
          return;
        }

        setEpisodes(data?.data);
        setTotalEpisodes(data?.total);
        setTotalPages(data?.lastPage);
        if (page > 1 && data?.data.length > 5) {
          document.getElementById('episodes-header')?.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
        setLoadingEpisodes(false);
      } finally {
        setLoadingEpisodes(false);
      }
    };

    if (season?.tmdbId) fetchEpisodes();
  }, [season?.tmdbId, page]);

  if (isLoading) {
    return (
      <motion.div
        key="loading-season"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full min-h-100 flex flex-col items-center justify-center py-20 bg-white/2 rounded-3xl border border-white/5 border-dashed"
      >
        <div className="relative flex items-center justify-center w-12 h-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ 
              duration: 1, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            style={{ originX: "50%", originY: "50%" }}
            className="absolute inset-0 border-2 border-purple-main/20 border-t-purple-main rounded-full"
          />
        </div>

        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-purple-200/50 font-bold uppercase tracking-[0.3em] text-[10px]"
        >
          Loading Season {activeSeason}...
        </motion.p>
      </motion.div>
    );
  }

  if (!season) {
    return <EmptyState title="Season not found" fullPage={false} showBackButton={false} />;
  }

  return (
    <div className="w-full flex flex-col gap-9">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-10 items-start"
      >
        <div className="relative w-full md:w-64 shrink-0 group">
          <div className="absolute -inset-1 bg-purple-main/20 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
          <div className="relative aspect-2/3 rounded-xl overflow-hidden border border-white/10 bg-white/5 shadow-2xl">
            <img
              src={season.imagePath}
              alt={season.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = "https://via.placeholder.com/500x750/1a1a1a/6b21a8?text=No+Poster";
              }}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6 max-w-2xl">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="px-2 py-0.5 bg-purple-main/20 border border-purple-main/30 text-purple-300 text-[10px] font-bold uppercase tracking-widest rounded">
                Season {season.number}
              </span>
              <span className="text-white/40 text-xs font-medium">
                {season.releaseDate && new Date(season.releaseDate).getFullYear()}
              </span>
              <span className="text-purple-200/30 text-[10px] font-bold uppercase tracking-[0.2em] ml-auto md:ml-0">
                {totalEpisodes} Episodes Total
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight">
              {season.title || `Season ${season.number}`}
            </h2>
          </div>

          <p className="text-purple-100/70 leading-relaxed text-sm md:text-base italic font-light">
            {season.overview || "No description available for this season."}
          </p>
        </div>
      </motion.div>

      <div className="flex flex-col gap-5">
        <div id="episodes-header" className="flex items-center justify-between border-b border-white/5 pb-4">
          <h3 className="text-white font-bold uppercase tracking-[0.2em] text-sm">Episodes</h3>
          <span className="text-[10px] text-white/20 font-bold uppercase tracking-widest">
            Page {page} of {totalPages}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 min-h-75 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {episodes.map((episode) => (
                <div
                  key={episode.tmdbId}
                  className="group flex flex-col sm:flex-row gap-6 p-4 rounded-2xl bg-white/2 border border-white/5 hover:bg-white/4 hover:border-purple-main/20 transition-all duration-300"
                >
                  <div className="relative w-full sm:w-48 aspect-video shrink-0 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <img 
                      src={episode.imagePath} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500" 
                      alt={episode.title}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "https://via.placeholder.com/320x180/1a1a1a/6b21a8?text=No+Image";
                      }}
                    />
                    <div className="absolute top-2 left-2 px-2 rounded bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-bold text-purple-400">
                      EP {episode.number}
                    </div>

                    {episode.type && episode.type !== 'standard' && (
                      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-purple-main/80 backdrop-blur-md text-[8px] font-black text-white uppercase tracking-tighter">
                        {episode.type}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-center flex-1">
                    <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/30 mb-1">
                      <span className="flex items-center gap-1">
                        <Clock size={12}/> 
                        {episode.runtime > 0 ? `${episode.runtime}m` : 'N/A'}
                      </span>
                      <span>{formatDate(episode.releaseDate)}</span>
                    </div>
                    <h4 className="text-lg font-bold text-white group-hover:text-purple-300 transition-colors">
                      {episode.title}
                    </h4>
                    <p className="text-xs text-white/40 line-clamp-2 mt-1">
                      {episode.overview || "No description available."}
                    </p>
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col items-center gap-6 mt-5">
          <div className="flex gap-1.5">
            {[...Array(totalPages)].map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-500 ${page === i + 1 ? 'w-10 bg-purple-main' : 'w-1.5 bg-white/10'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-10">
            <Button variant="link" size="sm" icon={ChevronLeft} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || loadingEpisodes}>Prev</Button>
            <Button variant="link" size="sm" icon={ChevronRight} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || loadingEpisodes} className="flex-row-reverse">Next</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeasonDetail;