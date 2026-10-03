import React from 'react';
import { motion } from 'motion/react';
import { PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { User } from '../types';

interface CallModalProps {
  peer: User;
  isVideo: boolean;
  localVideoRef: React.RefObject<HTMLVideoElement | null>;
  remoteVideoRef: React.RefObject<HTMLVideoElement | null>;
  onEndCall: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  isVideoOff: boolean;
  onToggleVideo: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  peer,
  isVideo,
  localVideoRef,
  remoteVideoRef,
  onEndCall,
  isMuted,
  onToggleMute,
  isVideoOff,
  onToggleVideo,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-between p-6"
    >
      {/* Top Bar with Peer Info */}
      <div className="w-full max-w-2xl flex items-center justify-between z-10">
        <div>
          <h3 className="text-xl font-bold text-white font-display">
            {peer.name}
          </h3>
          <p className="text-xs text-indigo-300 font-mono-code">
            ID: {peer.chatId} • {isVideo ? 'Encrypted Video Call' : 'Encrypted Voice Call'}
          </p>
        </div>
        <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold animate-pulse">
          Connected
        </div>
      </div>

      {/* Main Video/Call Display Stage */}
      <div className="relative w-full max-w-3xl flex-1 my-4 rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
        {isVideo ? (
          <>
            {/* Remote Video (Full Size) */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Local Video (Floating Inset) */}
            <div className="absolute right-4 bottom-4 w-32 sm:w-44 aspect-video rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-950 shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover -scale-x-100"
              />
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <div className="w-28 h-28 mx-auto mb-6 rounded-3xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-4xl font-black text-white shadow-2xl shadow-indigo-500/30 animate-pulse">
              {(peer.name || 'U').charAt(0).toUpperCase()}
            </div>
            <h4 className="text-2xl font-bold text-white mb-2">{peer.name}</h4>
            <p className="text-sm text-slate-400">Audio call in progress...</p>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md z-10">
        <button
          onClick={onToggleMute}
          className={`p-4 rounded-2xl font-bold transition-all cursor-pointer ${
            isMuted
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
        </button>

        {isVideo && (
          <button
            onClick={onToggleVideo}
            className={`p-4 rounded-2xl font-bold transition-all cursor-pointer ${
              isVideoOff
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
          </button>
        )}

        <button
          onClick={onEndCall}
          className="px-7 py-4 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-600/40 transition-all cursor-pointer"
        >
          <PhoneOff size={22} />
          <span>End Call</span>
        </button>
      </div>
    </motion.div>
  );
};
