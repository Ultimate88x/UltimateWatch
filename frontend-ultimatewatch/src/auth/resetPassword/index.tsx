import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
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
			const response = await fetch('http://localhost:3000/auth/reset-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
          token: token,
					newPassword: formData.password,
				}),
			});

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }

      navigate('/login');

    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      alert(message); 
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-cover bg-blue-background flex flex-col justify-start items-center overflow-x-hidden pb-12">
      <div className="relative mt-8 w-full h-fit py-5 bg-purple-main flex flex-col justify-start items-center">
        <h1 className="relative text-8xl text-white font-bold font-inter uppercase tracking-tighter">RESET PASSWORD</h1>
        <h2 className="relative mt-2 text-4xl text-white font-semibold font-inter text-center px-4">TYPE YOUR NEW PASSWORD</h2>
      </div>

      <form 
        onSubmit={handleSubmit}
        className="relative mt-8 flex flex-col justify-start items-center gap-4"
      >
        <div className="w-40 h-40 flex justify-center items-center shadow-2xl mb-2 border-4 border-white/10 rounded-3xl bg-white/5 transition-all duration-300 hover:scale-105">
          <KeyRound 
            size={100} 
            strokeWidth={1} 
            className="text-white" 
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
          CONFIRM NEW PASSWORD
        </button>

        <button 
          type="button"
          onClick={() => navigate('/login')}
          className="text-sm text-white/60 cursor-pointer hover:text-white transition-colors underline-offset-4 hover:underline">
          Back to Email Page
				</button>
      </form>
    </div>
  );
}