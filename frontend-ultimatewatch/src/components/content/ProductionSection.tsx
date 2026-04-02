import React from 'react';
import { motion } from 'framer-motion';
import { Film } from 'lucide-react';

interface Company {
  id?: number | string;
  logoPath?: string;
  name: string;
}

interface ProductionSectionProps {
  companies?: Company[];
  title?: string;
}

const ProductionSection: React.FC<ProductionSectionProps> = ({ 
  companies = [], 
  title = "Producers" 
}) => {
  return (
    <div className="flex flex-col gap-3 w-80 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-1 h-5 bg-purple-main rounded-full shadow-[0_0_8px_rgba(168,85,247,0.4)]" />
        <h3 className="text-white font-bold uppercase tracking-[0.2em] text-sm leading-none">
          {title}
        </h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {companies && companies.length > 0 ? (
          companies.map((company, index) => (
            <motion.div
              key={company.id || index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative flex items-center gap-3 px-3 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-purple-main/30 transition-all duration-300"
            >
              <div className="w-10 h-10 rounded-lg bg-white/95 p-1.5 flex items-center justify-center overflow-hidden shrink-0 shadow-sm group-hover:bg-white transition-colors">
                {company.logoPath ? (
                  <>
                    <img
                      src={company.logoPath}
                      alt={company.name}
                      className="w-full h-full object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                      onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "https://ui-avatars.com/api/?name=?&background=2e1065&color=fff"; 
                        }}
                    />
                    <div className="hidden">
                      <Film className="w-4 h-4 text-purple-900/40" />
                    </div>
                  </>
                ) : (
                  <Film className="w-4 h-4 text-purple-900/40" />
                )}
              </div>

              <span className="text-[10px] text-purple-100/80 font-bold uppercase tracking-wider truncate max-w-40">
                {company.name}
              </span>
            </motion.div>
          ))
        ) : (
          <div className="flex items-center gap-3 pl-4 pr-10 py-3 bg-white/5 border border-white/5 rounded-xl group">
            <div className="p-2 bg-white/5 rounded-lg">
              <Film className="w-4 h-4 text-purple-300/20" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-purple-200/40 font-bold uppercase tracking-widest">
                Production
              </span>
              <span className="text-xs text-purple-100/60 font-medium italic">
                Information not available
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductionSection;