import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, MessageSquare, Clock, BarChart2, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { EventMetrics } from '../../types/event-metrics';
import toast from 'react-hot-toast';
import { EmptyState } from '../EmptyState';
import { formatDurationFromSeconds } from '../utilities/FormatDuration';

interface EventMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: number;
}

export const EventMetricsModal: React.FC<EventMetricsModalProps> = ({ isOpen, onClose, eventId }) => {
  const [metrics, setMetrics] = useState<EventMetrics | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getEventStatistics = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/event-metrics/event/${eventId}`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${localStorage.getItem('token')}`,
              },
            }
        );

        const data = await response.json();

        if (!response.ok) {
          toast.error(data.message || "Failed to retrieve event statistics");
          return;
        }

        setMetrics(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error';
        toast.error(message);
      } finally {
        setTimeout(() => setIsLoading(false), 400);
      }
    }

    if (isOpen) getEventStatistics();
  }, [eventId, isOpen]);

  const hasChartData = metrics && metrics.metricsDetails && metrics.metricsDetails.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-2xl text-white min-h-87.5 flex flex-col justify-center"
          >
            {isLoading ? (
              <div className="flex flex-col items-center justify-center my-12">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="relative"
                >
                  <div className="w-16 h-16 border-4 border-purple-main/20 border-t-purple-main rounded-full" />
                </motion.div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-6 text-white/60 font-inter font-bold tracking-widest uppercase text-xs"
                >
                  Loading Event Statistics...
                </motion.p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="text-purple-main w-5 h-5" />
                    <h2 className="text-lg font-black uppercase tracking-wider italic">
                      Event Statistics
                    </h2>
                  </div>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-white/40 hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-white/3 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-white/40 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Peak Viewers</span>
                      <Users size={14} className="text-purple-main" />
                    </div>
                    <span className="text-2xl font-black italic">{metrics?.maxViewerCount ?? 0}</span>
                  </div>

                  <div className="bg-white/3 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-white/40 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Unique</span>
                      <Users size={14} className="text-blue-400" />
                    </div>
                    <span className="text-2xl font-black italic">{metrics?.uniqueViewersCount ?? 0}</span>
                  </div>

                  <div className="bg-white/3 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-white/40 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Total Messages</span>
                      <MessageSquare size={14} className="text-green-400" />
                    </div>
                    <span className="text-2xl font-black italic">{metrics?.totalMessages ?? 0}</span>
                  </div>

                  <div className="bg-white/3 border border-white/5 rounded-xl p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-white/40 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider">Duration</span>
                      <Clock size={14} className="text-yellow-400" />
                    </div>
                    <span className="text-2xl font-black italic">{formatDurationFromSeconds(metrics?.duration)}</span>
                  </div>
                </div>

                {!hasChartData ? (
                  <EmptyState
                    title="No Analytics Available"
                    description="Not enough information to render the timeline."
                    icon={TrendingUp}
                    showBackButton={false}
                    fullPage={false}
                  />
                ) : (
                  <div className="bg-white/3 border border-white/5 rounded-xl p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                      <h3 className="text-[11px] font-black uppercase italic tracking-wider text-white/60">
                        Event Timeline (Per Minute)
                      </h3>
                      <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-main" />
                          <span>Viewers ({metrics?.viewersPerMinute}/m avg.)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                          <span>Messages ({metrics?.messagesPerMinute}/m avg.)</span>
                        </div>
                      </div>
                    </div>

                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={metrics?.metricsDetails} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                          <XAxis 
                            tick={{ fill: '#ffffff30', fontSize: 9, fontWeight: 'bold' }} 
                            tickLine={false}
                            axisLine={false}
                            label={{ value: 'Time (min)', position: 'insideBottomRight', offset: -5, fill: '#ffffff20', fontSize: 8 }}
                          />
                          <YAxis 
                            tick={{ fill: '#ffffff30', fontSize: 9, fontWeight: 'bold' }} 
                            tickLine={false}
                            axisLine={false} 
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#121212', borderColor: '#ffffff10', borderRadius: '8px' }}
                            itemStyle={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}
                            labelStyle={{ display: 'none' }}
                          />
                          <Line 
                            name="Viewers"
                            type="monotone" 
                            dataKey="viewerCount" 
                            stroke="#a855f7"
                            strokeWidth={2.5}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                          <Line 
                            name="Messages"
                            type="monotone" 
                            dataKey="messageCount" 
                            stroke="#4ade80" 
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};