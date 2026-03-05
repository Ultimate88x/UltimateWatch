import { useEffect, useState } from "react";

type UserProfile = {
  id: number;
  username: string;
  email: string;
  imagePath: string | null;
}

export default function UserDetails() {
  const userString = localStorage.getItem('user');
  const userData = userString ? JSON.parse(userString) : null;
  const userId = userData?.id;
  
  const [user, setUser] = useState<UserProfile | null>(null);

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

      console.log('User data:', data);

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

    return (
      <div className="relative w-full bg-cover bg-blue-background flex justify-start items-center overflow-x-hidden">
        <div className="relative w-1/3 h-fit flex flex-col justify-start items-center py-10">
          <img 
            className="mb-2 w-65 h-auto shadow-2xl object-cover border-4 rounded-full border-white/10 transition-all duration-300 group-hover:opacity-70" 
            src={user?.imagePath || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
            alt="Profile" 
          />
          <h2 className="relative text-4xl text-white font-bold font-inter">{user?.username || 'Guest'}</h2>
          <a className="relative text-lg text-white font-medium font-inter">{user?.email || 'No email provided'}</a>
        </div>
      </div>
    )
}