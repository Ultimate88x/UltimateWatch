import { useState } from "react"
import { useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPassword() {
	const navigate = useNavigate();
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
		const loadToast = toast.loading('Sending email...');

		try {
			console.log(formData.email)
			const response = await fetch('http://localhost:3000/auth/forgot-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					email: formData.email,
				}),
			})
			
			if (response.ok) {
				toast.success('Email sent successfully!', { id: loadToast });
			} else {
				toast.error('Could not send email', { id: loadToast });
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : 'An unexpected error occurred';
			toast.error(message, { id: loadToast });
		}
	};

	return (
			<div className="relative w-full bg-cover bg-blue-background flex flex-col justify-start items-center overflow-x-hidden">
				<div className="relative mt-8 w-full h-fit py-5 bg-purple-main flex flex-col justify-start items-center">
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
						</div>

						<button 
							type="submit"
							className="w-full py-4 bg-purple-main rounded-2xl text-white font-bold cursor-pointer active:scale-95 hover:bg-purple-600 transition-all shadow-lg shadow-purple-900/20">
							SEND RECOVERY LINK
						</button>

						<button 
							type="button"
							onClick={() => navigate('/login')}
							className="text-sm text-white/60 cursor-pointer hover:text-white transition-colors underline-offset-4 hover:underline">
							Back to Login
						</button>
			</form>
		</div>
	)
}