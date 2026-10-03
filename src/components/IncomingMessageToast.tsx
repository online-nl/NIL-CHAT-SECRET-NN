import React from 'react';
import { MessageSquare, X, ArrowRight } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface IncomingMessageToastProps {
  toast: {
    id: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    text: string;
  } | null;
  onOpenChat: (senderId: string) => void;
  onClose: () => void;
}

export const IncomingMessageToast: React.FC<IncomingMessageToastProps> = ({
  toast,
  onOpenChat,
  onClose,
}) => {
  if (!toast) return null;

  return (
    <div className="fixed top-4 right-4 left-4 sm:left-auto sm:w-96 z-50 animate-in slide-in-from-top-4 duration-250">
      <div className="bg-slate-900/95 border border-indigo-500/40 rounded-2xl p-3.5 shadow-2xl shadow-indigo-950/50 backdrop-blur-md flex items-center justify-between gap-3 text-slate-100">
        <div
          onClick={() => {
            onOpenChat(toast.senderId);
            onClose();
          }}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
        >
          <div className="relative shrink-0">
            <UserAvatar name={toast.senderName} photo={toast.senderPhoto} size="sm" />
            <div className="absolute -bottom-1 -right-1 p-0.5 bg-indigo-600 rounded-full border border-slate-900">
              <MessageSquare size={10} className="text-white" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-white group-hover:text-indigo-300 transition-colors truncate">
                {toast.senderName}
              </span>
              <span className="text-[10px] text-indigo-400 font-medium shrink-0 ml-2">
                এখনই মেসেজ পাঠিয়েছে
              </span>
            </div>
            <p className="text-xs text-slate-300 truncate mt-0.5 font-normal">
              {toast.text}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => {
              onOpenChat(toast.senderId);
              onClose();
            }}
            className="p-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 hover:text-white transition cursor-pointer"
            title="Open Chat"
          >
            <ArrowRight size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
