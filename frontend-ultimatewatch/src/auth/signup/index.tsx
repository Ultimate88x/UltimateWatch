import { useRef, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, UploadCloud, X } from "lucide-react";
import { signUpSchema } from "./schemas/signUpSchema";

export default function SignUp() {
  const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);

  const [serverError, setServerError] = useState<{ field: string; message: string } | null>(null);

  const [showPassword, setShowPassword] = useState(false);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePath, setImagePath] = useState<string>("https://cdn-icons-png.flaticon.com/512/149/149071.png");

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
		imagePath: null as File | null,
  });

  useEffect(() => {
    setImagePath(`https://ui-avatars.com/api/?name=${encodeURIComponent(formData.username)}&background=6D28D9&color=fff`)
  }, [formData.username]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (serverError?.field === name) {
      setServerError(null);
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setServerError(null);
    
    const result = signUpSchema.safeParse(formData);
    if (!result.success) {
      const error = result.error.issues[0];
      setServerError({ 
        field: error.path[0] as string, 
        message: error.message 
      });
      return;
    }

    const finalData = new FormData();

    if (formData.username) finalData.append('username', formData.username);
    if (formData.email) finalData.append('email', formData.email);
    if (formData.password) finalData.append('password', formData.password);
    
    if (formData.imagePath instanceof File) {
        finalData.append('file', formData.imagePath);
    } else {
      finalData.append('imagePath', imagePath);
    }
    
    try {
			const response = await fetch('http://localhost:3000/auth/signup', {
				method: 'POST',
				body: finalData
			});

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        
        let field = 'general';
        if (message.toLowerCase().includes('username')) field = 'username';
        else if (message.toLowerCase().includes('email')) field = 'email';
        else if (message.toLowerCase().includes('password')) field = 'password';

        setServerError({ field, message: message });
        return;
      }

      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify({
        id: data.userId,
        username: data.username
      }));

      navigate('/');

    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      setServerError({ field: 'general', message: message});
    }
  };

  return (
    <div className="relative w-full bg-cover bg-blue-background flex flex-col justify-start items-center overflow-x-hidden">
      <div className="relative w-full h-fit py-5 bg-purple-main flex flex-col justify-start items-center">
        <h1 className="relative text-8xl text-white font-bold font-inter uppercase tracking-tighter">Sign Up</h1>
        <h2 className="relative mt-2 text-4xl text-white font-semibold font-inter text-center px-4">JOIN US AND ENJOY ALL THE FEATURES!</h2>
      </div>

      <form 
        onSubmit={handleSubmit}
        className="relative mt-8 flex flex-col justify-start items-center gap-4"
      >
        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
          <img 
            className="w-40 h-40 rounded-full shadow-2xl mb-2 object-cover border-4 border-white/10 transition-all duration-300 group-hover:opacity-70" 
            src={
              imagePreview
                ? imagePreview 
                : formData.username
                  ? imagePath
                  : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            } 
            alt="Profile Preview" 
          />
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center rounded-full">
            <UploadCloud size={48} className="text-white mb-2" />
            <span className="px-2 py-1 bg-black/50 rounded text-xs text-white font-bold">Change picture</span>
          </div>

          {imagePreview && (
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

        <div className="relative w-lg flex flex-col justify-start items-start gap-1">
          <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">Username</label>
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            type="text" 
            placeholder="Username" 
            className={`w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl transition-all focus:outline-none ${
              serverError?.field === "username"
                ? "border-red-500 bg-red-500/10"
                : "border-white/20 focus:border-purple-main focus:bg-white/20"
            } text-white placeholder:text-white/40`}
          />
          {serverError?.field === "username" && (
            <span className="text-red-400 text-xs ml-2 mt-1 animate-in fade-in slide-in-from-top-1">
              {serverError.message}
            </span>
          )}
        </div>

        <div className="relative w-lg flex flex-col justify-start items-start gap-1">
          <label className="relative font-inter font-medium text-white/90 ml-2 text-sm">Email</label>
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="text" 
            placeholder="your@email.com" 
            className={`w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl transition-all focus:outline-none ${
              serverError?.field === "email"
                ? "border-red-500 bg-red-500/10"
                : "border-white/20 focus:border-purple-main focus:bg-white/20"
            } text-white placeholder:text-white/40`}
          />
          {serverError?.field === "email" && (
            <span className="text-red-400 text-xs ml-2 mt-1 animate-in fade-in slide-in-from-top-1">
              {serverError.message}
            </span>
          )}
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
                serverError?.field === "password"
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
          
          {serverError?.field === "password" && (
            <span className="text-red-400 text-xs ml-2 mt-1 animate-in fade-in slide-in-from-top-1">
              {serverError.message}
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
                (formData.confirmPassword && formData.password !== formData.confirmPassword) || serverError?.field === "confirmPassword"
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
          {serverError?.field === "confirmPassword" && (
            <span className="text-red-400 text-xs ml-2 mt-1 animate-in fade-in slide-in-from-top-1 font-medium">
              {serverError.message}
            </span>
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