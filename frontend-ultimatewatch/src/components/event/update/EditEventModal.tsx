import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { updateVotingEventSchema } from "./schemas/updatedVotingEventSchema";
import { updateStandardEventSchema } from "./schemas/updateStandardEventSchema";
import { EventTypeEnum } from "../../../enums/EventTypeEnum";
import { EventVisibilityEnum } from "../../../enums/EventVisibility";
import type { EnhancedEvent } from "../../../types/voting-event";
import { Button } from "../../Button";
import { Input } from "../../Input";
import { formatDateForInput } from "../../utilities/FormatDateForInput";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EnhancedEvent;
  onUpdate: () => void;
}

type Form = {
  name: string,
  description: string | null | undefined,
  eventDate: Date,
  maxMembers: number,
  visibility: string,
  maxMedia: number | null | undefined,
  votingEndDate: Date | null | undefined,
};

export const EditEventModal = ({ isOpen, onClose, event, onUpdate }: EditEventModalProps) => {
  const [formData, setFormData] = useState<Form>({
    name: '',
    description: null,
    eventDate: new Date(),
    maxMembers: 0,
    visibility: 'public',
    maxMedia: null,
    votingEndDate: null,
  });
  const [error, setError] = useState<{ field: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        description: event.description,
        eventDate: new Date(event.eventDate),
        maxMembers: event.maxMembers,
        visibility: event.visibility,
        maxMedia: event.maxMedia || 1,
        votingEndDate: event.votingEndDate ? new Date(event.votingEndDate) : null,
      });
    }
  }, [event, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type: inputType } = e.target;
    let finalValue: string | number | Date = inputType === 'number' ? Number(value) : value;

    if (inputType === 'datetime-local' && value) {
      const dateValue = new Date(value);
      dateValue.setSeconds(0, 0);
      finalValue = dateValue;
    }

    setFormData(prev => ({ ...prev, [name]: finalValue }));
    if (error?.field === name) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const isVoting = event.type === 'voting_event';
    const schema = isVoting ? updateVotingEventSchema : updateStandardEventSchema;
    
    const result = schema.safeParse(formData);

    if (!result.success) {
      const firstError = result.error.issues[0];
      setError({ field: firstError.path[0] as string, message: firstError.message });
      setIsLoading(false);
      return;
    }

    const eventType: string = event.type === EventTypeEnum.STANDARD ? 'standard' : 'voting';

    try {
      const response = await fetch(`http://localhost:3000/events/${eventType}/${event.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Failed to update event");
        return;
      }

      toast.success(data.message);
      onUpdate();
      onClose();
    } catch (error: Error | unknown) {
      const message = error instanceof Error ? error.message : 'An unexpected error occurred';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-blue-background border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-8 pb-0 flex justify-between items-start">
              <div>
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                  Edit <span className="text-purple-main">Event</span>
                </h2>
                <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest">Update your marathon settings</p>
              </div>
              <button onClick={onClose} className="p-2 text-white/20 hover:text-white transition-colors cursor-pointer">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5 max-h-[70vh] overflow-y-auto media-scrollbar">
              <Input
                label="Event Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={error}
              />

              <div className="flex flex-col gap-2">
                <label className="relative font-inter font-medium text-white/90 ml-2 text-sm -mb-1">
                  Event Visibility
                </label>
                <select 
                  name="visibility"
                  value={formData.visibility}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/10 border-2 rounded-2xl text-white border-white/20 focus:border-purple-main appearance-none"
                >
                  <option value={EventVisibilityEnum.PUBLIC} className="bg-blue-background text-white">Public</option>
                  <option value={EventVisibilityEnum.PRIVATE} className="bg-blue-background text-white">Private</option>
                  <option value={EventVisibilityEnum.REQUEST_ONLY} className="bg-blue-background text-white">Request Only</option>
                  <option value={EventVisibilityEnum.FRIENDS_ONLY} className="bg-blue-background text-white">Friends Only</option>
                </select>
              </div>

              <Input
                label="Description"
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                error={error}
              />

              {event.status === 'voting' && (
                <div className="flex flex-col gap-5 border-l-2 border-purple-main/30 pl-4 py-2">
                  <h4 className="text-[9px] font-black uppercase text-purple-main tracking-widest">Voting Settings</h4>
                  <Input
                    label="Voting End Date"
                    name="votingEndDate"
                    type="datetime-local"
                    value={formatDateForInput(formData.votingEndDate)}
                    onChange={handleChange}
                    error={error}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Max Media"
                      name="maxMedia"
                      type="number"
                      value={formData.maxMedia?.toString()}
                      onChange={handleChange}
                      error={error}
                    />
                  </div>
                </div>
              )}

              <Input
                label="Event Start Date"
                name="eventDate"
                type="datetime-local"
                value={formatDateForInput(formData.eventDate)}
                onChange={handleChange}
                error={error}
              />

              <Input
                label="Max Members"
                name="maxMembers"
                type="number"
                value={formData.maxMembers.toString()}
                onChange={handleChange}
                error={error}
              />

              <div className="flex gap-3 mt-4">
                <Button type="button" variant="secondary" fullWidth onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" fullWidth disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};