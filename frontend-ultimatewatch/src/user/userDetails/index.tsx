import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type UserProfile = {
  id: number;
  username: string;
  email: string;
  imagePath: string | null;
}

type Movie = {
  id: number;
  title: string;
  posterPath: string;
}

type Collection = {
  id: number;
  title: string;
  movies: Movie[];
}

export default function UserDetails() {
  const userString = localStorage.getItem('user');
  const userData = userString ? JSON.parse(userString) : null;
  const userId = userData?.id;
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(null);

  const MOCK_MOVIES: Movie[] = [
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
  ];

  const MOCK_COLLECTIONS: Collection[] = [
    {
      id: 1,
      title: "Sci-Fi Masterpieces",
      movies: [MOCK_MOVIES[0], MOCK_MOVIES[1], MOCK_MOVIES[3]],
    },
    {
      id: 2,
      title: "Nolan Essentials",
      movies: [MOCK_MOVIES[0], MOCK_MOVIES[2], MOCK_MOVIES[3]],
    },
    {
      id: 3,
      title: "Adrenaline Rush",
      movies: [MOCK_MOVIES[4], MOCK_MOVIES[2]],
    },
    {
      id: 4,
      title: "All in All",
      movies: MOCK_MOVIES,
    },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      try {
      const response = await fetch(`http://localhost:3000/users/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch user');
      }

      setUser(data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    };

    fetchUser();
  }, [userId]);

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user'); 
    
    window.location.href = '/'; 
  }

  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`http://localhost:3000/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      logout();
    } catch (error) {
      console.error("Error deleting account", error);
    }
  };

  return (
    <div className="relative w-full bg-cover bg-blue-background flex justify-start items-start overflow-x-hidden">
      <div className="relative mt-8 w-1/3 h-fit flex flex-col justify-start items-center">
      <div className="relative flex flex-col justify-start items-center">
        <img 
          className="mb-2 w-65 h-auto shadow-2xl object-cover border-4 rounded-full border-white/10 transition-all duration-300 group-hover:opacity-70" 
          src={user?.imagePath || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
          alt="Profile" 
        />
        <h2 className="relative text-4xl text-white font-bold font-inter">{user?.username || 'Guest'}</h2>
        <a className="relative text-lg text-white font-medium font-inter">{user?.email || 'No email provided'}</a>
      </div>
        <button
          onClick={logout}
          className="relative mt-4 w-60 py-3 bg-purple-main rounded-md cursor-pointer font-medium text-white hover:bg-purple-main/90 transition-colors duration-300"
        >
          Sign Out
        </button>

      <div className="mt-12 pt-8 border-t border-white/10 w-60">
        <div className="flex flex-col items-start gap-2">
          <h3 className="text-xl font-bold text-red-danger uppercase tracking-widest">
            Danger Zone
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="mt-2 w-full py-2 bg-transparent border border-red-danger/50 cursor-pointer text-lg text-red-danger font-bold rounded hover:bg-red-danger hover:text-white transition-all duration-300 uppercase tracking-tighter"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>

      <div className="relative mt-8 max-w-2/3 flex flex-1 flex-col justify-start items-start gap-8">
        <div className="relative h-fit flex flex-col justify-start items-start gap-4">
          <h2 className="relative text-4xl text-white font-bold font-inter">LAST WATCHED</h2>
          <div className="relative w-full h-fit flex flex-row justify-start items-start gap-4 overflow-x-auto">
            {MOCK_MOVIES.map(movie => (
              <div key={movie.id} className="relative w-44 h-68 cursor-pointer group">
                <img
                  className="w-full h-full object-cover rounded-lg"
                  src={movie.posterPath || "https://via.placeholder.com/400x600?text=No+Image"}
                  alt={movie.title}
                />
                <div className="absolute bottom-0 left-0 w-full p-3 bg-purple-main/15 backdrop-blur-md border-t border-purple-main/40 shadow-[0_-5px_25px_rgba(168,85,247,0.2)]">
                  <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 uppercase tracking-wider drop-shadow-md">
                    {movie.title}
                  </h3>
                  <div className="mt-2 w-8 h-1 bg-purple-main rounded-full shadow-[0_0_10px_#A855F7] transform origin-left transition-transform duration-300 group-hover:scale-x-150" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-fit flex flex-col justify-start items-start gap-4">
          <h2 className="relative text-4xl text-white font-bold font-inter">HIGHEST RATED</h2>
          <div className="relative w-full h-fit flex flex-row justify-start items-start gap-4 overflow-x-auto">
            {MOCK_MOVIES.map(movie => (
              <div key={movie.id} className="relative w-44 h-68 cursor-pointer group">
                <img
                  className="w-full h-full object-cover rounded-lg"
                  src={movie.posterPath || "https://via.placeholder.com/400x600?text=No+Image"}
                  alt={movie.title}
                />
                <div className="absolute bottom-0 left-0 w-full p-3 bg-purple-main/15 backdrop-blur-md border-t border-purple-main/40 shadow-[0_-5px_25px_rgba(168,85,247,0.2)]">
                  <h3 className="text-xs font-bold text-white leading-tight line-clamp-2 uppercase tracking-wider drop-shadow-md">
                    {movie.title}
                  </h3>
                  <div className="mt-2 w-8 h-1 bg-purple-main rounded-full shadow-[0_0_10px_#A855F7] transform origin-left transition-transform duration-300 group-hover:scale-x-150" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative h-fit flex flex-col justify-start items-start gap-4">
          <h2 className="relative text-4xl text-white font-bold font-inter">PUBLIC COLLECTIONS</h2>
          <div className="relative w-full h-fit flex flex-row justify-start items-start gap-4 overflow-x-auto">
            {MOCK_COLLECTIONS.map((collection) => (
              <div key={collection.id} className="relative w-44 h-64 cursor-pointer group">
                <div className="w-full h-full flex overflow-hidden rounded-lg bg-white/5">
                  {collection.movies.slice(0, 2).map((movie, index, array) => (
                    <img
                      key={movie.id}
                      src={movie.posterPath}
                      className={`
                        object-cover h-full
                        ${array.length === 1 ? 'w-full' : 'w-1/2'} 
                        ${index === 0 && array.length > 1 ? 'border-r border-black/20' : ''}
                      `}
                      alt={movie.title}
                    />
                  ))}
                </div>

                <div className="absolute bottom-0 left-0 w-full p-3 bg-purple-main/20 backdrop-blur-md border-t border-purple-main/40 shadow-[0_-5px_25px_rgba(168,85,247,0.2)]">
                  <h3 className="text-xs font-bold text-white leading-tight line-clamp-1 uppercase tracking-wider">
                    {collection.title}
                  </h3>
                  <p className="text-[9px] font-medium text-purple-200/70">
                    {collection.movies.length} FILMS
                  </p>
                  <div className="mt-2 w-8 h-1 bg-purple-main rounded-full shadow-[0_0_10px_#A855F7] origin-left transition-transform duration-300 group-hover:scale-x-150" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 p-4 flex items-center justify-center z-50">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative max-w-md w-full bg-blue-background shadow-2xl border rounded-2xl border-white/10 p-8 "
            >
              <div className="text-center">
                <div className="mx-auto mb-4 h-16 w-16 bg-red-danger/10 rounded-full flex justify-center items-center">
                  <span className="text-3xl text-red-danger">!</span>
                </div>
                <h3 className="mb-2 text-2xl font-bold text-white uppercase font-inter">Confirm Deletion</h3>
                <p className="mb-8 text-gray-400">
                  This action is permanent. Are you sure you want to proceed?
                </p>
                
                <div className="flex gap-4">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="py-3 px-4 bg-purple-main/75 rounded-lg cursor-pointer hover:bg-purple-main/45 flex-1 text-white font-semibold transition-colors"
                  >
                    Keep Account
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 py-3 px-4 bg-red-danger text-white font-bold rounded-lg hover:bg-red-700 transition-shadow shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}