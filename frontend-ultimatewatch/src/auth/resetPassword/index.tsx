import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { resetPasswordSchema } from "./schemas/signUpSchema";
import { Button } from "../../components/Button";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [error, setError] = useState<{ field: string; message: string } | null>(null);

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

    if (error?.field === name) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const result = resetPasswordSchema.safeParse(formData);
    if (!result.success) {
      const error = result.error.issues[0];
      setError({ 
        field: error.path[0] as string, 
        message: error.message 
      });
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
        toast.error(data.message || 'Password reset failed');
        return;
      }

      navigate('/login');

    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    }
  };

  return (
    <div className="relative w-full min-h-screen bg-cover bg-blue-background flex flex-col justify-start items-center overflow-x-hidden pb-12">
      <div className="relative w-full h-fit py-5 bg-purple-main flex flex-col justify-start items-center">
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
          <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">
            Password
          </label>
          <div className="relative w-full">
            <input
              name="password"
              value={formData.password}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className={`w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl text-white placeholder:text-white/40 focus:outline-none transition-all ${
                error?.field === "password"
                  ? "border-red-500 bg-red-500/10"
                  : "border-white/20 focus:border-purple-main focus:bg-white/20"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>
          
          {error?.field === "password" && (
            <span className="text-red-400 text-xs ml-2 mt-1 animate-in fade-in slide-in-from-top-1">
              {error.message}
            </span>
          )}
        </div>

        <div className="relative w-lg flex flex-col justify-start items-start gap-1">
          <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">Verify Password</label>
          <div className="relative w-full">
            <input
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your password" 
              className={`w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl transition-all focus:outline-none focus:bg-white/20 ${
                (formData.confirmPassword && formData.password !== formData.confirmPassword) || error?.field === "confirmPassword"
                ? "border-red-500/50 bg-red-500/10" 
                : "border-white/20 focus:border-purple-main"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
            </button>
          </div>
          {error?.field === "confirmPassword" && (
            <span className="text-red-400 text-xs ml-2 mt-1 animate-in fade-in slide-in-from-top-1 font-medium">
              {error.message}
            </span>
          )}
        </div>

        <Button 
          variant="primary" 
          size="lg" 
          fullWidth 
          className="mt-6"
        >
          Confirm New Password
        </Button>

        <Button 
          variant="link" 
          type="button"
          onClick={() => navigate('/login')} 
          className="text-sm mt-4"
        >
          Back to Email Page
        </Button>
      </form>
    </div>
  );
}