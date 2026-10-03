import React from 'react';
import { motion } from 'motion/react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { User } from '../types';

interface IncomingCallModalProps {
  caller: User;
  isVideo: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  caller,
  isVideo,
  onAccept,
  onDecline,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl text-center"
      >
        <div className="relative w-20 h-20 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white text-3xl font-black shadow-lg">
            {(caller.name || 'U').charAt(0).toUpperCase()}
          </div>
        </div>

        <h3 className="text-xl font-bold text-white font-display">
          {caller.name}
        </h3>
        <p className="text-xs text-indigo-300 font-mono-code mt-0.5">
          ID: {caller.chatId}
        </p>
        <p className="text-sm text-slate-400 mt-2 flex items-center justify-center gap-1.5 font-medium">
          {isVideo ? <Video size={16} className="text-sky-400" /> : <Phone size={16} className="text-emerald-400" />}
          <span>Incoming {isVideo ? 'Video' : 'Audio'} Call...</span>
        </p>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={onDecline}
            className="py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-rose-400 border border-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <PhoneOff size={18} />
            <span>Decline</span>
          </button>
          <button
            onClick={onAccept}
            className="py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Phone size={18} />
            <span>Accept</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
