import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, SearchX, ChevronDown } from 'lucide-react';
import ListMedia from './ListMedia';
import { AddMediaModal } from './AddMediaModal';
import toast from 'react-hot-toast';
import type { AddMedia } from '../../types/add-media-item';
import { Button } from '../Button';
import { EmptyState } from '../EmptyState';

interface SearchForMediaProps {
  selectedMedia: AddMedia[];
  setSelectedMedia: React.Dispatch<React.SetStateAction<AddMedia[]>>;
}

export const SearchForMedia: React.FC<SearchForMediaProps> = ({
  selectedMedia,
  setSelectedMedia,
}) => {
  const [mediaList, setMediaList] = useState<AddMedia[]>([]);
  const [mediaType, setMediaType] = useState<'movies' | 'series'>('movies');
  const [searchText, setSearchText] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<number | null>(null);

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      try {
        const endpoint = query 
          ? `http://localhost:3000/${mediaType}/tmdb-search?query=${query}&page=${page}`
          : `http://localhost:3000/${mediaType}/tmdb-list?page=${page}`;
        
        const response = await fetch(endpoint);
        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to fetch media list");
          return;
        }
        
        setMediaList(data.mediaList || []);
        setLastPage(data.lastPage);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [query, page, mediaType]);

  const toggleMediaSelection = (id: number) => {
    setSelectedMediaId(selectedMediaId === id ? null : id);
  };

  const handleAddItemsToLineup = (newItems: AddMedia[]) => {
    const itemsToAdd = newItems.filter(newItem => 
      !selectedMedia.some(existing => existing.id === newItem.id && existing.type === newItem.type)
    );

    if (itemsToAdd.length === 0) {
      toast.error("Already in your lineup");
      return;
    }

    setSelectedMedia(prevLineup => [...prevLineup, ...itemsToAdd]);

    const mainItem = newItems[newItems.length - 1];
    toast.success(`${mainItem.title} added`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="col-span-6 h-full flex flex-col"
    >
      <div className="bg-white/2 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md flex flex-col h-187.5">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-6 shrink-0">
          Content Explorer
        </h3>
        
        <div className="relative flex flex-col gap-6 h-full overflow-hidden">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(searchText);
            }}
            className="relative flex items-center bg-white/10 border-2 border-white/20 rounded-2xl focus-within:border-purple-main focus-within:bg-white/20 transition-all px-3 group"
          >
            <div className="relative flex items-center">
              <select 
                className="appearance-none bg-transparent py-3 pl-2 pr-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 cursor-pointer focus:outline-none hover:text-purple-main transition-colors"
                onChange={(e) => {
                  setMediaType(e.target.value as 'movies' | 'series');
                }}
                value={mediaType}
              >
                <option value="movies" className="bg-blue-background text-white">Movies</option>
                <option value="series" className="bg-blue-background text-white">Series</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 text-white/20 pointer-events-none" />
            </div>

            <div className="h-6 w-px bg-white/10 mx-2" />

            <input 
              type="text"
              value={searchText}
              placeholder={`Search ${mediaType === 'movies' ? 'movies' : 'series'}...`}
              className="flex-1 bg-transparent border-none py-3 px-2 text-white placeholder:text-white/20 focus:outline-none focus:ring-0 text-sm"
              onChange={(e) => setSearchText(e.target.value)}
            />

            <button 
              type="submit" 
              disabled={isLoading}
              className="p-2 text-white/20 hover:text-purple-main transition-colors group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Search 
                className="transition-transform group-hover:scale-115 group-active:scale-95" 
                size={18} 
              />
            </button>
          </form>

          <div className="flex-1 overflow-y-auto pr-4 media-scrollbar relative">
            {isLoading ? (
              <div className="h-full w-full flex flex-col items-center justify-center py-20">
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
                  Loading content...
                </motion.p>
              </div>
            ) : mediaList.length === 0 ? (
              <EmptyState 
                title="No Titles Found"
                description="Try another search."
                icon={SearchX}
                fullPage={false} 
                showBackButton={false} 
              />
            ) : (
              <div className="flex flex-col gap-8">
                <div className="relative">
                  <ListMedia 
                    mediaItems={mediaList} 
                    onClick={(id) => toggleMediaSelection(id)} 
                    columns={4} 
                  />

                  <AddMediaModal 
                    media={mediaList.find(m => m.id === selectedMediaId) || null}
                    mediaType={mediaType}
                    onClose={() => setSelectedMediaId(null)}
                    onAddItems={handleAddItemsToLineup}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center w-full pt-4 mt-2 border-t border-white/5 shrink-0 bg-transparent">
            <Button
              variant="ghost"
              size="sm"
              disabled={page === 1 || isLoading}
              onClick={() => setPage(prev => prev - 1)}
              className="text-white/40 hover:text-white"
            >
              Previous
            </Button>
            
            <span className="text-[10px] font-mono text-purple-main">PAGE {page}</span>

            <Button
              variant="ghost"
              size="sm"
              disabled={lastPage || isLoading}
              onClick={() => setPage(prev => prev + 1)}
              className="text-white/40 hover:text-white"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};