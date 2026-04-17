import { useState, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  ChevronDown, 
  Search, 
  User, 
  Film, 
  Tv, 
  MonitorPlay, 
  UserPlus,
  Users,
  Ticket, 
} from "lucide-react";
import type { MenuItem } from "../types/menu-item";
import { useOutsideClick } from "./utilities/UseOutsideClick";

type MenuConfig = Record<string, MenuItem[]>;

const ALL_MENUS: MenuConfig = {
  catalog: [
    { label: 'Discover Movies', path: '/movies', icon: <Film size={16}/>, requiresAuth: false },
    { label: 'Discover Series', path: '/series', icon: <Tv size={16}/>, requiresAuth: false },
    { label: 'What to see', path: '/suggested', icon: <MonitorPlay size={16}/>, requiresAuth: false },
  ],
  social: [
    { label: 'Friends', path: '/friends', icon: <Users size={16}/>, requiresAuth: true },
    { label: 'Friend Requests', path: '/friend-requests', icon: <UserPlus size={16}/>, requiresAuth: true },
  ],
  events: [
    { label: 'Event List', path: '/events', icon: <Ticket size={16}/>, requiresAuth: true },
  ]
};

const SEARCH_OPTIONS_CONFIG = [
  { label: "Movies", value: "movies", requiresAuth: false },
  { label: "Series", value: "series", requiresAuth: false },
  { label: "Users", value: "users", requiresAuth: true },
];

export default function Navbar() {
  const isLoggedIn = !!localStorage.getItem("token");
  const navigate = useNavigate();
  
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>("");

  const menuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(menuRef, () => setOpenMenu(null));

  const visibleSearchOptions = useMemo(() => {
    return SEARCH_OPTIONS_CONFIG.filter(opt => !opt.requiresAuth || isLoggedIn);
  }, [isLoggedIn]);

  const [searchMedia, setSearchMedia] = useState<string>(visibleSearchOptions[0].value);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const visibleMenus = useMemo<MenuConfig>(() => {
    const filtered: MenuConfig = {};
    Object.entries(ALL_MENUS).forEach(([key, items]) => {
      const visibleItems = items.filter(item => !item.requiresAuth || (item.requiresAuth && isLoggedIn));
      if (visibleItems.length > 0) {
        filtered[key] = visibleItems;
      }
    });
    return filtered;
  }, [isLoggedIn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchText.trim()) return;

    if (searchMedia === "users") {
      navigate(`/users-search?username=${encodeURIComponent(searchText)}`);
    } else {
      const url = `/media-search?media=${searchMedia}&query=${encodeURIComponent(searchText)}`;
      navigate(url);
    }
  };

  return (
    <nav className="sticky top-0 w-full h-16 px-8 mb-8 bg-linear-to-br from-purple-500 via-purple-main to-purple-900 shadow-2xl flex items-center justify-between z-50 font-inter border-white/10 backdrop-blur-sm">
      
      <div className="flex items-center gap-10">
        <Link to="/" className="flex items-center gap-2 shrink-0 cursor-pointer">
          <span className="text-2xl tracking-tighter text-white font-bold">
            ULTIMATE<span className="text-black/20">WATCH</span>
          </span>
        </Link>

        <div ref={menuRef} className="flex items-center gap-6">
          {Object.keys(visibleMenus).map((menuKey) => (
            <div key={menuKey} className="relative">
              <button 
                onClick={() => toggleMenu(menuKey)}
                className="cursor-pointer flex items-center gap-1 text-white/90 font-semibold capitalize hover:text-white transition-colors active:scale-95"
              >
                {menuKey}
                <ChevronDown size={16} className={`${openMenu === menuKey ? 'rotate-180' : ''} transition-transform duration-300`} />
              </button>

              {openMenu === menuKey && (
                <div className="absolute top-10 left-0 w-60 py-2 bg-white shadow-2xl border rounded-xl border-gray-100 overflow-hidden">
                  {visibleMenus[menuKey].map((item, index: number) => (
                    <Link
                      key={index}
                      to={item.path}
                      className="px-4 py-3 cursor-pointer hover:bg-purple-main/10 flex items-center gap-3 text-gray-700 hover:text-purple-main transition-colors"
                      onClick={() => setOpenMenu(null)}
                    >
                      <span className="text-purple-main">{item.icon}</span>
                      <span className="text-sm font-semibold">{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-1 justify-end items-center gap-6">
        <form 
          className="relative w-2/3 flex items-center bg-white/90 backdrop-blur-md border border-white/10 rounded-xl focus-within:bg-white focus-within:ring-2 focus-within:ring-purple-main/20 transition-all group overflow-hidden"
          onSubmit={handleSubmit}
        >
          <div className="relative flex items-center px-4 border-r border-black/10">
            <select 
              className="appearance-none bg-transparent pl-2 pr-8 py-2.5 text-xs font-bold uppercase tracking-wider text-black/70 cursor-pointer focus:outline-none hover:text-purple-main transition-colors"
              onChange={(e) => setSearchMedia(e.target.value)}
              value={searchMedia}
            >
              {/* Iteramos sobre las opciones filtradas */}
              {visibleSearchOptions.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-black">
                  {opt.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <ChevronDown size={14} className="text-black/40" />
            </div>
          </div>

          <input 
            type="text" 
            placeholder={searchMedia === 'users' ? "Search users by name..." : "Search for content..."}
            className="flex-1 py-2.5 px-4 bg-transparent cursor-text focus:outline-none text-sm text-black placeholder:text-black/50 transition-all"
            onChange={(e) => setSearchText(e.target.value)}
          />

          <button type="submit" className="h-full px-5 py-2.5 text-purple-main transition-all flex items-center justify-center cursor-pointer group-focus-within:shadow-[-5px_0_15px_rgba(168,85,247,0.2)]">
            <Search 
              className="transition-transform group-hover:scale-110" 
              size={18} 
            />
          </button>
        </form>

        <Link 
          to={isLoggedIn ? "/profile" : "/login"} 
          className="p-2.5 bg-white/10 shadow-sm border rounded-xl border-white/10 cursor-pointer hover:bg-purple-200 hover:text-purple-main text-white active:scale-90 transition-all"
          title={isLoggedIn ? "My Profile" : "Login"}
        >
          <User size={24} />
        </Link>
      </div>

      {openMenu && (
        <div 
          className="fixed inset-0 z-[-1] cursor-default" 
          onClick={() => setOpenMenu(null)} 
        />
      )}
    </nav>
  );
}