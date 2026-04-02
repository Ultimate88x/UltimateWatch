import { motion } from "framer-motion";
import { Activity, CalendarDays, Film, TvMinimal } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useParams } from "react-router-dom";
import { MediaPeopleSection } from "../../../components/content/MediaPeopleSection";
import { EmptyState } from "../../../components/EmptyState";
import { formatDate } from "../../../components/utilities/FormatDate";
import { MediaNavigation } from "../../../components/content/MediaNavigation";
import WatchSection from "../../../components/content/WatchSection";
import ProductionSection from "../../../components/content/ProductionSection";

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
      <WatchSection providers={providers} />

      <div className="relative pr-8 flex flex-1 min-w-0 flex-col gap-8">
        <MediaNavigation 
          seasons={series.seasonsInfo} 
          activeId={activeSeason} 
          onChange={setActiveSeason} 
        />

        {activeSeason === 'basic' ? (
          <div className="flex gap-12 animate-in fade-in duration-500">
            <div className="flex flex-col gap-8">
              <MediaPeopleSection 
                title="Main Cast"
                data={cast}
                currentPage={castPage}
                totalPages={castTotalPages}
                onPageChange={(page) => setCastPage(page)}
              />

              <MediaPeopleSection 
                title="Main Crew"
                data={crew}
                currentPage={crewPage}
                totalPages={crewTotalPages}
                onPageChange={(page) => setCrewPage(page)}
              />
            </div>

            <ProductionSection companies={series?.productionCompanies} />
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