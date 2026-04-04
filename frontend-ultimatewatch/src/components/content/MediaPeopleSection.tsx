import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../Button";
import type { Person } from "../../types/person";

interface MediaPeopleSectionProps {
  title: string;
  subtitle?: string;
  data: Person[];
  currentPage: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
}

export const MediaPeopleSection = ({
  title,
  subtitle,
  data,
  currentPage,
  totalPages,
  onPageChange,
}: MediaPeopleSectionProps) => {
  
  const placeholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 185 278"><rect width="100%" height="100%" fill="%231a1a1a"/><circle cx="92.5" cy="100" r="40" fill="%23A855F7" opacity="0.5"/><path d="M20 250c0-40 30-70 72.5-70s72.5 30 72.5 70v28H20v-28z" fill="%23A855F7" opacity="0.5"/></svg>`;

  return (
    <div className="relative w-260 flex flex-col gap-3 bg-blue-background">
      <div className="flex items-baseline justify-between w-full pr-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-purple-main rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"></div>
          <h3 className="text-white font-bold uppercase tracking-[0.2em] text-sm leading-none">{title}</h3>
          
          {subtitle && (
            <span className="ml-3 px-2.5 py-1 bg-purple-main/10 border border-purple-main/30 rounded-md text-[9px] text-purple-200 font-bold uppercase tracking-widest leading-none">
              {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {data?.map((member, index) => (
          <div 
            key={`${member.name}-${index}`} 
            className="shrink-0 w-40 bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-lg hover:border-purple-main/50 transition-colors duration-300"
          >
            <div className="aspect-3/4 w-full overflow-hidden bg-[#1a1a1a]">
              <img
                className="w-full h-full object-cover pointer-events-none transition-opacity duration-300"
                src={member.profilePath ? `https://image.tmdb.org/t/p/w185${member.profilePath}` : placeholder}
                alt={member.name}
                loading="lazy"
                onError={(e) => { e.currentTarget.src = placeholder; }}
              />
            </div>
            <div className="p-3 bg-linear-to-b from-transparent to-black/20">
              <p className="text-white font-bold text-xs truncate uppercase tracking-tighter">
                {member.name}
              </p>
              <div className="flex flex-col gap-0.5 mt-1">
                <p className="text-purple-300 text-[10px] truncate opacity-80 italic">
                  {title.toLowerCase().includes("cast") ? member.character : member.job}
                </p>
                {typeof member.episodeCount === 'number' && member.episodeCount > 0 && (
                  <p className="text-[9px] text-white/40 font-mono uppercase tracking-tighter">
                    {member.episodeCount} {member.episodeCount === 1 ? 'episode' : 'episodes'}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative w-full grid grid-cols-3 items-center pt-2 border-t border-white/5">
        <div className="flex justify-start">
          {currentPage > 1 && (
            <Button 
              variant="ghost" size="sm" icon={ChevronLeft}
              className="w-auto! px-4"
              onClick={() => onPageChange(currentPage - 1)}
            >
              Prev
            </Button>
          )}
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[10px] text-purple-300/50 uppercase font-bold tracking-[0.2em]">Page</span>
          <span className="text-white font-mono text-xs">{currentPage} / {totalPages}</span>
        </div>

        <div className="flex justify-end">
          {currentPage < totalPages && (
            <Button 
              variant="ghost" size="sm" icon={ChevronRight}
              className="w-auto! px-4"
              onClick={() => onPageChange(currentPage + 1)}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};