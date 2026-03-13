import { useState } from "react"
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Banner } from "../../components/Banner";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
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

    try {
      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.statusCode === 404) {
          toast.error("Incorrect username or password");
        } else {
          toast.error(data.message || 'Login failed');
        }

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
      <Banner title="LOGIN" subtitle="WELCOME BACK! WE MISSED YOU!" />

      <form 
        onSubmit={handleSubmit}
        className="relative flex flex-col justify-start items-center gap-4">
          <img 
            className="w-40 h-40 rounded-full shadow-2xl mb-2 object-cover border-4 border-white/10 transition-all duration-300 group-hover:opacity-70" 
            src={"https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
            alt="Profile" 
          />
        <div className="flex flex-col gap-4 w-lg">
          <Input
              label="Username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="Username"
            />

            <Input
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
            />
          </div>

          <p className="text-center text-sm text-white/85">
            Forgot your password? Click <Link to="/forgot-password" className="text-white font-bold cursor-pointer hover:underline" >here</Link> to reset it
          </p>

          <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          fullWidth 
          className="mt-4"
          >
          Log In
          </Button>
      </form>

      <p className="mt-8 text-center text-sm text-white/85">
        Don't have an account?  <Link to="/signup" className="text-white font-bold cursor-pointer hover:underline">Sign Up</Link>
      </p>
    </div>
  )
}