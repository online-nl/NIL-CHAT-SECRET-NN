import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, Search, User as UserTabIcon, Copy, Check, Trash2, ArrowRight } from 'lucide-react';
import { User, UserChatSummary } from '../types';
import { UserAvatar } from './UserAvatar';
import { VerifiedBadge } from './VerifiedBadge';
import { AccountPage } from './AccountPage';
import { PWAInstallButton } from './PWAInstallButton';
import { db, ref, get } from '../firebase';
import { isUserVerifiedActive } from '../utils/verification';

interface SidebarProps {
  currentUser: User;
  recentChats: UserChatSummary[];
  activePeer: User | null;
  onSelectChat: (peer: User) => void;
  onViewProfile?: (peer: User) => void;
  onDeleteChatHistory: (uid: string) => void;
  onUpdateUser: (updated: Partial<User>) => void;
  onOpenVerifyModal: () => void;
  onLogout: () => void;
  showToast: (msg: string) => void;
  isMobileChatOpen: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  recentChats,
  activePeer,
  onSelectChat,
  onViewProfile,
  onDeleteChatHistory,
  onUpdateUser,
  onOpenVerifyModal,
  onLogout,
  showToast,
  isMobileChatOpen,
}) => {
  const [activeTab, setActiveTab] = useState<'chats' | 'search' | 'account'>('chats');
  const [copiedMyId, setCopiedMyId] = useState(false);

  // Search tab states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Context menu for chat history delete
  const [selectedChatForOptions, setSelectedChatForOptions] = useState<UserChatSummary | null>(null);

  const copyMyChatId = () => {
    navigator.clipboard.writeText(currentUser.chatId);
    setCopiedMyId(true);
    showToast('Your 6-digit Chat ID copied!');
    setTimeout(() => setCopiedMyId(false), 2000);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanId = searchQuery.trim();
    setSearchError(null);
    setSearchResult(null);

    if (!cleanId) return;

    if (!/^\d{6}$/.test(cleanId)) {
      setSearchError('অনুগ্রহ করে সঠিক ৬-সংখ্যার Chat ID লিখুন');
      return;
    }

    if (cleanId === currentUser.chatId) {
      setSearchError('এটি আপনার নিজের Chat ID!');
      return;
    }

    setIsSearching(true);
    try {
      const idSnap = await get(ref(db, `chatIds/${cleanId}`));
      const uid = idSnap.val();

      if (!uid) {
        setSearchError('কোনো ব্যবহারকারী পাওয়া যায়নি / User not found');
        return;
      }

      const userSnap = await get(ref(db, `users/${uid}`));
      const userData = userSnap.val() as User | null;

      if (!userData) {
        setSearchError('User profile পাওয়া যায়নি');
        return;
      }

      const isVerified = isUserVerifiedActive(userData, true);
      setSearchResult({ ...userData, verified: isVerified });
    } catch {
      setSearchError('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <aside
      className={`w-full md:w-[380px] lg:w-[420px] flex-none h-full flex flex-col bg-slate-950/95 border-r border-slate-800/80 z-20 ${
        isMobileChatOpen ? 'hidden md:flex' : 'flex'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-500 flex items-center justify-center text-white font-black text-lg font-display shadow-md shadow-indigo-500/20">
            N
          </div>
          <div>
            <h1 className="text-lg font-black text-white font-display tracking-tight leading-none">
              NiL dArK NeT
            </h1>
            <span className="text-[11px] text-slate-400 font-medium">
              Real-time Messenger
            </span>
          </div>
        </div>

        <PWAInstallButton variant="compact" />
      </div>

      {/* Current User Profile Glance */}
      <div className="p-3 sm:px-4">
        <div className="p-3 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800/90 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <UserAvatar
              name={currentUser.name}
              photo={currentUser.photo}
              size="md"
              online={true}
              showOnlineStatus={true}
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-bold text-sm text-white truncate">
                <span className="truncate">{currentUser.name}</span>
                {isUserVerifiedActive(currentUser) && <VerifiedBadge size="sm" />}
              </div>
              <div className="text-xs text-indigo-400 font-mono-code font-bold tracking-wider">
                ID: {currentUser.chatId}
              </div>
            </div>
          </div>

          <button
            onClick={copyMyChatId}
            className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ml-2"
            title="Copy Chat ID"
          >
            {copiedMyId ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span className="text-[11px] text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} className="text-indigo-400" />
                <span className="text-[11px]">Copy ID</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* CHATS TAB */}
        {activeTab === 'chats' && (
          <div className="flex-1 overflow-y-auto px-2 sm:px-3 py-2 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Recent Conversations ({recentChats.length})
            </div>

            {recentChats.length === 0 ? (
              <div className="py-16 text-center text-slate-500 px-4">
                <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
                  <MessageSquare size={22} />
                </div>
                <p className="text-sm font-semibold text-slate-300">No recent chats</p>
                <p className="text-xs mt-1 text-slate-400">
                  Search a 6-digit Chat ID to start messaging.
                </p>
                <button
                  onClick={() => setActiveTab('search')}
                  className="mt-4 px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-colors cursor-pointer"
                >
                  Search Users
                </button>
              </div>
            ) : (
              recentChats.map((chat) => {
                const isActive = activePeer?.uid === chat.uid;
                return (
                  <div
                    key={chat.uid}
                    onClick={() =>
                      onSelectChat({
                        uid: chat.uid,
                        chatId: chat.chatId,
                        name: chat.name,
                        photo: chat.photo,
                        verified: chat.verified,
                      })
                    }
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setSelectedChatForOptions(chat);
                    }}
                    className={`group relative flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-indigo-600/15 border border-indigo-500/30 shadow-sm'
                        : 'hover:bg-slate-900/90 border border-transparent hover:border-slate-800/80'
                    }`}
                  >
                    <div
                      onClick={(e) => {
                        if (onViewProfile) {
                          e.stopPropagation();
                          onViewProfile({
                            uid: chat.uid,
                            chatId: chat.chatId,
                            name: chat.name,
                            photo: chat.photo,
                            bio: chat.bio,
                            verified: chat.verified,
                            hideOnlineStatus: chat.hideOnlineStatus,
                          });
                        }
                      }}
                      className="cursor-pointer hover:scale-105 transition-transform shrink-0"
                      title={`${chat.name} এর প্রোফাইল দেখুন`}
                    >
                      <UserAvatar
                        name={chat.name}
                        photo={chat.photo}
                        size="md"
                        online={chat.online && !chat.hideOnlineStatus}
                        showOnlineStatus={true}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-sm text-slate-200 truncate">
                          <span className="truncate">{chat.name}</span>
                          {isUserVerifiedActive(chat, false) && <VerifiedBadge size="sm" />}
                        </div>
                        {chat.updatedAt && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(chat.updatedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="truncate max-w-[210px]">
                          {chat.lastMessage || 'Start conversation'}
                        </span>
                        <span className="text-[10px] font-mono-code text-indigo-400/80 shrink-0 ml-1">
                          #{chat.chatId}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* SEARCH TAB */}
        {activeTab === 'search' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <form onSubmit={handleSearch} className="space-y-3">
              <label className="block text-xs font-bold text-slate-300">
                Search 6-Digit Chat ID / চ্যাট আইডি খুঁজুন
              </label>
              <div className="relative flex items-center">
                <Search size={18} className="absolute left-3.5 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g. 849201"
                  className="w-full pl-10 pr-20 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono-code placeholder-slate-500 text-sm tracking-wider focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSearching ? '...' : 'Search'}
                </button>
              </div>
            </form>

            {searchError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {searchError}
              </div>
            )}

            {searchResult && (
              <div className="p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-lg space-y-3">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    name={searchResult.name}
                    photo={searchResult.photo}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-bold text-base text-white truncate">
                      <span>{searchResult.name}</span>
                      {searchResult.verified && <VerifiedBadge size="sm" />}
                    </div>
                    <div className="text-xs text-indigo-400 font-mono-code font-bold">
                      Chat ID: {searchResult.chatId}
                    </div>
                    {searchResult.bio && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                        "{searchResult.bio}"
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    onSelectChat(searchResult);
                    setSearchResult(null);
                    setSearchQuery('');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] cursor-pointer"
                >
                  <span>Start Chatting</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ACCOUNT TAB */}
        {activeTab === 'account' && (
          <AccountPage
            user={currentUser}
            onUpdateUser={onUpdateUser}
            onOpenVerifyModal={onOpenVerifyModal}
            onLogout={onLogout}
            showToast={showToast}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="p-2 sm:p-3 border-t border-slate-800/80 bg-slate-950">
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'chats'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={16} />
            <span>Chats</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search size={16} />
            <span>Search</span>
          </button>

          <button
            onClick={() => setActiveTab('account')}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition-all cursor-pointer ${
              activeTab === 'account'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserTabIcon size={16} />
            <span>Account</span>
          </button>
        </div>
      </div>

      {/* Chat Options Context Modal */}
      {selectedChatForOptions && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-700/80 p-6 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white font-display mb-1">
              Chat Options
            </h3>
            <p className="text-xs text-slate-400 mb-5">
              “{selectedChatForOptions.name}” এর সাথে চ্যাট অপশন:
            </p>

            <div className="space-y-2">
              <button
                onClick={() => {
                  if (onViewProfile && selectedChatForOptions) {
                    onViewProfile({
                      uid: selectedChatForOptions.uid,
                      chatId: selectedChatForOptions.chatId,
                      name: selectedChatForOptions.name,
                      photo: selectedChatForOptions.photo,
                      bio: selectedChatForOptions.bio,
                      verified: selectedChatForOptions.verified,
                      hideOnlineStatus: selectedChatForOptions.hideOnlineStatus,
                    });
                  }
                  setSelectedChatForOptions(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <UserTabIcon size={16} className="text-indigo-400" />
                <span>প্রোফাইল ও বিস্তারিত দেখুন (View Profile)</span>
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedChatForOptions.chatId);
                  showToast('User ID copied!');
                  setSelectedChatForOptions(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Copy size={16} className="text-indigo-400" />
                <span>Copy Chat ID ({selectedChatForOptions.chatId})</span>
              </button>

              <button
                onClick={() => {
                  onDeleteChatHistory(selectedChatForOptions.uid);
                  setSelectedChatForOptions(null);
                }}
                className="w-full py-3 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
                <span>Delete Chat History</span>
              </button>

              <button
                onClick={() => setSelectedChatForOptions(null)}
                className="w-full py-2.5 text-center text-xs text-slate-400 hover:text-white cursor-pointer mt-2"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </aside>
  );
};
