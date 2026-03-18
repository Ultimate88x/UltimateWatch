import type { Media } from "../../types/media";

interface ListMediaProps {
  title: string;
  mediaItems: Media[];
  columns?: number;
}

const ListMedia = ({ title, mediaItems, columns = 9 }: ListMediaProps) => {
  return (
    <div className="relative h-fit flex flex-col justify-start items-start gap-4">
      <h2 className="relative text-4xl text-white font-bold font-inter uppercase">
        {title}
      </h2>

      <div 
        className="relative w-full h-fit grid gap-4 pb-4"
        style={{ 
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` 
        }}
      >
        {mediaItems.map((media) => (
          <div key={media.id} className="relative w-44 h-68 cursor-pointer group">
            <img
              className="w-full h-full flex overflow-hidden rounded-lg bg-white/5 border border-purple-main/30"
              src={media.posterPath || "https://via.placeholder.com/400x600?text=No+Image"}
              alt={media.title}
            />
            
            <div className="absolute bottom-0 left-0 w-full p-3 bg-purple-main/15 backdrop-blur-md border-t border-purple-main/40 shadow-[0_-5px_25px_rgba(168,85,247,0.2)] rounded-b-lg">
              <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 uppercase tracking-wider drop-shadow-md">
                {media.title}
              </h3>
              <div className="mt-2 w-8 h-1 bg-purple-main rounded-full shadow-[0_0_10px_#A855F7] transform origin-left transition-transform duration-300 group-hover:scale-x-150" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListMedia;