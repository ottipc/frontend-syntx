'use client';

import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

interface ResonanceIndicatorProps {
  messageCount: number;
}

export const ResonanceIndicator = ({ messageCount }: ResonanceIndicatorProps) => {
  const level = Math.min(messageCount / 10, 1);
  const color = level > 0.7 ? 'bg-green-500' : level > 0.4 ? 'bg-yellow-500' : 'bg-cyan-500';
  
  return (
    <div className="flex items-center gap-2">
      <Activity size={14} className="text-cyan-400" />
      <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${level * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <span className="text-xs text-gray-500">{Math.round(level * 100)}%</span>
    </div>
  );
};
