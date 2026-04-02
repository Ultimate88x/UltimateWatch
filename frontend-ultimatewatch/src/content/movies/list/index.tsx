import { useCallback, useEffect, useRef, useState } from "react";
import ListMedia from "../../../components/content/ListMedia";
import toast from "react-hot-toast";
import { Button } from "../../../components/Button";
import { ChevronDown, Plus, Search, SearchX } from "lucide-react";
import type { Media } from "../../../types/media";
import { motion } from "framer-motion";
import { EmptyState } from "../../../components/EmptyState";
import type { Genre } from "../../../types/genre";
import { MoviesSortEnum, type MoviesSortOption } from "../../../enums/MoviesSortEnum";
import { useAdvancedNavigation } from "../../../components/utilities/SmartNavigate";

export default function MovieList() {
  const { smartNavigate } = useAdvancedNavigation();

  const [page, setPage] = useState(1);
  const [mediaList, setMediaList] = useState<Media[]>([]);

  const [sortBy, setSortBy] = useState<MoviesSortOption>(MoviesSortEnum.POPULARITY_DESC);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [isExcludeMode, setIsExcludeMode] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtersRef = useRef({ genres: [] as number[], exclude: false, dateFrom, dateTo, sortBy });

  const [isLoading, setIsLoading] = useState(false);

  const fetchMedia = useCallback(async (isNewSearch: boolean = false) => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    const currentPage = isNewSearch ? 1 : page;
    setIsLoading(true);

    try {
      const { genres, exclude, dateFrom, dateTo, sortBy } = filtersRef.current;
      const params = new URLSearchParams({
        page: currentPage.toString(),
      });

      if (genres.length > 0) {
        const paramKey = exclude ? 'withoutGenres' : 'withGenres';
        params.append(paramKey, genres.join(','));
      }
      if (dateFrom) {
        params.append('releaseDateGreaterEqualThan', dateFrom);
      }
      if (dateTo) {
        params.append('releaseDateLowerEqualThan', dateTo);
      }
      params.append('sort', sortBy);

      const [response] = await Promise.all([
        fetch(`http://localhost:3000/movies/tmdb-list?${params.toString()}`, {
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

      setMediaList((prev) => {
        if (isNewSearch) return data;
        const existingIds = new Set(prev.map(s => s.id));
        const uniqueNewData = data.filter((item: Media) => !existingIds.has(item.id));
        return [...prev, ...uniqueNewData];
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const [response] = await Promise.all([
          fetch(`http://localhost:3000/genres/movie`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          }),
        ]);

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch genres');
          return;
        }

        setGenres(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    filtersRef.current = { 
      genres: selectedGenres, 
      exclude: isExcludeMode,
      dateFrom,
      dateTo,
      sortBy,
    };
  }, [selectedGenres, isExcludeMode, dateFrom, dateTo, sortBy]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchMedia(true);
  };

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev => 
      prev.includes(genreId) 
        ? prev.filter(id => id !== genreId) 
        : [...prev, genreId]
    );
  };

  const clearFilters = () => {
    setSelectedGenres([]);
    setIsExcludeMode(false);
    setDateFrom("");
    setDateTo("");
  }

  if (isLoading && mediaList.length === 0) {
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
          Loading Discoveries...
        </motion.p>
      </div>
    );
  }

  if (!isLoading && mediaList.length === 0) {
    return (
      <EmptyState 
        title="No Titles Found"
        description="We couldn't find any movie discoveries for you right now."
        icon={SearchX}
      />
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-cover bg-blue-background flex flex-col justify-start items-start overflow-x-hidden">
      <div className="flex flex-row w-full pl-10 gap-10">
        <aside className="w-64 shrink-0 flex flex-col gap-6 sticky top-10 h-fit">
          <div className="flex flex-col gap-3 mb-2">
            <div className="flex items-center gap-3">
              <div className="h-4 w-1 bg-purple-main rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
              <h2 className="text-white font-black text-sm uppercase tracking-[0.4em]">
                Filters
              </h2>
            </div>
            <div className="h-0.5 w-full bg-linear-to-r from-purple-main via-purple-main/40 to-transparent opacity-100" />
          </div>
          <div className="-mt-4 flex flex-col gap-2">
            <label className="text-[10px] uppercase text-white/30 font-black ml-1 tracking-widest">
              Sort By
            </label>
            <div className="relative group">
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as MoviesSortOption)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/80 appearance-none outline-hidden focus:border-purple-main/50 transition-all cursor-pointer"
              >
                <option value={MoviesSortEnum.POPULARITY_DESC} className="bg-blue-background text-white">Most Popular</option>
                <option value={MoviesSortEnum.POPULARITY_ASC} className="bg-blue-background text-white">Least Popular</option>
                <option value={MoviesSortEnum.REVENUE_DESC} className="bg-blue-background text-white">Highest Revenue</option>
                <option value={MoviesSortEnum.REVENUE_ASC} className="bg-blue-background text-white">Lowest Revenue</option>
                <option value={MoviesSortEnum.PRIMARY_RELEASE_DATE_DESC} className="bg-blue-background text-white">Newest First</option>
                <option value={MoviesSortEnum.PRIMARY_RELEASE_DATE_ASC} className="bg-blue-background text-white">Oldest First</option>
              </select>
              
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-purple-main transition-all duration-300 group-hover:scale-110">
                <ChevronDown size={16} strokeWidth={3} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-xs uppercase tracking-[0.3em] opacity-70">
                  Genres
                </h3>
                <Button 
                  variant={isExcludeMode ? "solid-error" : "solid-accent"} 
                  size="sm"
                  className={`w-20! h-7! text-[10px] ${!isExcludeMode && 'text-purple-400'}`}
                  onClick={() => setIsExcludeMode(!isExcludeMode)}
                >
                  {isExcludeMode ? "Exclude" : "Include"}
                </Button>
              </div>
              <div className="h-px w-full bg-linear-to-r from-purple-main/70 to-transparent" />
            </div>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => {
                const isSelected = selectedGenres.includes(genre.tmdbId);
                return (
                  <button
                    key={genre.tmdbId}
                    onClick={() => toggleGenre(genre.tmdbId)}
                    className={`
                      px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300
                      border ${isSelected 
                        ? "bg-purple-main border-purple-main text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                        : "bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                      }
                    `}
                  >
                    {genre.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-white font-bold text-xs uppercase tracking-[0.3em] opacity-70">
                Release Period
              </h3>
              <div className="h-px w-full bg-linear-to-r from-purple-main/70 to-transparent" />
            </div>

            <div className="flex flex-col gap-3">
              <div className="group bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-purple-main/50 transition-all duration-300">
                <label className="block text-[10px] uppercase text-white/30 font-black mb-1 tracking-tighter">
                  Released After
                </label>
                <input 
                  type="date" 
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full bg-transparent text-white text-sm outline-hidden cursor-pointer scheme-dark opacity-60 focus:opacity-100 transition-opacity"
                />
              </div>

              <div className="group bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-purple-main/50 transition-all duration-300">
                <label className="block text-[10px] uppercase text-white/30 font-black mb-1 tracking-tighter">
                  Released Before
                </label>
                <input 
                  type="date" 
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full bg-transparent text-white text-sm outline-hidden cursor-pointer scheme-dark opacity-60 focus:opacity-100 transition-opacity"
                />
              </div>
            </div>
          </div>

          <Button 
            variant="primary" 
            fullWidth 
            icon={Search} 
            showShine 
            isLoading={isLoading}
            onClick={handleApplyFilters}
            className="
              mt-2 
              bg-linear-to-r from-purple-main to-purple-600 
              hover:shadow-[0_0_25px_rgba(168,85,247,0.4)] 
              border border-white/10
              transition-all duration-500
              [&_svg]:group-hover:scale-125 [&_svg]:group-hover:rotate-12
            "
          >
            Filter Content
          </Button>

          {(selectedGenres.length > 0 || dateFrom || dateTo || isExcludeMode) && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-white/30 hover:text-red-400 transition-colors uppercase text-[10px] tracking-widest font-black"
              onClick={clearFilters}
            >
              Reset Filters
            </Button>
          )}
        </aside>

        <div className="relative w-full h-fit pr-12 flex flex-col justify-start items-start gap-8">
          <ListMedia title={"DISCOVER MOVIES"} mediaItems={mediaList}
            onClick={(id, e) => smartNavigate(`/movies/${id}`, e)} columns={7}/>

          {mediaList.length > 0 && (<div className="relative w-full -mt-40 pt-40 flex justify-center bg-linear-to-t from-blue-background via-blue-background/90 to-transparent z-10">
            <Button
              variant="ghost"
              size="lg"
              icon={Plus}
              isLoading={isLoading}
              showShine={true}
              className="w-80 border border-purple-main/20 hover:border-purple-main/50 rounded-full hover:bg-purple-main/10 text-white/80 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] [&_svg]:hover:rotate-180"
              onClick={() => {
                setPage((prev) => prev + 1);
                setIsLoading(true);
              }}
            >
              Explore More Titles
            </Button>
          </div>)}
        </div>
      </div>
    </div>
  )
}