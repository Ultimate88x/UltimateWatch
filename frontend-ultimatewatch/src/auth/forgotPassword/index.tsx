import { useState } from "react"
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "../../components/Button";
import { forgotPasswordSchema } from "./schemas/signUpSchema";

export default function ForgotPassword() {
	const navigate = useNavigate();

	const [error, setError] = useState<{ field: string; message: string } | null>(null);

	const [formData, setFormData] = useState({
			email: '',
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

		const result = forgotPasswordSchema.safeParse(formData);
		if (!result.success) {
			const error = result.error.issues[0];
			setError({ 
			field: error.path[0] as string, 
			message: error.message 
			});
			return;
		}

		const loadToast = toast.loading('Sending email...');

		try {
			const response = await fetch('http://localhost:3000/auth/forgot-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: formData.email,
				}),
			})

			const data = await response.json();
			
			if (response.ok) {
				toast.success(data.message || 'Email sent successfully!', { id: loadToast });
			} else {
				toast.error(data.message || 'Could not send email', { id: loadToast });
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'An unexpected error occurred';
			toast.error(message, { id: loadToast });
		}
	};

	return (
		<div className="relative w-full bg-cover bg-blue-background flex flex-col justify-start items-center overflow-x-hidden">
			<div className="relative w-full h-fit py-5 bg-purple-main flex flex-col justify-start items-center">
					<h1 className="relative text-8xl text-white font-bold font-inter">RESET PASSWORD</h1>
					<h2 className="relative mt-2 text-4xl text-white font-semibold font-inter">INTRODUCE YOUR EMAIL. WE'LL SEND A LINK TO RESET YOUR PASSWORD.</h2>
			</div>

			<form 
				onSubmit={handleSubmit}
				className="relative mt-10 flex flex-col justify-start items-center gap-4">
					<div className="w-40 h-40 flex justify-center items-center shadow-2xl mb-2 border-4 border-white/10 rounded-3xl bg-white/5 transition-all duration-300 hover:scale-105">
						<Mail 
							size={100} 
							strokeWidth={1} 
							className="text-white" 
						/>
					</div>

					<div className="relative w-lg flex flex-col justify-start items-start gap-1">
						<a className="relative font-inter font-medium">Email</a>
						<input
							name="email"
							value={formData.email}
							onChange={handleChange}
							type="email" 
							placeholder="Email" 
							className="w-full px-4 py-3 bg-white/10 shadow-lg border-2 rounded-2xl border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-purple-main focus:bg-white/20 transition-all"
						/>
						{error?.field === "email" && (
							<span className="text-red-400 text-xs ml-2 mt-1 animate-in fade-in slide-in-from-top-1">
							{error.message}
							</span>
						)}
					</div>

					<Button 
					type="submit" 
					variant="primary" 
					size="lg" 
					fullWidth 
					className="shadow-purple-900/20"
					>
						Send Recovery Link
					</Button>

					<Button
					variant="link" 
					type="button"
					onClick={() => navigate('/login')} 
					className="text-sm"
					>
						Back to Login
					</Button>
			</form>
		</div>
	)
}