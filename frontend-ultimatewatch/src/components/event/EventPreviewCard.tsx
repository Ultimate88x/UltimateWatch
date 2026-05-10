import { motion } from "framer-motion";
import { format, parseISO, getDay, getWeekOfMonth } from "date-fns";
import { Users, Clock, HelpCircle, LayoutList } from "lucide-react";
import type { EventItem } from "../../types/event-item";
import { EventTypeEnum } from "../../enums/EventTypeEnum";

interface Props {
  event: EventItem;
}

export const EventPreviewCard = ({ event }: Props) => {
  const eventDate = parseISO(event.eventDate);
  const dayOfWeek = getDay(eventDate);
  const weekOfMonth = getWeekOfMonth(eventDate, { weekStartsOn: 1 });

  const isTopRows = weekOfMonth <= 2;
  
  const isLeftEdge = dayOfWeek === 1 || dayOfWeek === 2;
  const isRightEdge = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

  const verticalClass = isTopRows ? "top-full mt-2" : "bottom-full mb-2";
  
  let horizontalClass = "left-1/2 -translate-x-1/2";
  if (isLeftEdge) horizontalClass = "left-0 translate-x-0";
  if (isRightEdge) horizontalClass = "right-0 translate-x-0";

  let arrowHorizontal = "left-1/2 -translate-x-1/2";
  if (isLeftEdge) arrowHorizontal = "left-6";
  if (isRightEdge) arrowHorizontal = "right-6";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: isTopRows ? -10 : 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: isTopRows ? -5 : 5 }}
      className={`absolute ${verticalClass} ${horizontalClass} w-60 z-100 pointer-events-none`}
    >
      <div className="bg-[#0c0c0c]/90 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="relative h-24 w-full overflow-hidden border-b border-white/5">
          {event.mainImagePath ? (
            <img src={event.mainImagePath} className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              {event.type === EventTypeEnum.VOTING ? (
                <LayoutList size={88} className="text-purple-main/50 group-hover:text-purple-main/75 transition-all duration-250 ease-in-out" />                          ) : (
                <HelpCircle size={88} className="text-purple-main/50 group-hover:text-purple-main/75 transition-all duration-250 ease-in-out" />
              )}
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-[#0c0c0c] to-transparent" />
        </div>

        <div className="p-4 pt-2 text-start">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-black uppercase italic tracking-tighter text-white leading-tight line-clamp-2">
              {event.name}
            </h4>
            <div className="flex items-center gap-1 text-purple-main bg-purple-main/10 px-1.5 py-0.5 rounded-md border border-purple-main/20 ml-2">
               <Clock size={10} strokeWidth={3} />
               <span className="text-[9px] font-black font-mono">{format(eventDate, 'HH:mm')}</span>
            </div>
          </div>

          {event.mediaTitles && (
            <p className="text-[9px] text-white/40 font-bold italic line-clamp-1 mb-3">
              {event.mediaTitles}
            </p>
          )}

          <div className="flex items-center justify-between mt-4 bg-white/3 p-2 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-white/20" />
              <span className="text-[10px] font-black text-white/60">{event.currentMembers}/{event.maxMembers}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-white/20 uppercase tracking-tighter">Host: {event.creatorName.split(' ')[0]}</span>
              <img src={event.creatorImagePath || ''} className="w-5 h-5 rounded-full border border-white/10 object-cover" />
            </div>
          </div>
        </div>

        <div className={`
          absolute w-2.5 h-2.5 bg-[#0c0c0c] border-white/10 rotate-45
          ${isTopRows ? '-top-1.25 border-l border-t' : '-bottom-1.25 border-r border-b'}
          ${arrowHorizontal}
        `} />
      </div>
    </motion.div>
  );
};