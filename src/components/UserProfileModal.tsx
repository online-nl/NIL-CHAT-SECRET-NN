import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Phone,
  Video,
  MessageCircle,
  Copy,
  Check,
  ShieldCheck,
  Lock,
  Download,
  Maximize2,
  BellOff,
  Bell,
  Star,
  Trash2,
  Ban,
  Flag,
  Share2,
  Sparkles,
  Info,
  Smile,
  Clock,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCw,
} from 'lucide-react';
import { User, Message } from '../types';
import { VerifiedBadge } from './VerifiedBadge';
import { isUserVerifiedActive } from '../utils/verification';

interface UserProfileModalProps {
  peer: User;
  isOnline: boolean;
  messages: Message[];
  currentUserId: string;
  onClose: () => void;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onClearChatHistory: (peerUid: string) => void;
  showToast: (msg: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  peer,
  isOnline,
  messages,
  currentUserId,
  onClose,
  onStartAudioCall,
  onStartVideoCall,
  onClearChatHistory,
  showToast,
}) => {
  // Local state for interactive functions
  const [copiedId, setCopiedId] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxZoom, setLightboxZoom] = useState(1);
  const [lightboxRotation, setLightboxRotation] = useState(0);

  // Preference storage keys per peer
  const muteKey = `nil_muted_${currentUserId}_${peer.uid}`;
  const favKey = `nil_fav_${currentUserId}_${peer.uid}`;
  const blockKey = `nil_blocked_${currentUserId}_${peer.uid}`;

  const [isMuted, setIsMuted] = useState(() => {
    return localStorage.getItem(muteKey) === 'true';
  });
  const [isFavorite, setIsFavorite] = useState(() => {
    return localStorage.getItem(favKey) === 'true';
  });
  const [isBlocked, setIsBlocked] = useState(() => {
    return localStorage.getItem(blockKey) === 'true';
  });

  // Modal sub-views for safe confirmations
  const [confirmClearChat, setConfirmClearChat] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);

  // Active verified status (handles 1 hour trial or expired timestamps dynamically)
  const isPeerVerified = isUserVerifiedActive(peer, true);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('spam');
  const [reportText, setReportText] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'media' | 'safety'>('info');

  // Stats calculation
  const totalMessages = messages.length;
  const myMessagesCount = messages.filter((m) => m.senderId === currentUserId).length;
  const peerMessagesCount = totalMessages - myMessagesCount;

  // Find media / link items in messages if any
  const mediaMessages = messages.filter((m) => {
    const text = m.text.toLowerCase();
    return (
      text.startsWith('http://') ||
      text.startsWith('https://') ||
      text.startsWith('data:image/') ||
      text.includes('.png') ||
      text.includes('.jpg') ||
      text.includes('.jpeg') ||
      text.includes('.gif')
    );
  });

  // 1. Copy Chat ID
  const handleCopyChatId = () => {
    navigator.clipboard.writeText(peer.chatId);
    setCopiedId(true);
    showToast(`Chat ID #${peer.chatId} কপি করা হয়েছে!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // 2. Share Contact Link
  const handleShareProfile = () => {
    const shareText = `Connect with ${peer.name} on NiL dArK NeT! Chat ID: ${peer.chatId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      showToast('প্রোফাইল তথ্য ও লিংক ক্লিপবোর্ডে কপি হয়েছে!');
    }
  };

  // 3. Toggle Mute
  const handleToggleMute = () => {
    const nextVal = !isMuted;
    setIsMuted(nextVal);
    localStorage.setItem(muteKey, nextVal ? 'true' : 'false');
    showToast(
      nextVal
        ? `${peer.name} এর নোটিফিকেশন মিউট করা হয়েছে (Muted)`
        : `${peer.name} এর নোটিফিকেশন চালু করা হয়েছে (Unmuted)`
    );
  };

  // 4. Toggle Favorite
  const handleToggleFavorite = () => {
    const nextVal = !isFavorite;
    setIsFavorite(nextVal);
    localStorage.setItem(favKey, nextVal ? 'true' : 'false');
    showToast(
      nextVal
        ? `⭐ ${peer.name} কে প্রিয় তালিকায় যোগ করা হয়েছে!`
        : `প্রিয় তালিকা থেকে সরানো হয়েছে`
    );
  };

  // 5. Toggle Block
  const handleToggleBlock = () => {
    const nextVal = !isBlocked;
    setIsBlocked(nextVal);
    localStorage.setItem(blockKey, nextVal ? 'true' : 'false');
    setConfirmBlock(false);
    showToast(
      nextVal
        ? `🚫 ${peer.name} কে ব্লক করা হয়েছে`
        : `✅ ${peer.name} কে আনব্লক করা হয়েছে`
    );
  };

  // 6. Clear chat history
  const handleExecuteClearChat = () => {
    onClearChatHistory(peer.uid);
    setConfirmClearChat(false);
    showToast('এই চ্যাটের সকল মেসেজ মুছে ফেলা হয়েছে!');
    onClose();
  };

  // 7. Submit report
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    setShowReportModal(false);
    showToast(`রিপোর্ট জমা হয়েছে (${reportReason})। ধন্যবাদ!`);
  };

  // 8. Download Profile Image
  const handleDownloadPhoto = () => {
    if (!peer.photo) return;
    const a = document.createElement('a');
    a.href = peer.photo;
    a.download = `${peer.name.replace(/\s+/g, '_')}_profile.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('ছবি ডাউনলোড শুরু হয়েছে!');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 10 }}
          className="w-full max-w-md bg-slate-900 border border-slate-750 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative"
        >
          {/* Header Banner Background */}
          <div className="h-28 sm:h-32 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 relative overflow-hidden flex items-start justify-between p-4 shrink-0">
            {/* Pattern Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/15 via-transparent to-black/30 pointer-events-none" />

            {/* Favorite Star Badge Top Left */}
            <button
              onClick={handleToggleFavorite}
              className={`relative z-10 p-2 rounded-xl backdrop-blur-md border transition-all cursor-pointer ${
                isFavorite
                  ? 'bg-amber-500/30 border-amber-400/50 text-amber-300 shadow-md'
                  : 'bg-black/30 border-white/15 text-white/70 hover:text-white hover:bg-black/45'
              }`}
              title={isFavorite ? 'Remove Favorite' : 'Mark as Favorite'}
            >
              <Star size={17} className={isFavorite ? 'fill-amber-400' : ''} />
            </button>

            {/* Close Button Top Right */}
            <button
              onClick={onClose}
              className="relative z-10 p-2 rounded-xl bg-black/30 hover:bg-black/50 border border-white/15 text-white hover:text-white transition-all cursor-pointer"
              title="Close Profile"
            >
              <X size={18} />
            </button>
          </div>

          {/* Centered Profile Picture Section */}
          <div className="relative px-6 pt-0 pb-4 flex flex-col items-center text-center -mt-16 sm:-mt-18 shrink-0">
            {/* Profile Avatar Frame */}
            <div className="relative group select-none">
              <div
                onClick={() => setIsLightboxOpen(true)}
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden bg-slate-800 border-4 border-slate-900 ring-4 ring-indigo-500/40 shadow-2xl flex items-center justify-center text-white text-4xl sm:text-5xl font-black cursor-pointer group-hover:ring-indigo-400 group-hover:scale-[1.02] transition-all"
                title="ফুল সাইজ দেখতে ক্লিক করুন / Click to view full picture"
              >
                {peer.photo ? (
                  <img
                    src={peer.photo}
                    alt={peer.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center">
                    <span>{(peer.name || 'U').charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>

              {/* Hover Zoom Icon Badge */}
              <button
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-1 right-1 p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl border-2 border-slate-900 cursor-pointer transition-transform group-hover:scale-110"
                title="ছবি বড় করে দেখুন (View Full Photo)"
              >
                <Maximize2 size={13} />
              </button>

              {/* Online indicator dot */}
              <span
                className={`absolute top-2 right-2 w-4 h-4 rounded-full border-2 border-slate-900 shadow-md ${
                  isOnline && !peer.hideOnlineStatus
                    ? 'bg-emerald-400 ring-2 ring-emerald-500/50 animate-pulse'
                    : 'bg-slate-500'
                }`}
                title={isOnline && !peer.hideOnlineStatus ? 'Online' : 'Offline'}
              />
            </div>

            {/* Profile Name (প্রফাইল পিক এর নিচে মাঝখানে থাকবে নাম) */}
            <div className="mt-3.5 flex items-center justify-center gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white font-display tracking-tight text-center">
                {peer.name}
              </h3>
              {isPeerVerified && <VerifiedBadge size="md" />}
            </div>

            {/* Bio (নাম এর নিচে বাইও যেটা সে দিবে) */}
            <div className="mt-1.5 max-w-xs sm:max-w-sm">
              {peer.bio ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs font-medium italic shadow-sm">
                  <Smile size={13} className="text-indigo-400 shrink-0 not-italic" />
                  <span className="break-words">“{peer.bio}”</span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  “Hey there! I am using NiL dArK NeT 🌙”
                </p>
              )}
            </div>

            {/* Chat ID Chip with 1-click Copy */}
            <div className="mt-2.5 flex items-center justify-center gap-2">
              <button
                onClick={handleCopyChatId}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-800 hover:border-indigo-500/50 text-xs font-mono-code font-bold text-indigo-400 transition-colors cursor-pointer group"
                title="Click to copy Chat ID"
              >
                <span>ID: #{peer.chatId}</span>
                {copiedId ? (
                  <Check size={13} className="text-emerald-400" />
                ) : (
                  <Copy size={13} className="text-slate-400 group-hover:text-indigo-300" />
                )}
              </button>

              {/* Online / Offline Status Badge */}
              <span
                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                  isOnline && !peer.hideOnlineStatus
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-slate-800/80 text-slate-400 border-slate-700/80'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isOnline && !peer.hideOnlineStatus ? 'bg-emerald-400' : 'bg-slate-500'
                  }`}
                />
                <span>{isOnline && !peer.hideOnlineStatus ? 'Active Now' : 'Offline'}</span>
              </span>
            </div>

            {/* 4 Main Action Buttons (Call, Video, Message, Share) */}
            <div className="w-full grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-800">
              {/* Voice Call */}
              <button
                onClick={() => {
                  onClose();
                  onStartAudioCall();
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer group"
                title="Start Audio Call"
              >
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Phone size={18} />
                </div>
                <span className="text-[11px] font-semibold mt-1">Audio</span>
              </button>

              {/* Video Call */}
              <button
                onClick={() => {
                  onClose();
                  onStartVideoCall();
                }}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer group"
                title="Start Video Call"
              >
                <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 group-hover:scale-110 transition-transform">
                  <Video size={18} />
                </div>
                <span className="text-[11px] font-semibold mt-1">Video</span>
              </button>

              {/* Message */}
              <button
                onClick={onClose}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer group"
                title="Back to Chat"
              >
                <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-400 group-hover:scale-110 transition-transform">
                  <MessageCircle size={18} />
                </div>
                <span className="text-[11px] font-semibold mt-1">Message</span>
              </button>

              {/* Share Profile */}
              <button
                onClick={handleShareProfile}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 border border-slate-700/80 text-slate-200 hover:text-white transition-all cursor-pointer group"
                title="Share Profile / Copy Link"
              >
                <div className="p-2 rounded-xl bg-purple-500/15 text-purple-400 group-hover:scale-110 transition-transform">
                  <Share2 size={18} />
                </div>
                <span className="text-[11px] font-semibold mt-1">Share</span>
              </button>
            </div>
          </div>

          {/* Sub Navigation Tabs */}
          <div className="flex items-center px-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'info'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Info & Stats
            </button>
            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'media'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Media ({mediaMessages.length})
            </button>
            <button
              onClick={() => setActiveTab('safety')}
              className={`flex-1 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                activeTab === 'safety'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Privacy & Controls
            </button>
          </div>

          {/* Scrollable Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {activeTab === 'info' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* Verification Card */}
                {isPeerVerified && (
                  <div className="p-3.5 rounded-2xl bg-sky-950/30 border border-sky-500/30 flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Official Verified User</span>
                        <VerifiedBadge size="sm" />
                      </div>
                      <p className="text-[11px] text-sky-300/80">
                        {peer.verifyPackage || 'Verified VIP Account'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Conversation Metrics */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col">
                    <span className="text-[11px] text-slate-400 font-medium">Total Messages</span>
                    <span className="text-base font-bold text-white font-mono-code mt-0.5">
                      {totalMessages}
                    </span>
                    <span className="text-[10px] text-indigo-400 mt-0.5">
                      You: {myMessagesCount} • {peer.name.split(' ')[0]}: {peerMessagesCount}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col">
                    <span className="text-[11px] text-slate-400 font-medium">Encryption</span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-1">
                      <Lock size={13} />
                      <span>P2P Secured</span>
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      WebRTC + Firebase Cloud
                    </span>
                  </div>
                </div>

                {/* Mute Notification Toggle Row */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-900 text-slate-300">
                      {isMuted ? <BellOff size={16} /> : <Bell size={16} />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Mute Notifications</div>
                      <div className="text-[11px] text-slate-400">
                        {isMuted ? 'মেসেজ সাউন্ড মিউট করা' : 'সাধারণ সাউন্ড নোটিফিকেশন'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleMute}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      isMuted ? 'bg-indigo-600' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isMuted ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Favorite Toggle Row */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                      <Star size={16} className={isFavorite ? 'fill-amber-400' : ''} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Pin as Favorite</div>
                      <div className="text-[11px] text-slate-400">
                        {isFavorite ? 'প্রিয় কন্টাক্ট হিসেবে চিহ্নিত' : 'স্বাভাবিক কন্টাক্ট'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleFavorite}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                      isFavorite ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                        isFavorite ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'media' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {mediaMessages.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    <p className="mb-1">এখনও কোনো ফটো বা লিংক শেয়ার করা হয়নি।</p>
                    <p className="text-[11px] text-slate-500">
                      (No media or shared links found in this chat yet)
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-300">
                      Shared Links & Files ({mediaMessages.length})
                    </div>
                    {mediaMessages.map((m, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300"
                      >
                        <span className="truncate max-w-[240px] text-indigo-400 font-mono-code">
                          {m.text}
                        </span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(m.text);
                            showToast('Link copied!');
                          }}
                          className="p-1 text-slate-400 hover:text-white"
                          title="Copy Link"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'safety' && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {/* Block / Unblock User */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/15 text-rose-400">
                      <Ban size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">
                        {isBlocked ? 'User is Blocked' : 'Block Contact'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {isBlocked
                          ? 'এই ইউজার বর্তমানে ব্লক করা আছে'
                          : 'মেসেজ ও কল গ্রহণ বন্ধ করতে পারেন'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirmBlock(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                      isBlocked
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {isBlocked ? 'Unblock' : 'Block'}
                  </button>
                </div>

                {/* Clear Chat History */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-orange-500/15 text-orange-400">
                      <Trash2 size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Clear Chat History</div>
                      <div className="text-[11px] text-slate-400">
                        এই কথোপকথনের সব বার্তা মুছুন
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setConfirmClearChat(true)}
                    className="px-3 py-1.5 rounded-xl bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Clear Chat
                  </button>
                </div>

                {/* Report User */}
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-slate-800 text-slate-400">
                      <Flag size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Report Contact</div>
                      <div className="text-[11px] text-slate-400">
                        স্প্যাম বা অসঙ্গত আচরণের অভিযোগ জানান
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowReportModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold cursor-pointer transition-colors"
                  >
                    Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Confirmation: Clear Chat Modal */}
      {confirmClearChat && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-750 p-5 rounded-3xl text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <h4 className="text-sm font-bold text-white">চ্যাট হিস্ট্রি মুছবেন?</h4>
            <p className="text-xs text-slate-400">
              {peer.name} এর সাথে আদান-প্রদান করা সকল মেসেজ স্থায়ীভাবে মুছে যাবে।
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setConfirmClearChat(false)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteClearChat}
                className="py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold cursor-pointer"
              >
                Delete All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation: Block User Modal */}
      {confirmBlock && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-slate-900 border border-slate-750 p-5 rounded-3xl text-center space-y-3 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <Ban size={24} />
            </div>
            <h4 className="text-sm font-bold text-white">
              {isBlocked ? 'ইউজার আনব্লক করবেন?' : 'ইউজার ব্লক করবেন?'}
            </h4>
            <p className="text-xs text-slate-400">
              {isBlocked
                ? `${peer.name} কে আনব্লক করলে পুনরায় মেসেজ আদান-প্রদান করতে পারবেন।`
                : `${peer.name} থেকে কোনো কল বা নোটিফিকেশন আসবে না।`}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={() => setConfirmBlock(false)}
                className="py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleBlock}
                className={`py-2.5 rounded-xl text-white text-xs font-bold cursor-pointer ${
                  isBlocked ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {isBlocked ? 'Unblock' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReport}
            className="w-full max-w-sm bg-slate-900 border border-slate-750 p-5 rounded-3xl space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Flag size={16} className="text-rose-400" />
                <span>রিপোর্ট করুন / Report User</span>
              </div>
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <label className="font-semibold block">রিপোর্টের কারণ নির্বাচন করুন:</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="spam">স্প্যাম বা অযাচিত মেসেজ (Spam)</option>
                <option value="harassment">হয়রানি বা খারাপ আচরণ (Harassment)</option>
                <option value="fake_account">ভুয়া প্রোফাইল বা প্রতারণা (Fake Account)</option>
                <option value="inappropriate">অশ্লীল বা অনুচিত বিষয়বস্তু (Inappropriate)</option>
              </select>
            </div>

            <div className="space-y-1 text-xs text-slate-300">
              <label className="font-semibold block">বিস্তারিত বিবরণ (ঐচ্ছিক):</label>
              <textarea
                rows={2}
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                placeholder="অতিরিক্ত কোনো তথ্য থাকলে লিখুন..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowReportModal(false)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Full-Screen HD Lightbox Modal for Profile Picture */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-70 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-between p-4 animate-in fade-in duration-200 select-none">
          {/* Lightbox Header Controls */}
          <div className="w-full max-w-3xl flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <h4 className="text-white font-bold text-sm sm:text-base font-display">
                {peer.name}
              </h4>
              {peer.verified && <VerifiedBadge size="sm" />}
            </div>

            <div className="flex items-center gap-2">
              {peer.photo && (
                <button
                  onClick={handleDownloadPhoto}
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer"
                  title="ছবি ডাউনলোড করুন (Download Photo)"
                >
                  <Download size={18} />
                </button>
              )}

              <button
                onClick={() => {
                  setIsLightboxOpen(false);
                  setLightboxZoom(1);
                  setLightboxRotation(0);
                }}
                className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-white transition-colors cursor-pointer"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Lightbox Center Image with Zoom & Rotate */}
          <div className="flex-1 w-full max-w-3xl flex items-center justify-center overflow-hidden p-4">
            {peer.photo ? (
              <img
                src={peer.photo}
                alt={peer.name}
                style={{
                  transform: `scale(${lightboxZoom}) rotate(${lightboxRotation}deg)`,
                  transition: 'transform 0.15s ease-out',
                }}
                className="max-w-full max-h-[72vh] object-contain rounded-2xl shadow-2xl pointer-events-auto"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-7xl font-black shadow-2xl">
                <span>{(peer.name || 'U').charAt(0).toUpperCase()}</span>
              </div>
            )}
          </div>

          {/* Lightbox Bottom Controls (Zoom in, Zoom out, Rotate 90) */}
          <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-2xl shadow-2xl">
            <button
              onClick={() => setLightboxZoom((z) => Math.max(0.6, z - 0.2))}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>
            <span className="text-xs font-mono-code text-indigo-400 font-bold w-12 text-center">
              {Math.round(lightboxZoom * 100)}%
            </span>
            <button
              onClick={() => setLightboxZoom((z) => Math.min(3, z + 0.2))}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>
            <div className="w-px h-5 bg-slate-800" />
            <button
              onClick={() => setLightboxRotation((r) => (r + 90) % 360)}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer flex items-center gap-1 text-xs"
              title="Rotate 90 degrees"
            >
              <RotateCw size={17} />
              <span>{lightboxRotation}°</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};
