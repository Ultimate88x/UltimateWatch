interface Media {
  id: number;
  title: string;
  posterPath: string;
}

interface Collection {
  id: number;
  title: string;
  mediaItems: Media[];
}

interface ListCollectionProps {
  title: string;
  collections: Collection[];
}

const ListCollection = ({ title, collections }: ListCollectionProps) => {
  return (
    <div className="relative h-fit flex flex-col justify-start items-start gap-6">
      <h2 className="relative text-4xl text-white font-bold font-inter uppercase tracking-tight">
        {title}
      </h2>

      <div className="relative w-full h-fit flex flex-wrap justify-start items-start gap-6">
        {collections.map((collection) => (
          <div 
            key={collection.id} 
            className="flex flex-col cursor-pointer group w-44 transition-transform duration-300 hover:-translate-y-1"
          >
            <div className="relative w-full h-64 overflow-hidden rounded-t-lg border-x border-t border-purple-main/30 bg-[#1a1a1a] flex">
              {collection.mediaItems.slice(0, 2).map((media, index, array) => {
                // Si index es 0, usamos un púrpura. Si es 1, un tono más oscuro/azulado.
                const bgColor = index === 0 ? "%23A855F7" : "%236366F1"; 
                
                const placeholder = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600"><rect width="400" height="600" fill="%231a1a1a"/><rect x="40" y="40" width="320" height="520" rx="10" stroke="${bgColor}" stroke-width="1" fill="none" opacity="0.2"/><path d="M160 260l80 40-80 40V260z" fill="${bgColor}" opacity="0.4"/><text x="50%" y="450" font-family="Arial" font-size="28" fill="${bgColor}" text-anchor="middle" font-weight="bold" opacity="0.5">NO IMAGE</text></svg>`;

                return (
                  <img
                    key={media.id}
                    src={media.posterPath || placeholder}
                    className={`
                      object-cover h-full transition-transform duration-500 group-hover:scale-110
                      ${array.length === 1 ? 'w-full' : 'w-1/2'} 
                      ${index === 0 && array.length > 1 ? 'border-r border-purple-main/30' : ''}
                    `}
                    alt={media.title}
                    onError={(e) => { e.currentTarget.src = placeholder; }}
                  />
                );
              })}
            </div>

            <div className="relative w-full h-18 p-3 bg-purple-main/15 backdrop-blur-md border border-purple-main/30 rounded-b-lg shadow-[0_10px_20px_rgba(0,0,0,0.2)] flex flex-col justify-between transition-colors group-hover:bg-purple-main/25">
              
              <div className="flex flex-col gap-1">
                <h3 className="text-start text-[11px] font-bold text-white leading-tight line-clamp-1 uppercase tracking-wider">
                  {collection.title}
                </h3>
                <p className="text-[9px] font-bold text-purple-400/80 tracking-widest uppercase">
                  {collection.mediaItems.length} ITEMS
                </p>
              </div>
              
              <div className="w-6 h-1 bg-purple-main rounded-full shadow-[0_0_10px_#A855F7] transform origin-left transition-transform duration-300 group-hover:scale-x-150" />
              
              <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-purple-main/40 to-transparent" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListCollection;