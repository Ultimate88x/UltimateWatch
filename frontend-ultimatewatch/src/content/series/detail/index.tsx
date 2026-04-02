import { motion } from "framer-motion";
import { Activity, CalendarDays, Film, TvMinimal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { MediaPeopleSection } from "../../../components/person/MediaPeopleSection";
import { EmptyState } from "../../../components/EmptyState";
import { formatDate } from "../../../components/utilities/FormatDate";
import { MediaNavigation } from "../../../components/content/MediaNavigation";

type ProductionCompany = {
  name: string;
  logoPath?: string;
};

type Season = {
  tmdbId: number;
  title: string;
  number: number;
};

type SeriesDetail = {
  tmdbId: number;
  title: string;
  overview: string;
  imagePath: string;
  status: string;
  genres: string[];
  productionCompanies: ProductionCompany[];
  releaseDate: string | null;
  lastAirDate: string | null;
  seasonsNumber: number;
  seasonsInfo: Season[];
};

type Provider = {
  name: string;
  logoPath: string;
};

type CastMember = {
  name: string;
  character: string;
  profilePath: string;
  episodeCount: number;
};

type CrewMember = {
  name: string;
  job: string;
  profilePath: string;
  episodeCount: number;
};

export default function SeriesDetail() {
  const { tmdbId } = useParams();

  const [series, setSeries] = useState<SeriesDetail | null>(null);

  const [providers, setProviders] = useState<Provider[]>([]);

  const [cast, setCast] = useState<CastMember[]>([]);
  const [castPage, setCastPage] = useState(1);
  const [castTotalPages, setCastTotalPages] = useState(1);

  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [crewPage, setCrewPage] = useState(1);
  const [crewTotalPages, setCrewTotalPages] = useState(1);

  const [activeSeason, setActiveSeason] = useState<number | 'basic'>( 'basic' );

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSeriesDetail = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:3000/series/${tmdbId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch series details');
          return;
        }

        console.log(data.series)
        setSeries(data.series);
        setProviders(data.providers || []);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      } finally {
        setTimeout(() => setIsLoading(false), 750);
      }
    };

    fetchSeriesDetail();
  }, [tmdbId]);

  useEffect(() => {
    const fetchCastPage = async () => {
      try {
        const response = await fetch(`http://localhost:3000/person/series/cast/${series?.tmdbId}?page=${castPage}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch cast details');
          return;
        }

        setCast(data.data || []);
        setCastTotalPages(data?.lastPage || 1);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      }
    };

    if (series?.tmdbId)  fetchCastPage();
  }, [castPage, series?.tmdbId]);

    useEffect(() => {
    const fetchCrewPage = async () => {
      try {
        const response = await fetch(`http://localhost:3000/person/series/crew/${series?.tmdbId}?page=${crewPage}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || 'Failed to fetch crew details');
          return;
        }

        setCrew(data.data || []);
        setCrewTotalPages(data?.lastPage || 1);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      }
    };

    if (series?.tmdbId)  fetchCrewPage();
  }, [crewPage, series?.tmdbId]);


  if (isLoading) {
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
          Fetching Movie Data...
        </motion.p>
      </div>
    );
  }

  if (!series) {
    return <EmptyState icon={Film} />;
  }

  return (
  <div className="relative w-full bg-cover bg-blue-background flex flex-col justify-start items-start overflow-x-hidden">
    <div className="relative w-full h-auto pl-8 flex justify-start items-stretch gap-8 overflow-hidden">
      <img
        className="relative w-84 object-cover rounded-2xl shadow-lg shrink-0 self-stretch"
        src={series?.imagePath || "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=800&auto=format&fit=crop"}
        alt={series?.title || "Movie Poster"}
      />
      <div className="relative max-h-144 pl-7 pr-5 pt-5 pb-2 bg-linear-to-br from-purple-main/90 via-purple-800/60 to-blue-950/25 rounded-l-2xl text-white flex flex-1 flex-col justify-start items-start gap-3 overflow-y-auto border-l border-white/10 media-scrollbar">
        <div className="flex items-center gap-4">
          <h2 className="text-4xl font-black tracking-tight">{series?.title}</h2>
          <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-xs font-bold uppercase tracking-widest h-fit mt-2">
            {series?.status}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {series?.genres?.map((genre) => (
            <span key={genre} className="px-3 py-1 bg-white/20 rounded-full text-[0.7rem] font-bold uppercase tracking-wider border border-white/10">
              {genre}
            </span>
          ))}
        </div>

        <div className="w-full my-2 py-4 border-y border-white/10 text-lg grid grid-cols-2 gap-x-16 gap-y-5 ">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl text-purple-200">
              <CalendarDays className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-purple-200 text-xs font-bold uppercase tracking-wide">First Air Date</span>
              <p className="font-medium">{formatDate(series?.releaseDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl text-purple-200">
              <CalendarDays className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-purple-200 text-xs font-bold uppercase tracking-wide">Last Air Date</span>
              <p className="font-medium">{formatDate(series?.lastAirDate)}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl text-purple-200">
              <TvMinimal className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-purple-200 text-xs font-bold uppercase tracking-wide">Total Seasons</span>
              <p className="font-medium">{series?.seasonsNumber || 'N/A'}</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl text-purple-200">
              <Activity className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-purple-200 text-xs font-bold uppercase tracking-wide">Status</span>
              <p className="font-medium">{series?.status || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl">
          <h3 className="text-purple-200 text-xs font-bold uppercase tracking-wide mb-3">Synopsis</h3>
          <p className="text-lg leading-relaxed text-gray-100 italic font-light">
            "{series?.overview}"
          </p>
        </div>

        <div className="mt-auto py-3 text-sm text-purple-200 italic border-t border-white/5 w-full flex justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-300" />
            <span>Produced by: {series?.productionCompanies && series.productionCompanies.length > 0 ? series.productionCompanies.map((c) => c.name).join(' • ') : 'N/A'}</span>
          </div>
        </div>
      </div>
    </div>

    <div className="relative w-full h-auto mt-7 pl-8 flex justify-start items-stretch gap-8 overflow-hidden">
      <div className="relative w-84 shrink-0 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-5 bg-purple-main rounded-full"></div>
            <h3 className="text-white font-bold uppercase tracking-[0.2em] text-sm">Where to watch</h3>
          </div>
          
          <a 
            href="https://www.justwatch.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 group transition-all"
          >
            <span className="text-[9px] font-bold text-white/30 group-hover:text-white/60 tracking-tighter uppercase">
              Data from
            </span>
            <span className="text-[11px] font-black tracking-tighter text-yellow-500 group-hover:text-yellow-400 flex items-center">
              JustWatch
              <span className="ml-0.5 text-[8px] opacity-70">®</span>
            </span>
          </a>
        </div>

        {providers.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-wrap gap-x-4 gap-y-6"
          >
            {providers?.map((provider, index) => (
              <div key={index} className="group relative flex flex-col items-center">
                
                <div className="absolute -top-2 w-full h-px bg-white/10 group-hover:bg-purple-main/60 transition-colors duration-300 shadow-[0_0_5px_rgba(168,85,247,0.4)]" />

                <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shadow-md transition-all duration-300 group-hover:scale-105 group-hover:border-purple-main/40 bg-black/20">
                  <img 
                    src={provider.logoPath}
                    alt={provider.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <span className="absolute -bottom-5 scale-0 group-hover:scale-100 transition-all duration-200 text-[8px] text-purple-100 bg-purple-main/90 px-1.5 py-0.5 rounded shadow-lg z-50 pointer-events-none whitespace-nowrap font-bold uppercase tracking-widest border border-white/10">
                  {provider.name}
                </span>
              </div>
            ))}
          </motion.div>
        ) : (
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-xl group">
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
      </div>

      <div className="relative pr-8 flex flex-1 min-w-0 flex-col gap-8">
        <MediaNavigation 
          seasons={series.seasonsInfo} 
          activeId={activeSeason} 
          onChange={setActiveSeason} 
        />

        {activeSeason === 'basic' ? (
          <div className="flex flex-row gap-12 animate-in fade-in duration-500">
            <div className="flex flex-col gap-8">
              <MediaPeopleSection 
                title="Cast"
                data={cast}
                currentPage={castPage}
                totalPages={castTotalPages}
                onPageChange={(page) => setCastPage(page)}
              />

              <MediaPeopleSection 
                title="Crew"
                data={crew}
                currentPage={crewPage}
                totalPages={crewTotalPages}
                onPageChange={(page) => setCrewPage(page)}
              />
            </div>

            <div className="flex flex-col gap-4 w-80 shrink-0 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 bg-purple-main rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]"></div>
                <h3 className="text-white font-bold uppercase tracking-[0.2em] text-sm leading-none">
                  Producers
                </h3>
              </div>

              <div className="flex flex-wrap gap-3">
                {series?.productionCompanies && series.productionCompanies.length > 0 ? (
                  series.productionCompanies.map((company, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="group relative flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-main/30 transition-all duration-300"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/95 p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:bg-white transition-colors">
                        {company.logoPath ? (
                        <img
                          src={company.logoPath}
                          alt={company.name}
                          className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                          }}
                        />
                        ) : (
                          <Film className="w-4 h-4 text-purple-900/40" />
                        )}
                      </div>

                      <span className="text-[10px] text-purple-100/80 font-bold uppercase tracking-wider truncate max-w-40">
                        {company.name}
                      </span>
                    </motion.div>
                  ))
                ) : (
                <div className="flex items-center gap-3 pl-4 pr-38 py-3 bg-white/5 border border-white/5 rounded-xl group">
                    <div className="p-2 bg-white/5 rounded-lg">
                      <Film className="w-4 h-4 text-purple-300/20" />
                    </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-purple-200/40 font-bold uppercase tracking-widest">
                      Production
                    </span>
                    <span className="text-xs text-purple-100/60 font-medium italic">
                      Information not available
                    </span>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="min-h-100 flex items-center justify-center">
            <p className="text-white/20 uppercase tracking-[0.4em] text-xs font-bold">
              Season {activeSeason} Details coming soon
            </p>
          </div>
        )}
      </div>
    </div>
  </div>
  );
}