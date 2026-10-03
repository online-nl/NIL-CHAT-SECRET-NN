import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Trash2, Check, CheckCheck, MoreVertical, ShieldAlert } from 'lucide-react';
import { Message } from '../types';
import { UserAvatar } from './UserAvatar';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  peerName?: string;
  peerPhoto?: string;
  onAvatarClick?: () => void;
  onDeleteForMe: (key: string) => void;
  onDeleteForEveryone?: (key: string) => void;
  onCopyText: (text: string) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  peerName,
  peerPhoto,
  onAvatarClick,
  onDeleteForMe,
  onDeleteForEveryone,
  onCopyText,
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const formattedTime = new Date(
    typeof message.createdAt === 'number' ? message.createdAt : Date.now()
  ).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleCopy = () => {
    onCopyText(message.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 1800);
    setShowMenu(false);
  };

  // Handle mobile long press
  const handleTouchStart = () => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Render checkmark ticks for outgoing messages
  const renderTicks = () => {
    if (!isMine) return null;

    if (message.seenAt) {
      return (
        <span
          className="inline-flex items-center ml-1 text-sky-400 font-bold"
          title={`Seen ${new Date(message.seenAt).toLocaleTimeString()}`}
        >
          <CheckCheck size={13} strokeWidth={2.5} />
        </span>
      );
    }

    if (message.deliveredAt) {
      return (
        <span
          className="inline-flex items-center ml-1 text-slate-300/80 font-bold"
          title={`Delivered ${new Date(message.deliveredAt).toLocaleTimeString()}`}
        >
          <CheckCheck size={13} strokeWidth={2} />
        </span>
      );
    }

    return (
      <span className="inline-flex items-center ml-1 text-slate-300/70" title="Sent">
        <Check size={12} strokeWidth={2} />
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`group relative flex items-end w-full my-1.5 px-2 gap-2 ${
        isMine ? 'justify-end' : 'justify-start'
      }`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
    >
      {!isMine && peerName && (
        <button
          onClick={onAvatarClick}
          className="shrink-0 mb-1 cursor-pointer focus:outline-none transition-transform hover:scale-105 active:scale-95"
          title={`${peerName} এর প্রোফাইল দেখুন`}
        >
          <UserAvatar
            name={peerName}
            photo={peerPhoto}
            size="sm"
          />
        </button>
      )}

      <div
        className={`relative max-w-[85%] sm:max-w-[70%] md:max-w-[62%] transition-all ${
          isMine ? 'items-end' : 'items-start'
        }`}
      >
        {/* Quick action button on hover (desktop) */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 transition-opacity ${
            isMine ? '-left-16' : '-right-16'
          }`}
        >
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="p-1.5 rounded-xl bg-slate-800/90 text-slate-400 hover:text-white border border-slate-700/60 shadow-md backdrop-blur transition-colors"
            title="Message options"
          >
            <MoreVertical size={14} />
          </button>
        </div>

        {/* The actual Bubble */}
        <div
          onContextMenu={(e) => {
            e.preventDefault();
            setShowMenu((prev) => !prev);
          }}
          className={`relative px-4 py-2.5 shadow-sm select-text cursor-pointer transition-shadow ${
            isMine
              ? 'rounded-2xl rounded-tr-xs bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 text-white shadow-indigo-950/30'
              : 'rounded-2xl rounded-tl-xs bg-slate-800/95 text-slate-100 border border-slate-700/60 shadow-black/20'
          }`}
        >
          {/* Message Text */}
          <div className="text-[14.5px] leading-relaxed break-words whitespace-pre-wrap font-sans">
            {message.text}
          </div>

          {/* Timestamp & Status Metadata */}
          <div
            className={`flex items-center justify-end gap-1 mt-1 text-[10.5px] font-medium tracking-tight select-none ${
              isMine ? 'text-indigo-200/80' : 'text-slate-400'
            }`}
          >
            <span>{formattedTime}</span>
            {renderTicks()}
          </div>
        </div>

        {/* Dropdown Options Menu */}
        <AnimatePresence>
          {showMenu && (
            <>
              {/* Backdrop dismiss */}
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowMenu(false)}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className={`absolute z-40 top-full mt-1.5 min-w-[170px] p-1.5 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-800 shadow-2xl ${
                  isMine ? 'right-0' : 'left-0'
                }`}
              >
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  {isCopied ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} className="text-indigo-400" />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    onDeleteForMe(message.key);
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:bg-slate-800/80 transition-colors"
                >
                  <Trash2 size={14} className="text-amber-400" />
                  <span>Delete for Me</span>
                </button>

                {isMine && onDeleteForEveryone && (
                  <button
                    onClick={() => {
                      onDeleteForEveryone(message.key);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <ShieldAlert size={14} />
                    <span>Delete for Everyone</span>
                  </button>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
