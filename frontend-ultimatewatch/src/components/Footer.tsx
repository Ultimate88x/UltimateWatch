import { Github, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="mt-10 w-full px-10 py-6 bg-[#121215] border-t border-white/5">
      <div className="mx-auto max-w-7xl flex flex-row gap-16">
        <div className="flex flex-col gap-6 shrink-0">
          <span className="text-3xl font-bold tracking-tighter uppercase italic text-white">
            ULTIMATE<span className="text-purple-main">WATCH</span>
          </span>
          
          <div className="flex gap-3">
            <a 
              href="https://github.com/Ultimate88x/UltimateWatch" 
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-white/3 border border-white/5 rounded-full cursor-pointer hover:bg-purple-main hover:text-white text-white/40 transition-all duration-300"
            >
              <Github size={18} />
            </a>
            <a 
              href="https://www.linkedin.com/in/alejandro-gonzález-macías-agm/" 
              target="_blank"
              rel="noreferrer"
              className="p-2.5 bg-white/3 border border-white/5 rounded-full cursor-pointer hover:bg-purple-main hover:text-white text-white/40 transition-all duration-300"
            >
              <Linkedin size={18} />
            </a>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase text-purple-main tracking-[0.2em]">
              The Project
            </h3>
            <p className="max-w-4xl text-sm md:text-base text-white/60 leading-relaxed font-medium">
              UltimateWatch is a web application designed to explore movies and TV series, providing detailed 
              information and specific streaming availability for each content through external APIs. 
              The platform features a social module that allows users to add friends and schedule synchronized 
              viewing events. These events include an initial voting phase to select the content, followed by a 
              real-time watch party powered by WebSockets, which enables an integrated live chat, a synchronized 
              playback timer, and global media management for all participants.
            </p>
          </div>

          <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <a 
              href="https://www.themoviedb.org/" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center transition-opacity hover:opacity-80 active:scale-95 shrink-0"
            >
              <img 
                src="https://www.themoviedb.org/assets/2/v4/logos/v2/blue_short-8e7b30f73a4020692ccca9c88bafe5dcb6f8a62a4c6bc55cd9ba82bb2cd95f6c.svg" 
                alt="TMDB Logo"
                className="h-3.5 w-auto object-contain brightness-90 contrast-125"
                onError={(e) => {
                  e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/8/89/The_Movie_Database_Lighthouse.svg";
                }}
              />
            </a>
            <p className="max-w-2xl text-[11px] text-white/40 font-medium leading-normal">
              This website uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}