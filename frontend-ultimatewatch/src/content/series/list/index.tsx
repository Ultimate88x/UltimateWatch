import { useCallback, useEffect, useRef, useState } from "react";
import ListMedia from "../../../components/content/ListMedia";
import toast from "react-hot-toast";
import { Button } from "../../../components/Button";
import { Plus, SearchX } from "lucide-react";
import type { Media } from "../../../types/media";
import { motion } from "framer-motion";
import { EmptyState } from "../../../components/EmptyState";
import { useAdvancedNavigation } from "../../../components/utilities/SmartNavigate";
import { FilterSidebar } from "../../../components/content/FilterSidebar";
import { type SortOption, SortEnum } from "../../../enums/SortEnum";
import type { Genre } from "../../../types/genre";

export default function SeriesList() {
  const { smartNavigate } = useAdvancedNavigation();

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(false);
  const [mediaList, setMediaList] = useState<Media[]>([]);

  const [sortBy, setSortBy] = useState<SortOption>(SortEnum.POPULARITY_DESC);

  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
  const [isExcludeMode, setIsExcludeMode] = useState(false);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtersRef = useRef({ genres: [] as number[], exclude: false, dateFrom, dateTo, sortBy });

  const [isLoading, setIsLoading] = useState(true);

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
        fetch(`http://localhost:3000/series/tmdb-list?${params.toString()}`, {
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
        if (isNewSearch) return data.mediaList;
        const existingIds = new Set(prev.map(s => s.id));
        const uniqueNewData = data.mediaList.filter((item: Media) => !existingIds.has(item.id));
        return [...prev, ...uniqueNewData];
      });
      setLastPage(data.lastPage);
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
          fetch(`http://localhost:3000/genres/series`, {
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

  return (
    <div className="relative w-full min-h-screen bg-cover bg-blue-background flex flex-col justify-start items-start overflow-x-hidden">
      <div className="flex flex-row w-full pl-10 gap-10">
        <FilterSidebar 
          isMovie={false}
          genres={genres}
          selectedGenres={selectedGenres}
          onToggleGenre={toggleGenre}
          isExcludeMode={isExcludeMode}
          onToggleExcludeMode={() => setIsExcludeMode(!isExcludeMode)}
          sortBy={sortBy}
          onSortChange={setSortBy}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          onApply={handleApplyFilters}
          onReset={clearFilters}
          isLoading={isLoading}
        />

        <div className="relative w-full h-fit pr-12 flex flex-col justify-start items-start gap-8">
          {!isLoading && mediaList.length === 0 ? (
            <div className="w-full h-screen overflow-hidden">
              <EmptyState 
                  title="No Titles Found"
                  description="We couldn't find any series that matches your filters."
                  icon={SearchX}
                  fullPage={false} 
                  showBackButton={false} 
              />
            </div>
          ) : (
            <>
              <ListMedia title={"DISCOVER SERIES"} mediaItems={mediaList} onClick={(id, e) => smartNavigate(`/series/${id}`, e)} columns={7}/>

              {mediaList.length > 0 && !lastPage && (<div className="relative w-full -mt-40 pt-40 flex justify-center bg-linear-to-t from-blue-background via-blue-background/90 to-transparent z-10">
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
                  disabled={lastPage}
                >
                  Explore More Titles
                </Button>
              </div>)}
            </>
          )}
        </div>
      </div>
    </div>
  )
}