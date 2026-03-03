import { Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-10 w-full px-10 py-6 bg-white border-t border-gray-100">
      <div className="mx-auto max-w-7xl flex gap-16">
        
        <div className="flex flex-col gap-6 shrink-0">
          <span className="text-3xl text-purple-main font-bold tracking-tighter">
            ULTIMATE<span className="text-gray-300">WATCH</span>
          </span>
          
          <div className="flex gap-3">
            <a 
              href="https://github.com/Ultimate88x" 
              target="_blank"
              className="p-2.5 bg-gray-50 rounded-full cursor-pointer hover:bg-purple-50 text-gray-500 hover:text-purple-main transition-all"
            >
              <Github size={20} />
            </a>
            <a 
              href="https://www.linkedin.com/in/alejandro-gonzález-macías-agm/" 
              target="_blank"
              className="p-2.5 bg-gray-50 rounded-full cursor-pointer hover:bg-purple-50 text-gray-500 hover:text-purple-main transition-all"
            >
              <Linkedin size={20} />
            </a>
          </div>
        </div>

        <div className="flex flex-1 flex-col">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-gray-400 tracking-[0.2em]">
              The Project
            </h3>
            <p className="max-w-4xl text-base text-gray-600 leading-relaxed">
              UltimateWatch is a web application that allows users to manage and discover movies and TV series, 
              offering features similar to platforms such as IMDb. The application enables users to store content in 
              personalized lists, rate movies and TV series, and consult detailed information obtained through the use of APIs. 
              It also includes a recommendation system based on different criteria such as genres, duration, streaming platforms, 
              actors, or directors. In addition, the platform features a social module that will allow users to add friends and 
              participate in or invite others to scheduled events, such as viewing marathons, whose content are selected 
              through voting and/or personalized recommendations.
            </p>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-row items-center gap-4">
            <a 
							href="https://www.themoviedb.org/" 
							target="_blank" 
							rel="noreferrer"
							className="bg-[#01b4e4] text-white px-2 py-1 rounded flex justify-center items-center text-[10px] font-black tracking-tighter select-none">
              	TMDB
            </a>
            <p className="max-w-2xl text-[11px] text-gray-500 font-medium leading-snug">
              This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}