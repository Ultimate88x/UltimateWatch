import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    
    try {
      const response = await fetch('http://localhost:3000/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify({
        id: data.userId,
        username: data.username
      }));

      navigate('/');

    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      alert(message); 
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-cover bg-blue-background flex flex-col justify-start items-center overflow-x-hidden pb-12">
      <div className="relative mt-8 w-full h-fit py-5 bg-purple-main flex flex-col justify-start items-center">
        <h1 className="relative text-8xl text-white font-bold font-inter uppercase tracking-tighter">Sign Up</h1>
        <h2 className="relative mt-2 text-4xl text-white font-semibold font-inter text-center px-4">JOIN US AND ENJOY ALL THE FEATURES!</h2>
      </div>

      <form 
        onSubmit={handleSubmit}
        className="relative mt-8 flex flex-col justify-start items-center gap-4"
      >
				<img 
					className="w-48 h-auto rounded-full shadow-2xl" 
					src={
						formData.username 
							? `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.username)}&background=random&color=random` 
							: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
					}
					alt="Profile" 
				/>
        <div className="relative w-lg flex flex-col justify-start items-start gap-1">
          <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">Username</label>
          <input
            required
            name="username"
            value={formData.username}
            onChange={handleChange}
            type="text" 
            placeholder="Username" 
            className="w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-main focus:bg-white/20 transition-all"
          />
        </div>

        <div className="relative w-lg flex flex-col justify-start items-start gap-1">
          <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">Email</label>
          <input
            required
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email" 
            placeholder="your@email.com" 
            className="w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-main focus:bg-white/20 transition-all"
          />
        </div>

        <div className="relative w-lg flex flex-col justify-start items-start gap-1">
          <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">Password</label>
          <div className="relative w-full">
            <input
              required
              name="password"
              value={formData.password}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              placeholder="Password" 
              className="w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-main focus:bg-white/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>
        </div>

        <div className="relative w-lg flex flex-col justify-start items-start gap-1">
          <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">Verify Password</label>
          <div className="relative w-full">
            <input
              required
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your password" 
              className={`w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl transition-all focus:outline-none focus:bg-white/20 ${
                formData.confirmPassword && formData.password !== formData.confirmPassword 
                ? "border-red-500/50" 
                : "border-white/20 focus:border-purple-main"
              }`}
            />
          </div>
					<button
						type="button"
						onClick={() => setShowPassword(!showPassword)}
						className="absolute right-4 top-12.5 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
					>
            {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <span className="text-red-400 text-xs ml-2 mt-1">Passwords do not match yet</span>
          )}
        </div>

        <button 
          type="submit"
          className="mt-6 w-full py-4 bg-purple-main rounded-xl text-white font-bold cursor-pointer active:scale-95 hover:bg-purple-600 transition-all shadow-xl flex justify-center items-center gap-2"
        >
          CREATE ACCOUNT
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-white/85">
        Already have an account? <Link to="/login" className="text-white font-bold cursor-pointer hover:underline">Log In</Link>
      </p>
    </div>
  );
}