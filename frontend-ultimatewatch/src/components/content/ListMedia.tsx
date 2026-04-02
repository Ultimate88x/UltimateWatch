import type { Media } from "../../types/media";
import { motion } from "framer-motion";

interface ListMediaProps {
  title: string;
  mediaItems: Media[];
  columns?: number;
  onClick: (id: number) => void;
}

const ListMedia = ({ title, mediaItems, columns = 9, onClick }: ListMediaProps) => {
  const imageFallback = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="400" height="600" fill="%231a1a1a"/><path d="M140 240l120 60-120 60V240z" fill="%23A855F7" opacity="0.6"/><rect x="80" y="180" width="240" height="240" rx="20" stroke="%23A855F7" stroke-width="2" fill="none" opacity="0.3"/><text x="50%" y="460" font-family="Arial" font-size="24" fill="%23A855F7" text-anchor="middle" font-weight="bold" letter-spacing="2" opacity="0.8">IMAGE UNAVAILABLE</text></svg>`;

  return (
    <div className="relative h-fit flex flex-col justify-start items-start gap-8 w-full">
      <div className="flex flex-col gap-2">
        <h2 className="relative text-4xl text-white font-bold font-inter uppercase tracking-tight">
          {title}
        </h2>
        <div className="h-1 w-20 bg-purple-main shadow-[0_0_12px_#A855F7] rounded-full" />
      </div>

      <div 
        className="relative w-full h-fit grid gap-6 pb-10"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
        }}
      >
        {mediaItems.map((media, index) => (
          <motion.button 
            key={media.id} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 20) * 0.04 }}
            className="flex flex-col cursor-pointer group w-full transition-all duration-300 hover:-translate-y-2" 
            onClick={() => {onClick(media.id)}}
          >
            <div className="relative w-full aspect-2/3 overflow-hidden rounded-t-lg border-x border-t border-purple-main/30 bg-[#1a1a1a] flex items-center justify-center">
              <img
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                src={media.posterPath || imageFallback}
                alt={media.title}
                onError={(e) => {
                  e.currentTarget.src = imageFallback;
                }}
              />
              <div className="absolute inset-0 bg-linear-to-t from-purple-main/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            
            <div className="relative w-full p-3 bg-purple-main/15 backdrop-blur-md border border-purple-main/30 rounded-b-lg shadow-[0_10px_20px_rgba(0,0,0,0.2)] flex flex-col gap-3 transition-all duration-300 group-hover:bg-purple-main/25">
              
              <h3 className="text-start text-[11px] font-bold text-white leading-tight line-clamp-2 uppercase tracking-wider min-h-7">
                {media.title}
              </h3>
              
              <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full w-6 bg-purple-main shadow-[0_0_10px_#A855F7] transition-all duration-500 ease-out group-hover:w-full" 
                />
              </div>
              
              <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-purple-main/40 to-transparent" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default ListMedia;