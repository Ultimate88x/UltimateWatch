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
    <div className="relative h-fit flex flex-col justify-start items-start gap-4">
      <h2 className="relative text-4xl text-white font-bold font-inter uppercase">
        {title}
      </h2>

      <div className="relative w-full h-fit flex flex-wrap justify-start items-start gap-4">
        {collections.map((collection) => (
          <div key={collection.id} className="relative w-44 h-64 cursor-pointer group">
            
            <div className="w-full h-full flex overflow-hidden rounded-lg bg-white/5 border border-purple-main/30">
              {collection.mediaItems.slice(0, 2).map((media, index, array) => (
                <img
                  key={media.id}
                  src={media.posterPath}
                  className={`
                    object-cover h-full
                    ${array.length === 1 ? 'w-full' : 'w-1/2'} 
                    ${index === 0 && array.length > 1 ? 'border-r border-black/40' : ''}
                  `}
                  alt={media.title}
                />
              ))}
            </div>

            <div className="absolute bottom-0 left-0 w-full p-3 bg-purple-main/20 backdrop-blur-md border-t border-purple-main/40 shadow-[0_-5px_25px_rgba(168,85,247,0.2)] rounded-b-lg">
              <h3 className="text-xs font-bold text-white leading-tight line-clamp-1 uppercase tracking-wider">
                {collection.title}
              </h3>
              <p className="text-[9px] font-medium text-purple-200/70">
                {collection.mediaItems.length} ITEMS
              </p>
              <div className="mt-2 w-8 h-1 bg-purple-main rounded-full shadow-[0_0_10px_#A855F7] origin-left transition-transform duration-300 group-hover:scale-x-150" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ListCollection;