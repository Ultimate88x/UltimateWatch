import { motion } from "framer-motion";
import type { Collection } from "../../types/collection-item";

interface ListCollectionProps {
  title: string;
  collections: Collection[];
}

const ListCollection = ({ title, collections }: ListCollectionProps) => {
  return (
    <div className="relative h-fit flex flex-col justify-start items-start gap-8 w-full">
      <div className="flex flex-col gap-2">
        <h2 className="relative text-4xl text-white font-bold font-inter uppercase tracking-tight">
          {title}
        </h2>
        <div className="h-1 w-20 bg-purple-main shadow-[0_0_12px_#A855F7] rounded-full" />
      </div>

      <div className="relative w-full h-fit flex flex-wrap justify-start items-start gap-6 pb-10">
        {collections.map((collection, index) => (
          <motion.div
            key={collection.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index % 20) * 0.04 }}
            className="flex flex-col cursor-pointer group w-44 transition-all duration-300 hover:-translate-y-2"
          >
            <div className="relative w-full aspect-2/3 overflow-hidden rounded-t-lg border-x border-t border-purple-main/30 bg-[#1a1a1a] flex">
              {collection.mediaItems.slice(0, 2).map((media, idx, array) => {
                const bgColor = idx === 0 ? "%23A855F7" : "%236366F1";
                const placeholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="400" height="600" fill="%231a1a1a"/><rect x="40" y="40" width="320" height="520" rx="10" stroke="${bgColor}" stroke-width="1" fill="none" opacity="0.2"/><path d="M160 260l80 40-80 40V260z" fill="${bgColor}" opacity="0.4"/><text x="50%" y="450" font-family="Arial" font-size="28" fill="${bgColor}" text-anchor="middle" font-weight="bold" opacity="0.5">NO IMAGE</text></svg>`;

                return (
                  <img
                    key={`${media.id}-${idx}`}
                    src={media.posterPath || placeholder}
                    className={`
                      object-cover h-full transition-transform duration-700 group-hover:scale-110
                      ${array.length === 1 ? "w-full" : "w-1/2"} 
                      ${idx === 0 && array.length > 1 ? "border-r border-purple-main/30" : ""}
                    `}
                    alt={media.title}
                    onError={(e) => {
                      e.currentTarget.src = placeholder;
                    }}
                  />
                );
              })}
              <div className="absolute inset-0 bg-linear-to-t from-purple-main/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="relative w-full p-3 bg-purple-main/15 backdrop-blur-md border border-purple-main/30 rounded-b-lg shadow-[0_10px_20px_rgba(0,0,0,0.2)] flex flex-col gap-3 transition-all duration-300 group-hover:bg-purple-main/25">
              <div className="flex flex-col gap-1">
                <h3 className="text-start text-[11px] font-bold text-white leading-tight line-clamp-1 uppercase tracking-wider">
                  {collection.title}
                </h3>
                <p className="text-[9px] font-bold text-purple-400/80 tracking-widest uppercase">
                  {collection.mediaItems.length} ITEMS
                </p>
              </div>

              <div className="relative w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full w-6 bg-purple-main shadow-[0_0_10px_#A855F7] transition-all duration-500 ease-out group-hover:w-full" />
              </div>

              <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-purple-main/40 to-transparent" />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ListCollection;