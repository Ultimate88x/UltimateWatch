import { useNavigate } from "react-router-dom";
import { Film, Tv, Ticket, Users, User, ArrowUpRight } from "lucide-react";

export default function Home() {
  const isLoggedIn = !!localStorage.getItem("token");
  const navigate = useNavigate();

  const NAV_ROUTES = [
    { label: "Movies", path: "/movies", icon: <Film size={16} />, auth: false },
    { label: "Series", path: "/series", icon: <Tv size={16} />, auth: false },
    { label: "Events", path: "/events", icon: <Ticket size={16} />, auth: true },
    { label: "Friends", path: "/friends", icon: <Users size={16} />, auth: true },
    { label: "Profile", path: "/profile", icon: <User size={16} />, auth: true },
  ];

  return (
    <div className="w-full bg-blue-background text-white font-inter select-none flex flex-col justify-between p-12 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-purple-main/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto text-center my-auto z-10 py-12">
        <h1 className="text-[12vw] font-black tracking-tighter uppercase italic leading-[0.8]">
          ULTIMATE
          <br />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-main via-purple-500 to-fuchsia-500 drop-shadow-[0_0_50px_rgba(168,85,247,0.3)] inline-block pr-4">
            WATCH
          </span>
        </h1>

        <div className="mt-12 flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {NAV_ROUTES.map((item, index) => {
            const isLocked = item.auth && !isLoggedIn;

            return (
              <button
                key={index}
                disabled={isLocked}
                onClick={() => navigate(item.path)}
                className={`
                  px-6 py-3.5 rounded-full flex items-center gap-3 transition-all duration-300 border text-sm font-bold tracking-tight group
                  ${isLocked 
                    ? "bg-black/40 border-white/5 text-white/20 opacity-30" 
                    : "bg-white/2 border-white/5 hover:border-purple-main/40 hover:bg-white/5 text-white/70 hover:text-white hover:scale-105 cursor-pointer"
                  }
                `}
              >
                <span className={isLocked ? "text-white/10" : "text-purple-main"}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {!isLocked && (
                  <ArrowUpRight size={14} className="text-white/20 group-hover:text-purple-main group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {!isLoggedIn && (<div className="w-full flex items-center justify-end pt-6 border-t border-white/5 z-10">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate("/login")}
              className="text-xs font-bold uppercase tracking-wider text-purple-main hover:text-purple-400 transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button 
              onClick={() => navigate("/signup")}
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer active:scale-95"
            >
              Register
            </button>
          </div>
      </div>)}
    </div>
  );
}