import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Search, User, Film, Tv, MonitorPlay, } from "lucide-react";

export default function Navbar() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (menu: string) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  const menus = {
    catalog: [
      { label: 'Discover Movies', path: '/movies', icon: <Film size={16}/> },
      { label: 'Discover Series', path: '/series', icon: <Tv size={16}/> },
      { label: 'What to see', path: '/suggested', icon: <MonitorPlay size={16}/> },
    ],
    collection: [
    ],
    events: [
    ],
    social: [
    ]
  };

  return (
    <nav className="sticky top-0 w-full h-16 px-8 mb-8 bg-purple-main shadow-2xl flex items-center justify-between z-50 font-inter">
      
      <div className="flex items-center gap-10">
        <Link to="/" className="flex items-center gap-2 shrink-0 cursor-pointer">
          <span className="text-2xl tracking-tighter text-white font-bold">
            ULTIMATE<span className="text-black/20">WATCH</span>
          </span>
        </Link>

        <div className="flex items-center gap-6">
          {Object.keys(menus).map((menuKey) => (
            <div key={menuKey} className="relative">
              <button 
                onClick={() => toggleMenu(menuKey)}
                className="cursor-pointer flex items-center gap-1 text-white/90 font-semibold capitalize hover:text-white transition-colors active:scale-95"
              >
                {menuKey}
                <ChevronDown size={16} className={`${openMenu === menuKey ? 'rotate-180' : ''} transition-transform duration-300`} />
              </button>

              {openMenu === menuKey && (
                <div className="absolute top-10 left-0 w-60 py-2 bg-white shadow-2xl border rounded-xl border-gray-100">
                  {menus[menuKey as keyof typeof menus].map((item, index) => (
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
        
        <div className="relative w-full max-w-xl group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/60 group-focus-within:text-purple-main transition-colors z-10" size={20} />
          <input 
            type="text" 
            placeholder="Search for content..." 
            className="w-full py-2.5 pl-12 pr-4 bg-white/70 border rounded-xl border-white/10 cursor-text focus:outline-none focus:bg-white text-sm text-black placeholder:text-black/60 focus:text-gray-900 transition-all"
          />
        </div>

        <Link 
          to="/profile" 
          className="p-2.5 bg-white/10 shadow-sm border rounded-xl border-white/10 cursor-pointer hover:bg-purple-200 hover:text-purple-main text-white active:scale-90 transition-all"
          title="My Profile"
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