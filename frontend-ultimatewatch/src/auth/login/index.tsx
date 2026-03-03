import { useState } from "react"
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
	const navigate = useNavigate();
	const [showPassword, setShowPassword] = useState(false);
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
            throw new Error(data.message || 'Login failed');
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
			<div className="absolute object-center top-0 right-0 left-0 bottom-0 bg-cover bg-blue-background flex flex-col justify-start items-center overflow-x-hidden">
				<div className="relative mt-24 w-full h-fit py-5 bg-purple-main flex flex-col justify-start items-center">
						<h1 className="relative text-8xl text-white font-bold font-inter">LOGIN</h1>
						<h2 className="relative mt-2 text-4xl text-white font-semibold font-inter">WELCOME BACK! WE MISSED YOU!</h2>
				</div>

				<form 
					onSubmit={handleSubmit}
					className="relative mt-10 flex flex-col justify-start items-center gap-4">
						<img 
							className="w-48 h-auto rounded-full shadow-2xl" 
							src={"https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
							alt="Profile" 
						/>

						<div className="relative w-lg flex flex-col justify-start items-start gap-1">
							<a className="relative font-inter font-medium">Username</a>
							<input
								name="username"
								value={formData.username}
								onChange={handleChange}
								type="text" 
								placeholder="Username" 
								className="w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-main focus:bg-white/20 transition-all"
							/>
						</div>

						<div className="relative w-lg flex flex-col justify-start items-start gap-1">
							<a className="relative font-inter font-medium">Password</a>
							<input
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
								className="absolute right-4 top-10 text-white/60 hover:text-white transition-colors"
							>
								{showPassword ? <EyeOff size={28} /> : <Eye size={28} />}
							</button>
						</div>

						<p className="text-center text-sm text-white/85">
							Don't have an account? Click <span className="text-white font-bold cursor-pointer hover:underline">here</span> to reset it
						</p>

						<button 
							type="submit"
							className="mt-4 w-full py-4 bg-purple-main rounded-xl text-white font-bold cursor-pointer active:scale-95 hover:bg-purple-600 transition-transform flex justify-center items-center gap-2">
								LOG IN
						</button>
			</form>

			<p className="mt-8 text-center text-sm text-white/85">
				Don't have an account? <span className="text-white font-bold cursor-pointer hover:underline">Sign Up</span>
			</p>
		</div>
	)
}