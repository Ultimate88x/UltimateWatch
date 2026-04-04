import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import ListMedia from "../../components/content/ListMedia";
import ListCollection from "../../components/content/ListCollection";
import type { ExternalUserProfile } from "../../types/external-user-profile";
import type { Media } from "../../types/media-item";
import type { Collection } from "../../types/collection-item";
import { useParams } from "react-router-dom";

export default function UserDetail() {
  const { username } = useParams();

  const [user, setUser] = useState<ExternalUserProfile | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  
  
  const MOCK_MOVIES: Media[] = [
    {
      id: 1,
      title: "Interstellar",
      posterPath: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 2,
      title: "Blade Runner 2049",
      posterPath: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 3,
      title: "The Dark Knight",
      posterPath: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 4,
      title: "Inception",
      posterPath: "https://images.unsplash.com/photo-1533613220915-609f661a6fe1?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 5,
      title: "Mad Max: Fury Road",
      posterPath: "https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&q=80&w=400",
    },
    {
      id: 6,
      title: "The Martian",
      posterPath: "https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?auto=format&fit=crop&q=80&w=400",
    },
  ];

  const MOCK_COLLECTIONS: Collection[] = [
    {
      id: 1,
      title: "Sci-Fi Masterpieces",
      mediaItems: [MOCK_MOVIES[0], MOCK_MOVIES[1], MOCK_MOVIES[3]],
    },
    {
      id: 2,
      title: "Nolan Essentials",
      mediaItems: [MOCK_MOVIES[0], MOCK_MOVIES[2], MOCK_MOVIES[3]],
    },
    {
      id: 3,
      title: "Adrenaline Rush",
      mediaItems: [MOCK_MOVIES[4], MOCK_MOVIES[2]],
    },
    {
      id: 4,
      title: "All in All",
      mediaItems: MOCK_MOVIES,
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
      const response = await fetch(`http://localhost:3000/users/profile/${username}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || 'Failed to fetch user');
        return;
      }

      setUser(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        toast.error(message);
      } finally {
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    fetchUser();
  }, [username]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-blue-background flex flex-col items-center justify-center">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
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
          className="mt-6 text-white font-inter font-bold tracking-widest uppercase text-sm"
        >
          Loading Profile...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-cover bg-blue-background flex justify-start items-start overflow-x-hidden">
      <div className="relative w-1/3 h-fit flex flex-col justify-start items-center">
        <div className="relative w-full flex flex-col justify-start items-center">
          <img 
            className="mb-2 w-65 h-auto shadow-2xl object-cover border-4 rounded-full border-white/10 transition-all duration-300 group-hover:opacity-70" 
            src={user?.imagePath || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
            alt="Profile" 
          />
          <h2 className="relative text-4xl text-white font-bold font-inter">{user?.username || 'Guest'}</h2>
        </div>
      </div>

      <div className="relative max-w-2/3 pr-10 flex flex-1 flex-col justify-start items-start gap-8">
        <ListMedia title="Last Watched" mediaItems={MOCK_MOVIES} columns={6} onClick={() => console.log("Clicked!")} />
  
        <ListMedia title="Highest Rated" mediaItems={MOCK_MOVIES} columns={6} onClick={() => console.log("Clicked!")} />

        <ListCollection title="Public Collections" collections={MOCK_COLLECTIONS} />
      </div>
    </div>
  )
}