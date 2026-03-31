import { useEffect, useState } from "react";
import ListMedia from "../../components/content/ListMedia";
import toast from "react-hot-toast";
import { Button } from "../../components/Button";
import { Plus, SearchX } from "lucide-react";
import type { Media } from "../../types/media";
import { motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../../components/EmptyState";

export default function SearchResultsList() {
  const [page, setPage] = useState(1);
  const [mediaList, setMediaList] = useState<Media[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [searchParams] = useSearchParams();
  const media = searchParams.get('media');
  const query = searchParams.get('query');

  useEffect(() => {
    const fetchMedia = async () => {
      setIsLoading(true);
      const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      try {
        const [response] = await Promise.all([
          fetch(`http://localhost:3000/${media}/tmdb-search?query=${query}&page=${page}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
          }),
          wait(1000)
        ]);

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch media');
          return;
        }

        setMediaList((prev) => {
          if (page === 1) return data;

          const existingIds = new Set(prev.map(s => s.id));
          const uniqueNewData = data.filter((item: Media) => !existingIds.has(item.id));
          return [...prev, ...uniqueNewData];
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMedia();
  }, [media, page, query]);

  useEffect(() => {
    setPage(1);
    setMediaList([]);
  }, [media, query]);

  if (isLoading && mediaList.length === 0) {
    return (
      <div className="fixed inset-0 bg-blue-background flex flex-col items-center justify-center">
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
          Loading Discoveries...
        </motion.p>
      </div>
    );
  }

  
  if (!isLoading && mediaList.length === 0) {
    return (
      <EmptyState 
        title="No Titles Found"
        description="We couldn't find any media that matches the query."
        icon={SearchX}
      />
    );
  }

  return (
    <div className="relative w-full min-h-screen bg-cover bg-blue-background flex flex-col justify-start items-start overflow-x-hidden">
      <div className="relative w-full h-fit px-20 flex flex-col justify-start items-start gap-8">
        <ListMedia title={`SEARCH RESULTS FOR: ${media} - ${query}`} mediaItems={mediaList} />

        {mediaList.length > 0 && (<div className="relative w-full -mt-40 pt-40 flex justify-center bg-linear-to-t from-blue-background via-blue-background/90 to-transparent z-10">
          <Button
            variant="ghost"
            size="lg"
            icon={Plus}
            isLoading={isLoading}
            showShine={true}
            className="w-80 border border-purple-main/20 hover:border-purple-main/50 rounded-full hover:bg-purple-main/10 text-white/80 hover:text-white transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0)] hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] [&_svg]:hover:rotate-180"
            onClick={() => setPage((prev) => prev + 1)}
          >
            Load More Results
          </Button>
        </div>)}
      </div>
    </div>
  )
}