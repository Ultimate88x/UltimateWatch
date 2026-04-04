import React from 'react';
import { motion } from 'framer-motion';
import { Info, TvMinimal } from 'lucide-react';
import toast from 'react-hot-toast';
import type { WatchProvider } from '../../types/watch-provider';

interface WatchSectionProps {
  providers: WatchProvider[];
  mediaTmdbId: number;
}

const WatchSection: React.FC<WatchSectionProps> = ({ providers, mediaTmdbId }) => {
  const fetchMediaProviderLink = async (providerTmdbId: number) => {
    try {
      const response = await fetch(`http://localhost:3000/providers/link?mediaTmdbId=${mediaTmdbId}&providerTmdbId=${providerTmdbId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      const url = await response.text();

      if (!response.ok) {
        let errorMessage = 'Failed to fetch media link';
        try {
          const errorJson = JSON.parse(url);
          errorMessage = errorJson.message || errorMessage;
        } catch {
          errorMessage = url || errorMessage;
        }
        
        toast.error(errorMessage);
        return;
      }

      if (!url || url === 'null' || !url.startsWith('http')) {
        toast('Direct link not available for this provider', {
          icon: 'ℹ️',
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        });
        return;
      }

      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      console.log(message);
      toast.error(message);
    }
  };

  return (
    <div className="relative w-84 shrink-0 flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-1 h-5 bg-purple-main rounded-full"></div>
          <h3 className="text-white font-bold uppercase tracking-[0.2em] text-sm">
            Where to watch
          </h3>
        </div>
      </div>

      {providers && providers.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap gap-x-4 gap-y-9"
        >
          {providers.map((provider, index) => (
            <div key={`${provider.name}-${index}`} className="group relative flex flex-col items-center">
              <div className="absolute -top-2 w-full h-px bg-white/10 group-hover:bg-purple-main/60 transition-colors duration-300 shadow-[0_0_5px_rgba(168,85,247,0.4)]" />

              <button className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shadow-md transition-all duration-300 group-hover:scale-110 group-hover:border-purple-main/40 bg-black/20"
                onClick={() => fetchMediaProviderLink(provider.tmdbId)}
              >
                <img
                  src={provider.logoPath}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = "https://www.themoviedb.org/assets/2/v4/logos/v2/blue_square_2-d5376105963b74d8924619a44eead573a0f2b3122745a77.svg"; 
                }}
                />
              </button>

              <span className="absolute -bottom-6 scale-0 group-hover:scale-100 transition-all duration-200 text-[8px] text-purple-100 bg-purple-main/90 px-1.5 py-0.5 rounded shadow-lg z-50 pointer-events-none whitespace-nowrap font-bold uppercase tracking-widest border border-white/10">
                {provider.name}
              </span>
            </div>
          ))}
        </motion.div>
      ) : (
        <div className="-mt-2 flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-xl group">
          <div className="p-2 bg-white/5 rounded-lg">
            <TvMinimal className="w-4 h-4 text-purple-300/40" strokeWidth={2} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-purple-200/40 font-bold uppercase tracking-widest">
              Streaming
            </span>
            <span className="text-xs text-purple-100/60 font-medium italic">
              Not available
            </span>
          </div>
        </div>
      )}
      <div className="mt-2 flex justify-center items-center gap-1.5 border-t border-white/5 pt-3">
        <Info className="w-3 h-3 text-white/10" />
        <span className="text-[9px] font-medium text-white/20 uppercase tracking-tight">
          Streaming data by
        </span>
        <div className="flex items-center gap-2">
          <a
            href="https://www.justwatch.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-yellow-500/50 hover:text-yellow-500 transition-colors"
          >
            JustWatch
          </a>
          <span className="text-white/10 text-[9px]">•</span>
          <a
            href="https://www.watchmode.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] font-bold text-purple-400/50 hover:text-purple-400 transition-colors"
          >
            Watchmode
          </a>
        </div>
      </div>
    </div>
  );
};

export default WatchSection;