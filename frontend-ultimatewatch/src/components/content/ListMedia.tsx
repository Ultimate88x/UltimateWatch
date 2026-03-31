import { useNavigate } from "react-router-dom";
import type { Media } from "../../types/media";

interface ListMediaProps {
  title: string;
  mediaItems: Media[];
  columns?: number;
}

const ListMedia = ({ title, mediaItems, columns = 9 }: ListMediaProps) => {
  const navigate = useNavigate();
  return (
    <div className="relative h-fit flex flex-col justify-start items-start gap-6">
      <h2 className="relative text-4xl text-white font-bold font-inter uppercase tracking-tight">
        {title}
      </h2>

      <div 
        className="relative w-full h-fit grid gap-6 pb-4"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
        }}
      >
        {mediaItems.map((media) => (
          <button 
            key={media.id} 
            className="flex flex-col cursor-pointer group w-44 transition-transform duration-300 hover:-translate-y-1" 
            onClick={() => navigate(`/movies/${media.id}`)}
          >
            <div className="relative w-full h-64 overflow-hidden rounded-t-lg border-x border-t border-purple-main/30 bg-[#1a1a1a] flex items-center justify-center">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                src={media.posterPath || 
                  `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="400" height="600" fill="%231a1a1a"/><path d="M140 240l120 60-120 60V240z" fill="%23A855F7" opacity="0.6"/><rect x="80" y="180" width="240" height="240" rx="20" stroke="%23A855F7" stroke-width="2" fill="none" opacity="0.3"/><text x="50%" y="460" font-family="Arial" font-size="24" fill="%23A855F7" text-anchor="middle" font-weight="bold" letter-spacing="2" opacity="0.8">IMAGE UNAVAILABLE</text></svg>`
                }
                alt={media.title}
                onError={(e) => {
                  e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="400" height="600" fill="%231a1a1a"/><path d="M140 240l120 60-120 60V240z" fill="%23A855F7" opacity="0.6"/><rect x="80" y="180" width="240" height="240" rx="20" stroke="%23A855F7" stroke-width="2" fill="none" opacity="0.3"/><text x="50%" y="460" font-family="Arial" font-size="24" fill="%23A855F7" text-anchor="middle" font-weight="bold" letter-spacing="2" opacity="0.8">IMAGE UNAVAILABLE</text></svg>`;
                }}
              />
            </div>
            
            <div className="relative w-full h-18 p-3 bg-purple-main/15 backdrop-blur-md border border-purple-main/30 rounded-b-lg shadow-[0_10px_20px_rgba(0,0,0,0.2)] flex flex-col justify-between transition-colors group-hover:bg-purple-main/25">
              
              <h3 className="text-start text-[11px] font-bold text-white leading-tight line-clamp-2 uppercase tracking-wider">
                {media.title}
              </h3>
              
              <div className="w-6 h-1 bg-purple-main rounded-full shadow-[0_0_10px_#A855F7] transform origin-left transition-transform duration-300 group-hover:scale-x-150" />
              
              <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-purple-main/40 to-transparent" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ListMedia;