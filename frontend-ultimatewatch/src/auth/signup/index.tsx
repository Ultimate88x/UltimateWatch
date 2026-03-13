import { useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UploadCloud, X } from "lucide-react";
import { signUpSchema } from "./schemas/signUpSchema";
import toast from "react-hot-toast";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";

export default function SignUp() {
  const navigate = useNavigate();
	const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<{ field: string; message: string } | null>(null);

	const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
		imagePath: null as File | null,
  });

  const getBaseImagePath = (username?: string) => {
    return username && username !== "" ? `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=6D28D9&color=fff` : "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  }

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    
    const result = signUpSchema.safeParse(formData);
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
    if (formData.password) finalData.append('password', formData.password);
    
    if (formData.imagePath instanceof File) {
        finalData.append('file', formData.imagePath);
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

        setError({ field, message: message });
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
      toast.error(message);
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
                  ? getBaseImagePath(formData.username)
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

        <div className="flex flex-col gap-4 w-lg">
          <Input
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            error={error}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="your@email.com"
            error={error}
          />

          <Input
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            error={error}
          />

          <Input
            label="Verify Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Repeat your password"
            error={error}
          />
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          fullWidth 
          className="mt-6"
        >
          Create Account
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-white/85">
        Already have an account? <Link to="/login" className="text-white font-bold cursor-pointer hover:underline">Log In</Link>
      </p>
    </div>
  );
}