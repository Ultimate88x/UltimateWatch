import { motion, AnimatePresence } from 'framer-motion';
import { X, History, PlayCircle, ListOrdered } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { MediaCard } from './MediaCard';
import type { EventMediaRoom } from '../../types/event-media-room';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: EventMediaRoom[];
  onUpdate: (updatedList: EventMediaRoom[]) => void;
}

export function PlaylistModal({ isOpen, onClose, media, onUpdate }: PlaylistModalProps) {
  const [localMedia, setLocalMedia] = useState<EventMediaRoom[]>(media);

  useEffect(() => {
    setLocalMedia(media);
  }, [media]);

  const history = localMedia.filter(m => ['watched', 'skipped'].includes(m.status)).sort((a, b) => b.order - a.order);
  const current = localMedia.filter(m => m.status === 'current');
  const pending = localMedia.filter(m => m.status === 'pending').sort((a, b) => a.order - b.order);

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    let items = Array.from(localMedia);

    if (destination.droppableId === 'now-playing') {
      items = items.map(m => {
        if (m.status === 'current' && String(m.id) !== draggableId) {
          return { ...m, status: 'watched', order: 0 };
        }
        return m;
      });
    }

    const movedItemIndex = items.findIndex(m => String(m.id) === draggableId);
    const [movedItem] = items.splice(movedItemIndex, 1);

    const statusMap: Record<string, string> = {
      'archive': 'watched',
      'now-playing': 'current',
      'up-next': 'pending'
    };
    movedItem.status = statusMap[destination.droppableId];

    const archives = items.filter(m => ['watched', 'skipped'].includes(m.status))
      .sort((a, b) => b.order - a.order);
    
    const current = items.filter(m => m.status === 'current');
    
    const pendings = items.filter(m => m.status === 'pending')
      .sort((a, b) => a.order - b.order);

    if (destination.droppableId === 'archive') {
      archives.splice(destination.index, 0, movedItem);
    } else if (destination.droppableId === 'now-playing') {
      // Solo puede haber uno, pero lo metemos en su lista
      current.splice(0, 1, movedItem); 
    } else {
      pendings.splice(destination.index, 0, movedItem);
    }

    const finalSortedItems = [...archives, ...current, ...pendings];

    const updatedMedia = finalSortedItems.map((item, idx) => ({
      ...item,
      order: idx
    }));

    setLocalMedia(updatedMedia);

    try {
      const response = await fetch(
        `http://localhost:3000/event-media/sort-order/`, 
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            items: updatedMedia.map(m => ({
              id: m.id,
              order: m.order,
              status: m.status
            }))
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        toast.error(data?.message || 'Failed to update manifest');
        return;
      }

      toast.success(data.message);
      onUpdate(updatedMedia);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unxepected error occurred';
      toast.error(message);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 md:p-12">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
          />

          <motion.div 
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="relative w-full max-w-7xl h-[85vh] bg-[#0c0c0c] border border-white/10 rounded-[40px] shadow-2xl flex flex-col overflow-hidden"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/2 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                  Event <span className="text-purple-main">Manifest</span>
                </h2>
              </div>
              <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full text-white/20 hover:text-white transition-colors cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <div className="flex-1 grid grid-cols-3 overflow-hidden min-h-0">  
                <Droppable droppableId="archive">
                  {(provided, snapshot) => (
                    <div 
                      className={`flex flex-col border-r border-white/5 transition-colors h-full min-h-0 ${
                        snapshot.isDraggingOver ? 'bg-white/5' : 'bg-black/20'
                      }`}
                    >
                      <div className="p-5 border-b border-white/5 flex items-center gap-3 text-white/40 shrink-0">
                        <History size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Archive</span>
                      </div>
                      
                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4 media-scrollbar min-h-0"
                        style={{ display: 'flex', flexDirection: 'column' }}
                      >
                        {history.map((m, index) => (
                          <DraggableMedia key={m.id} media={m} index={index} />
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>

                <Droppable droppableId="now-playing">
                  {(provided, snapshot) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`flex flex-col transition-colors ${snapshot.isDraggingOver ? 'bg-purple-main/5' : 'bg-purple-main/3'}`}
                    >
                      <div className="p-5 border-b border-purple-main/10 flex items-center gap-3 text-purple-main shrink-0">
                        <PlayCircle size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Now Playing</span>
                      </div>
                      <div className="flex-1 p-8 overflow-y-auto media-scrollbar">
                        {current.map((m, index) => (
                          <DraggableMedia key={m.id} media={m} index={index} />
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>

                <Droppable droppableId="up-next">
                  {(provided, snapshot) => (
                    <div 
                      className={`flex flex-col border-l border-white/5 transition-colors h-full min-h-0 ${
                        snapshot.isDraggingOver ? 'bg-white/2' : 'bg-black/20'
                      }`}
                    >
                      <div className="p-5 border-b border-white/5 flex items-center gap-3 text-white/40 shrink-0">
                        <ListOrdered size={18} />
                        <span className="text-xs font-black uppercase tracking-widest">Up Next</span>
                      </div>

                      <div 
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="flex-1 overflow-y-auto p-6 space-y-4 media-scrollbar min-h-0 custom-drag-area"
                      >
                        {pending.map((m, index) => (
                          <DraggableMedia key={m.id} media={m} index={index} isNext={index === 0} />
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              </div>
            </DragDropContext>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DraggableMedia({ media, index, isNext }: { media: EventMediaRoom; index: number; isNext?: boolean }) {
  return (
    <Draggable draggableId={String(media.id)} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`cursor-grab active:cursor-grabbing transition-shadow ${
            snapshot.isDragging ? 'z-50 shadow-2xl opacity-80' : ''
          }`}
        >
          <MediaCard media={media} isNext={isNext} />
        </div>
      )}
    </Draggable>
  );
}