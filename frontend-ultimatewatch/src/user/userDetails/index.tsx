import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SquarePen, UploadCloud, Eye, EyeOff, LogOut, X } from "lucide-react";
import { updateUserSchema } from "./schemas/updateUserSchema";
import toast from "react-hot-toast";
import ListMedia from "../../components/content/ListMedia";
import ListCollection from "../../components/content/ListCollection";

type UserProfile = {
  id: number;
  username: string;
  email: string;
  imagePath: string | null;
}

type Media = {
  id: number;
  title: string;
  posterPath: string;
}

type Collection = {
  id: number;
  title: string;
  mediaItems: Media[];
}

export default function UserDetails() {
  const userString = localStorage.getItem('user');
  const userData = userString ? JSON.parse(userString) : null;
  const userId = userData?.id;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    oldPassword: '',
    password: '',
    confirmPassword: '',
    imagePath: null as File | null,
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const [user, setUser] = useState<UserProfile | null>(null);
  
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
      const response = await fetch(`http://localhost:3000/users/${userId}`, {
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
  }, [userId]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username,
        email: user.email,
        oldPassword: '',
        password: '',
        confirmPassword: '',
      }));
    
    setImagePreview(user.imagePath);
    setShowPasswordFields(false);
    setIsUpdating(false);
    }
  }, [user]);

  const getBaseImagePath = (username?: string) => {
    return username && username !== "" ? `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6D28D9&color=fff` : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  }

  const logout = () => {
    localStorage.removeItem('token');
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
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true)
    
    const result = updateUserSchema.safeParse(formData);
    if (!result.success) {
      const error = result.error.issues[0];
      setError({ 
        field: error.path[0] as string, 
        message: error.message 
      });
      return;
    }

    const finalData = new FormData();

    if (formData.username) finalData.append('username', formData.username);
    if (formData.email) finalData.append('email', formData.email);
    if (formData.oldPassword) finalData.append('oldPassword', formData.oldPassword);
    if (formData.password) finalData.append('password', formData.password);
    
    if (formData.imagePath instanceof File) {
        finalData.append('file', formData.imagePath);
    } else if (imagePreview === null) {
      finalData.append('imagePath', "Delete");
    }
    
    try {
			const response = await fetch(`http://localhost:3000/users/${userId}`, {
				method: 'PATCH',
				headers: {
					'Authorization': `Bearer ${localStorage.getItem('token')}`
				},
				body: finalData,
			});

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        const lowerMessage = message.toLowerCase();
        
        let field = 'general';
        if (lowerMessage.toLowerCase().includes('username')) field = 'username';
        else if (message.toLowerCase().includes('email')) field = 'email';
        else if (message.toLowerCase().includes('old password')) field = 'oldPassword';
        else if (message.toLowerCase().includes('password')) field = 'password';

        setError({ field, message: message });
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const updatedUser = {
        ...currentUser,
        id: data.id,
        username: data.username
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));

      const img = new Image();
      img.src = data.imagePath || getBaseImagePath(data.username);
      
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
        setTimeout(resolve, 100); 
      });
      
      setUser(data); 
      toast.success("Profile updated!");

    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    } finally {
      setTimeout(() => setIsLoading(false), 500);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (error?.field === name) {
      setError(null);
    }
  };

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        imagePath: file
      });

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImagePreview(null);
    setFormData({
      ...formData,
      imagePath: null
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCancelUpdate = () => {
    setIsUpdating(false);
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      oldPassword: '',
      password: '',
      confirmPassword: '',
      imagePath: null
    });
    
    setImagePreview(user?.imagePath || getBaseImagePath(user?.username));
    setShowPasswordFields(false);
  };

  const profileInfo = () => {
    if (isUpdating) {
      const currentImageToShow = imagePreview ? imagePreview : getBaseImagePath(formData.username);

      return (
        <form 
          onSubmit={handleSubmit}
          className="relative w-2/3 flex flex-col justify-start items-center gap-4"
        >
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img 
              className="mb-2 w-65 h-65 shadow-2xl object-cover border-4 rounded-full border-white/10 transition-all duration-300 group-hover:opacity-70" 
              src={currentImageToShow} 
              alt="Profile Preview" 
            />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center rounded-full">
              <UploadCloud size={64} className="text-white mb-2" />
              <span className="px-2 py-1 bg-black/50 rounded text-lg text-white font-bold">Change picture</span>
            </div>

            {(imagePreview || user?.imagePath) && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-0 -right-5 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-transform hover:scale-110 active:scale-90 z-10"
                title="Remove image"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <input 
            type="file"
            name="image"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <div className="relative w-full flex flex-col justify-start items-start gap-1">
            <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">Username</label>
            <input
              name="username"
              value={formData.username? formData.username : ''}
              onChange={handleChange}
              type="text" 
              placeholder="Username" 
              className="w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-main focus:bg-white/20 transition-all"
            />
            {error?.field === "username" && (
              <span className="text-red-400 text-xs ml-2 mt-1 animate-in fade-in slide-in-from-top-1">
                {error.message}
              </span>
            )}
          </div>

          <div className="relative w-full flex flex-col justify-start items-start gap-1">
            <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">Email</label>
            <input
              name="email"
              value={formData.email? formData.email : ''}
              onChange={handleChange}
              type="email" 
              placeholder="your@email.com" 
              className="w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-main focus:bg-white/20 transition-all"
            />
            {error?.field === "email" && (
              <span className="text-red-400 text-xs ml-2 mt-1 animate-in fade-in slide-in-from-top-1">
                {error.message}
              </span>
            )}            
          </div>

          <div className="w-full mt-6 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowPasswordFields(!showPasswordFields)}
              className="flex items-center justify-between w-full px-2 py-2 cursor-pointer text-white/70 hover:text-purple-main transition-colors group"
            >
              <span className="text-sm font-bold uppercase tracking-widest">Change Password</span>
              <motion.div
                animate={{ rotate: showPasswordFields ? 180 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <SquarePen size={18} className="group-hover:scale-110 transition-transform" />
              </motion.div>
            </button>

            <AnimatePresence>
              {showPasswordFields && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden flex flex-col gap-4 mt-4"
                >
                  <div className="relative w-full flex flex-col justify-start items-start gap-1">
                    <label className="font-inter font-medium text-white/90 ml-2 text-sm">Old Password</label>
                    <div className="relative w-full">
                      <input
                        name="oldPassword"
                        onChange={handleChange}
                        type={showPassword ? "text" : "password"}
                        placeholder="Current password"
                        className="w-full px-4 py-3 bg-white/10 border-2 rounded-2xl border-white/20 text-white focus:border-purple-main transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {error?.field === "oldPassword" && (
                      <span className="text-red-400 text-xs ml-2">{error.message}</span>
                    )}
                  </div>

                  <div className="relative w-full flex flex-col justify-start items-start gap-1">
                    <label className="font-inter font-medium text-white/90 ml-2 text-sm">New Password</label>
                    <div className="relative w-full">
                      <input
                        name="password"
                        onChange={handleChange}
                        type={showPassword ? "text" : "password"}
                        placeholder="New password"
                        className="w-full px-4 py-3 bg-white/10 border-2 rounded-2xl border-white/20 text-white focus:border-purple-main transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {error?.field === "password" && (
                      <span className="text-red-400 text-xs ml-2">{error.message}</span>
                    )}
                  </div>

                  <div className="relative w-full flex flex-col justify-start items-start gap-1">
                    <label className="font-inter font-medium text-white/90 ml-2 text-sm">Verify Password</label>
                    <div className="relative w-full">
                      <input
                        name="confirmPassword"
                        onChange={handleChange}
                        type={showPassword ? "text" : "password"}
                        placeholder="Repeat new password"
                        className={`w-full px-4 py-3 bg-white/10 border-2 rounded-2xl transition-all ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword 
                          ? "border-red-500/50" 
                          : "border-white/20 focus:border-purple-main"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60"
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {error?.field === "confirmPassword" && (
                      <span className="text-red-400 text-xs ml-2">{error.message}</span>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="w-full flex justify-end items-center gap-4 mt-4">
            <button 
              type="button"
              onClick={handleCancelUpdate}
              className="mt-6 w-60 py-4 bg-gray-500 rounded-xl text-white font-bold cursor-pointer active:scale-95 hover:bg-gray-600 transition-all shadow-xl flex justify-center items-center gap-2"
            >
              CANCEL
            </button>
            <button 
              type="submit"
              className="mt-6 w-60 py-4 bg-purple-main rounded-xl text-white font-bold cursor-pointer active:scale-95 hover:bg-purple-main/90 transition-all shadow-xl flex justify-center items-center gap-2"
            >
              UPDATE PROFILE
            </button>
          </div>
        </form>
      )
    } else {
      return (
        <>
          <button className="absolute right-1/4 cursor-pointer hover:text-purple-main transition-colors"
              onClick={() => setIsUpdating(!isUpdating)}>
                {!isUpdating && <SquarePen size={24} />}
          </button>
          <img 
            className="mb-2 w-65 h-auto shadow-2xl object-cover border-4 rounded-full border-white/10 transition-all duration-300 group-hover:opacity-70" 
            src={user?.imagePath || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
            alt="Profile" 
          />
          <h2 className="relative text-4xl text-white font-bold font-inter">{user?.username || 'Guest'}</h2>
          <a className="relative text-lg text-white font-medium font-inter">{user?.email || 'No email provided'}</a>

          <button
            onClick={logout}
            className="relative mt-6 w-60 py-3 overflow-hidden rounded-xl cursor-pointer bg-white/5 font-inter font-semibold text-white hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/50 flex items-center justify-center gap-2 group transition-all duration-300"
          >
            <div className="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/5 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
            
            <LogOut size={20} className="transition-transform duration-300 group-hover:-translate-x-1" />
            <span>Log Out</span>
          </button>
        </>
      )
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-blue-background flex flex-col items-center justify-center">
        <motion.div
          animate={{
            rotate: [0, 360],
          }}
          transition={{
            duration: 2,
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
          {profileInfo()}
        </div>

        {!isUpdating && (
          <div className="absolute top-213.5 pt-8 border-t border-white/10 w-60">
            <div className="flex flex-col items-start gap-2">
              <h3 className="text-xl font-bold text-red-danger uppercase tracking-widest">
                Danger Zone
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button 
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="mt-2 w-full py-2 bg-transparent border border-red-danger/50 cursor-pointer text-lg text-red-danger font-bold rounded hover:bg-red-danger hover:text-white transition-all duration-300 uppercase tracking-tighter"
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="relative max-w-2/3 flex flex-1 flex-col justify-start items-start gap-8">
        <ListMedia title="Last Watched" mediaItems={MOCK_MOVIES} />
  
        <ListMedia title="Highest Rated" mediaItems={MOCK_MOVIES} />

        <ListCollection title="Public Collections" collections={MOCK_COLLECTIONS} />
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