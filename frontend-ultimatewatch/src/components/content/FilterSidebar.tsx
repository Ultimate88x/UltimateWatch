import { ChevronDown, Search } from "lucide-react";
import { Button } from "../Button";
import type { Genre } from "../../types/genre";
import { SortEnum, type SortOption } from "../../enums/SortEnum";
import toast from "react-hot-toast";

interface FilterSidebarProps {
  isMovie: boolean,
  genres: Genre[];
  selectedGenres: number[];
  onToggleGenre: (id: number) => void;
  isExcludeMode: boolean;
  onToggleExcludeMode: () => void;
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onApply: () => void;
  onReset: () => void;
  isLoading?: boolean;
}

export const FilterSidebar = ({
  isMovie,
  genres,
  selectedGenres,
  onToggleGenre,
  isExcludeMode,
  onToggleExcludeMode,
  sortBy,
  onSortChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onApply,
  onReset,
  isLoading
}: FilterSidebarProps) => {
  const hasActiveFilters = selectedGenres.length > 0 || dateFrom || dateTo || isExcludeMode;

  const handleApply = () => {
    if (dateFrom && dateTo && dateFrom > dateTo) {
      toast.error("Invalid range: 'Released After' must be before 'Released Before'.");
      return;
    }

    onApply();
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col gap-6 sticky top-10 h-fit">
      <div className="flex flex-col gap-3 mb-2">
        <div className="flex items-center gap-3">
          <div className="h-4 w-1 bg-purple-main rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
          <h2 className="text-white font-black text-sm uppercase tracking-[0.4em]">Filters</h2>
        </div>
        <div className="h-0.5 w-full bg-linear-to-r from-purple-main via-purple-main/40 to-transparent opacity-100" />
      </div>

      <div className="-mt-4 flex flex-col gap-2">
        <label className="text-[10px] uppercase text-white/30 font-black ml-1 tracking-widest">Sort By</label>
        <div className="relative group">
          <select 
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white/80 appearance-none outline-hidden focus:border-purple-main/50 transition-all cursor-pointer"
          >
            <option value={SortEnum.POPULARITY_DESC} className="bg-blue-background text-white">Most Popular</option>
            <option value={SortEnum.POPULARITY_ASC} className="bg-blue-background text-white">Least Popular</option>
            {isMovie && (<option value={SortEnum.REVENUE_DESC} className="bg-blue-background text-white">Highest Revenue</option>)}
            {isMovie && (<option value={SortEnum.REVENUE_ASC} className="bg-blue-background text-white">Lowest Revenue</option>)}
            <option value={isMovie ? SortEnum.PRIMARY_RELEASE_DATE_DESC : SortEnum.FIRST_AIR_DATE_DESC} className="bg-blue-background text-white">Newest First</option>
            <option value={isMovie ? SortEnum.PRIMARY_RELEASE_DATE_ASC : SortEnum.FIRST_AIR_DATE_ASC} className="bg-blue-background text-white">Oldest First</option>
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-hover:text-purple-main transition-all duration-300">
            <ChevronDown size={16} strokeWidth={3} />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-bold text-xs uppercase tracking-[0.3em] opacity-70">Genres</h3>
            <Button 
              variant={isExcludeMode ? "solid-error" : "solid-accent"} 
              size="sm"
              className={`w-20! h-7! text-[10px] ${!isExcludeMode && 'text-purple-400'}`}
              onClick={onToggleExcludeMode}
            >
              {isExcludeMode ? "Exclude" : "Include"}
            </Button>
          </div>
          <div className="h-px w-full bg-linear-to-r from-purple-main/70 to-transparent" />
        </div>

        {genres && genres.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.tmdbId}
                onClick={() => onToggleGenre(genre.tmdbId)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all duration-300 border ${
                  selectedGenres.includes(genre.tmdbId) 
                  ? "bg-purple-main border-purple-main text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                  : "bg-white/5 border-white/10 text-white/40 hover:border-white/30 hover:text-white"
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 px-3 bg-white/5 border border-dashed border-white/10 rounded-xl">
            <span className="text-[10px] text-white/20 font-black uppercase tracking-widest text-center">
              No genres found
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4 mt-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-white font-bold text-xs uppercase tracking-[0.3em] opacity-70">Release Period</h3>
          <div className="h-px w-full bg-linear-to-r from-purple-main/70 to-transparent" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="group bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-purple-main/50 transition-all duration-300">
            <label className="block text-[10px] uppercase text-white/30 font-black mb-1 tracking-tighter">Released After</label>
            <input 
              type="date" 
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="w-full bg-transparent text-white text-sm outline-hidden scheme-dark"
            />
          </div>
          <div className="group bg-white/5 border border-white/10 rounded-xl p-3 focus-within:border-purple-main/50 transition-all duration-300">
            <label className="block text-[10px] uppercase text-white/30 font-black mb-1 tracking-tighter">Released Before</label>
            <input 
              type="date" 
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => onDateToChange(e.target.value)}
              className="w-full bg-transparent text-white text-sm outline-hidden scheme-dark"
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
        onClick={handleApply}
        className="mt-2 bg-linear-to-r from-purple-main to-purple-600"
      >
        Filter Content
      </Button>

      {hasActiveFilters && (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full text-white/30 hover:text-red-400 transition-colors uppercase text-[10px] tracking-widest font-black"
          onClick={onReset}
        >
          Reset Filters
        </Button>
      )}
    </aside>
  );
};