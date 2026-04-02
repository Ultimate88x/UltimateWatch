type Season = {
  tmdbId: number;
  title: string;
  number: number;
};

export const MediaNavigation = ({ 
  seasons, 
  activeId, 
  onChange 
}: { 
  seasons: Season[], 
  activeId: number | 'basic', 
  onChange: (id: number | 'basic') => void 
}) => {
  return (
    <div className="relative w-full border-b border-white/5 bg-blue-background/50 backdrop-blur-sm">
      <div className="flex items-center gap-8 overflow-x-auto media-scrollbar pb-3">
        <button
          onClick={() => onChange('basic')}
          className={`relative pb-4 px-1 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shrink-0 ${
            activeId === 'basic' 
              ? 'text-white' 
              : 'text-white/40 hover:text-white/70'
          }`}
        >
          Basic Info
          {activeId === 'basic' && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-main shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
          )}
        </button>

        {seasons.map((season) => (
          <button
            key={season.tmdbId}
            onClick={() => onChange(season.number)}
            className={`relative pb-4 px-1 text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shrink-0 ${
              activeId === season.number 
                ? 'text-white' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            {season.title}
            {activeId === season.number && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-main shadow-[0_0_12px_rgba(168,85,247,0.8)]" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};