import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send,
  Phone,
  Video,
  ChevronLeft,
  MessageCircle,
  CheckCircle2,
  ShieldCheck,
  Search,
  Info,
} from 'lucide-react';
import {
  db,
  ref,
  onValue,
  onChildAdded,
  set,
  get,
  update,
  remove,
  push,
  serverTimestamp,
  SESSION_KEY,
  getConversationId,
} from './firebase';
import { User, Message, UserChatSummary, CallSignal } from './types';
import { AuthModal } from './components/AuthModal';
import { Sidebar } from './components/Sidebar';
import { MessageBubble } from './components/MessageBubble';
import { UserAvatar } from './components/UserAvatar';
import { VerifiedBadge } from './components/VerifiedBadge';
import { CallModal } from './components/CallModal';
import { IncomingCallModal } from './components/IncomingCallModal';
import { VerifyModal } from './components/VerifyModal';
import { UserProfileModal } from './components/UserProfileModal';
import { NotificationPermissionBanner } from './components/NotificationPermissionBanner';
import { IncomingMessageToast } from './components/IncomingMessageToast';
import { playMessageSentSound, playNotificationChime, playIncomingMessageSound } from './utils/sound';
import { showBrowserNotification } from './utils/notifications';
import { isUserVerifiedActive } from './utils/verification';

export default function App() {
  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);

  // Active chat peer
  const [activePeer, setActivePeer] = useState<User | null>(null);
  const [peerPresence, setPeerPresence] = useState<{ online: boolean; lastSeen?: number }>({
    online: false,
  });

  // Recent chats
  const [recentChats, setRecentChats] = useState<UserChatSummary[]>([]);

  // Messages in active conversation
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mobile layout state
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  // Modals & UI
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showPeerProfileModal, setShowPeerProfileModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Incoming message notification toast
  const [incomingToast, setIncomingToast] = useState<{
    id: string;
    senderId: string;
    senderName: string;
    senderPhoto?: string;
    text: string;
  } | null>(null);

  // Timestamp and deduplication for notifications & chimes
  const appStartTimeRef = useRef(Date.now());
  const soundedKeysRef = useRef<Set<string>>(new Set());

  // WebRTC Audio/Video Call states
  const [callActive, setCallActive] = useState(false);
  const [callIsVideo, setCallIsVideo] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{
    id: string;
    data: CallSignal;
    callerUser?: User;
  } | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const currentCallIdRef = useRef<string | null>(null);

  // Show toast utility
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 2400);
  };

  // Open / Select a chat with full profile hydration
  const handleSelectChat = async (peerSummary: Partial<User> & { uid: string }) => {
    try {
      const snap = await get(ref(db, `users/${peerSummary.uid}`));
      if (snap.exists()) {
        const fullPeer = snap.val() as User;
        const isVerified = isUserVerifiedActive(fullPeer, true);
        setActivePeer({ ...fullPeer, verified: isVerified });
      } else {
        setActivePeer({
          uid: peerSummary.uid,
          name: peerSummary.name || 'User',
          chatId: peerSummary.chatId || '',
          photo: peerSummary.photo,
        });
      }
      setIsMobileChatOpen(true);
    } catch {
      if (peerSummary.name) {
        setActivePeer({
          uid: peerSummary.uid,
          name: peerSummary.name,
          chatId: peerSummary.chatId || '',
          photo: peerSummary.photo,
        });
        setIsMobileChatOpen(true);
      }
    }
  };

  // 1. Auto-login on mount
  useEffect(() => {
    const savedUid = localStorage.getItem(SESSION_KEY);
    if (!savedUid) {
      setIsSessionLoading(false);
      return;
    }

    get(ref(db, `users/${savedUid}`))
      .then((snap) => {
        if (snap.exists()) {
          const u = snap.val() as User;
          // Check if verification has expired
          if (u.verified && u.verifyExpireTime) {
            const exp = new Date(u.verifyExpireTime).getTime();
            if (isNaN(exp) || exp <= Date.now()) {
              u.verified = false;
              u.verifyPackage = undefined;
              u.verifyExpireTime = undefined;
              update(ref(db, `users/${savedUid}`), {
                verified: false,
                verifyPackage: null,
                verifyExpireTime: null,
              }).catch(() => {});
            }
          }
          setCurrentUser(u);
        }
      })
      .catch((err) => console.warn('Auto-login error:', err))
      .finally(() => setIsSessionLoading(false));
  }, []);

  // Continuous background check: automatically remove blue tick when 1 hour or expiration ends
  useEffect(() => {
    if (!currentUser?.verified || !currentUser?.verifyExpireTime) return;

    const checkExpiration = () => {
      const expire = new Date(currentUser.verifyExpireTime!).getTime();
      if (isNaN(expire) || expire <= Date.now()) {
        update(ref(db, `users/${currentUser.uid}`), {
          verified: false,
          verifyPackage: null,
          verifyExpireTime: null,
        }).catch(() => {});
        setCurrentUser((prev) =>
          prev
            ? { ...prev, verified: false, verifyPackage: undefined, verifyExpireTime: undefined }
            : prev
        );
        showToast('ভেরিফাইড ব্লুটিকের মেয়াদ শেষ হয়ে গেছে। / Verification expired.');
        return true;
      }
      return false;
    };

    if (checkExpiration()) return;
    const interval = setInterval(() => {
      if (checkExpiration()) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser?.uid, currentUser?.verified, currentUser?.verifyExpireTime]);

  // 2. Presence tracking for current user
  useEffect(() => {
    if (!currentUser) return;

    const presRef = ref(db, `presence/${currentUser.uid}`);
    set(presRef, {
      online: true,
      lastSeen: serverTimestamp(),
    }).catch(() => {});

    // Listen for incoming calls
    const callsRef = ref(db, 'calls');
    const unsubCalls = onValue(callsRef, async (snap) => {
      if (!snap.exists()) return;
      const allCalls = snap.val();

      for (const [callId, data] of Object.entries(allCalls)) {
        const call = data as CallSignal;
        if (call.callee === currentUser.uid && !call.answer && callId !== currentCallIdRef.current) {
          // Fetch caller details
          const callerSnap = await get(ref(db, `users/${call.caller}`));
          const callerUser = callerSnap.exists() ? (callerSnap.val() as User) : undefined;

          setIncomingCall({
            id: callId,
            data: call,
            callerUser,
          });
          break;
        }
      }
    });

    return () => {
      unsubCalls();
      set(presRef, {
        online: false,
        lastSeen: serverTimestamp(),
      }).catch(() => {});
    };
  }, [currentUser]);

  // 3. Listen to Recent Chats
  useEffect(() => {
    if (!currentUser) return;

    const userChatsRef = ref(db, `userChats/${currentUser.uid}`);
    const unsub = onValue(userChatsRef, async (snap) => {
      if (!snap.exists()) {
        setRecentChats([]);
        return;
      }

      const chatsData = snap.val();
      const list: UserChatSummary[] = Object.values(chatsData);

      // Fetch live presence & verification updates
      const updatedList: UserChatSummary[] = await Promise.all(
        list.map(async (item) => {
          try {
            const uSnap = await get(ref(db, `users/${item.uid}`));
            const pSnap = await get(ref(db, `presence/${item.uid}`));
            const liveUser = uSnap.val() as User | undefined;
            const livePresence = pSnap.val();
            const isVerified = isUserVerifiedActive(liveUser, true);
            return {
              ...item,
              name: liveUser?.name || item.name,
              photo: liveUser?.photo || item.photo,
              verified: isVerified,
              online: !!livePresence?.online,
            };
          } catch {
            return item;
          }
        })
      );

      updatedList.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setRecentChats(updatedList);
    });

    return () => unsub();
  }, [currentUser]);

  // 4. Listen to Messages and Presence when Active Peer changes
  useEffect(() => {
    if (!currentUser || !activePeer) {
      setMessages([]);
      return;
    }

    // Active Peer Presence
    const peerPresRef = ref(db, `presence/${activePeer.uid}`);
    const unsubPres = onValue(peerPresRef, (snap) => {
      if (snap.exists()) {
        setPeerPresence(snap.val());
      } else {
        setPeerPresence({ online: false });
      }
    });

    // Active Peer Live Profile updates
    const peerUserRef = ref(db, `users/${activePeer.uid}`);
    const unsubPeerUser = onValue(peerUserRef, (snap) => {
      if (snap.exists()) {
        const peerData = snap.val() as User;
        const isVerified = isUserVerifiedActive(peerData, true);
        const updatedPeer = { ...peerData, verified: isVerified };
        setActivePeer((prev) => (prev ? { ...prev, ...updatedPeer } : updatedPeer));
      }
    });

    // Active Conversation Messages
    const convId = getConversationId(currentUser.uid, activePeer.uid);
    const messagesRef = ref(db, `messages/${convId}`);

    const unsubMessages = onValue(messagesRef, (snap) => {
      if (!snap.exists()) {
        setMessages([]);
        return;
      }

      const raw = snap.val();
      const loaded: Message[] = [];

      Object.entries(raw).forEach(([k, v]) => {
        const item = v as Message;
        // Filter out if marked deleted for current user
        if (item.deletedFor && item.deletedFor[currentUser.uid]) {
          return;
        }

        loaded.push({
          ...item,
          key: k,
        });

        // Mark incoming messages as delivered and seen
        if (item.receiverId === currentUser.uid) {
          // Play incoming sound and notification if newly arrived and not sounded
          const msgCreated = item.createdAt || 0;
          if (msgCreated >= appStartTimeRef.current - 2000 && !soundedKeysRef.current.has(k)) {
            soundedKeysRef.current.add(k);
            playIncomingMessageSound();
            if (document.hidden) {
              showBrowserNotification(`📩 ${activePeer.name}`, item.text);
            }
          }

          if (!item.seenAt) {
            update(ref(db, `messages/${convId}/${k}`), {
              deliveredAt: item.deliveredAt || serverTimestamp(),
              seenAt: serverTimestamp(),
            }).catch(() => {});
          }
        }
      });

      loaded.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setMessages(loaded);
    });

    return () => {
      unsubPres();
      unsubPeerUser();
      unsubMessages();
    };
  }, [currentUser, activePeer?.uid]);

  // 4b. Global Incoming Message Notifications & Sound for currentUser
  useEffect(() => {
    if (!currentUser) return;

    const notifRef = ref(db, `notifications/${currentUser.uid}`);
    const unsub = onChildAdded(notifRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const notifKey = snapshot.key || `${data.senderId}-${data.timestamp}`;
      const msgTime = Number(data.timestamp || 0);

      if (msgTime >= appStartTimeRef.current - 2000) {
        if (!soundedKeysRef.current.has(notifKey)) {
          soundedKeysRef.current.add(notifKey);

          // 1. Play incoming melodic sound & mobile vibration
          playIncomingMessageSound();

          // 2. Browser push notification
          showBrowserNotification(
            `📩 ${data.senderName || 'নতুন মেসেজ'}`,
            data.text || 'একটি নতুন মেসেজ এসেছে',
            () => {
              handleSelectChat({
                uid: data.senderId,
                name: data.senderName,
                chatId: data.senderChatId || '',
                photo: data.senderPhoto,
              });
            }
          );

          // 3. In-App visual banner if not in active conversation with this user
          if (activePeer?.uid !== data.senderId) {
            setIncomingToast({
              id: notifKey,
              senderId: data.senderId,
              senderName: data.senderName || 'ইউজার',
              senderPhoto: data.senderPhoto,
              text: data.text || '',
            });
            setTimeout(() => {
              setIncomingToast((curr) => (curr?.id === notifKey ? null : curr));
            }, 6000);
          }
        }
      }

      // Cleanup consumed notification from database
      remove(ref(db, `notifications/${currentUser.uid}/${snapshot.key}`)).catch(() => {});
    });

    return () => unsub();
  }, [currentUser, activePeer?.uid]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 5. Send Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser || !activePeer) return;

    const trimmed = inputText.trim();
    if (!trimmed) return;

    setInputText('');
    setIsSending(true);

    try {
      const convId = getConversationId(currentUser.uid, activePeer.uid);
      const newMsgRef = push(ref(db, `messages/${convId}`));

      const msgPayload: Omit<Message, 'key'> = {
        senderId: currentUser.uid,
        receiverId: activePeer.uid,
        text: trimmed,
        deliveredAt: null,
        seenAt: null,
        deletedFor: {},
        createdAt: Date.now(),
      };

      await set(newMsgRef, {
        ...msgPayload,
        createdAt: serverTimestamp(),
      });
      playMessageSentSound();

      // Update recent chats summaries
      const now = Date.now();
      await update(ref(db, `userChats/${currentUser.uid}/${activePeer.uid}`), {
        uid: activePeer.uid,
        name: activePeer.name,
        chatId: activePeer.chatId,
        lastMessage: trimmed,
        lastSenderId: currentUser.uid,
        updatedAt: now,
      });

      await update(ref(db, `userChats/${activePeer.uid}/${currentUser.uid}`), {
        uid: currentUser.uid,
        name: currentUser.name,
        chatId: currentUser.chatId,
        lastMessage: trimmed,
        lastSenderId: currentUser.uid,
        updatedAt: now,
      });

      // Send instant notification event to receiver
      const notifEventRef = push(ref(db, `notifications/${activePeer.uid}`));
      await set(notifEventRef, {
        senderId: currentUser.uid,
        senderName: currentUser.name,
        senderChatId: currentUser.chatId,
        senderPhoto: currentUser.photo || null,
        text: trimmed,
        timestamp: now,
      });
    } catch {
      showToast('Failed to send message');
      setInputText(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  // 6. Message Options
  const handleDeleteForMe = async (key: string) => {
    if (!currentUser || !activePeer) return;
    const convId = getConversationId(currentUser.uid, activePeer.uid);
    try {
      await update(ref(db, `messages/${convId}/${key}/deletedFor`), {
        [currentUser.uid]: true,
      });
      showToast('Message removed for you');
    } catch {
      showToast('Could not delete message');
    }
  };

  const handleDeleteForEveryone = async (key: string) => {
    if (!currentUser || !activePeer) return;
    const convId = getConversationId(currentUser.uid, activePeer.uid);
    try {
      await remove(ref(db, `messages/${convId}/${key}`));
      showToast('Message deleted for everyone');
    } catch {
      showToast('Could not delete message');
    }
  };

  const handleDeleteChatHistory = async (peerUid: string) => {
    if (!currentUser) return;
    const convId = getConversationId(currentUser.uid, peerUid);
    try {
      await remove(ref(db, `messages/${convId}`));
      await remove(ref(db, `userChats/${currentUser.uid}/${peerUid}`));
      if (activePeer?.uid === peerUid) {
        setActivePeer(null);
        setIsMobileChatOpen(false);
      }
      showToast('Chat history deleted');
    } catch {
      showToast('Could not delete chat history');
    }
  };

  // 7. WebRTC Audio & Video Calling
  const startCall = async (video: boolean) => {
    if (!currentUser || !activePeer) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current && video) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const callId = `${currentUser.uid}_${activePeer.uid}_${Date.now()}`;
      currentCallIdRef.current = callId;
      const callRef = ref(db, `calls/${callId}`);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          push(ref(db, `calls/${callId}/offerCandidates`), event.candidate.toJSON());
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      await set(callRef, {
        caller: currentUser.uid,
        callee: activePeer.uid,
        video,
        offer: {
          type: offer.type,
          sdp: offer.sdp,
        },
        createdAt: serverTimestamp(),
      });

      // Listen for Answer
      onValue(callRef, async (snap) => {
        const data = snap.val();
        if (data?.answer && !pc.currentRemoteDescription) {
          const rtcDesc = new RTCSessionDescription(data.answer);
          await pc.setRemoteDescription(rtcDesc);
        }
      });

      // Listen for Answer ICE Candidates
      const answerCandidatesRef = ref(db, `calls/${callId}/answerCandidates`);
      onValue(answerCandidatesRef, (snap) => {
        if (snap.exists()) {
          Object.values(snap.val()).forEach((cand) => {
            pc.addIceCandidate(new RTCIceCandidate(cand as RTCIceCandidateInit)).catch(() => {});
          });
        }
      });

      setCallIsVideo(video);
      setCallActive(true);
    } catch {
      showToast('Could not access camera or microphone');
      endCall();
    }
  };

  const acceptIncomingCall = async () => {
    if (!currentUser || !incomingCall) return;
    const callData = incomingCall.data;
    const callId = incomingCall.id;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: !!callData.video,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current && callData.video) {
        localVideoRef.current.srcObject = stream;
      }

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      currentCallIdRef.current = callId;
      const callRef = ref(db, `calls/${callId}`);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          push(ref(db, `calls/${callId}/answerCandidates`), event.candidate.toJSON());
        }
      };

      if (callData.offer) {
        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        await update(callRef, {
          answer: {
            type: answer.type,
            sdp: answer.sdp,
          },
        });
      }

      // Listen for Offer ICE Candidates
      const offerCandidatesRef = ref(db, `calls/${callId}/offerCandidates`);
      onValue(offerCandidatesRef, (snap) => {
        if (snap.exists()) {
          Object.values(snap.val()).forEach((cand) => {
            pc.addIceCandidate(new RTCIceCandidate(cand as RTCIceCandidateInit)).catch(() => {});
          });
        }
      });

      if (incomingCall.callerUser) {
        setActivePeer(incomingCall.callerUser);
      }

      setCallIsVideo(!!callData.video);
      setCallActive(true);
      setIncomingCall(null);
    } catch {
      showToast('Could not accept call');
      declineIncomingCall();
    }
  };

  const declineIncomingCall = () => {
    if (incomingCall) {
      remove(ref(db, `calls/${incomingCall.id}`)).catch(() => {});
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    if (currentCallIdRef.current) {
      remove(ref(db, `calls/${currentCallIdRef.current}`)).catch(() => {});
      currentCallIdRef.current = null;
    }

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    setCallActive(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  // 8. Logout
  const handleLogout = () => {
    if (currentUser) {
      set(ref(db, `presence/${currentUser.uid}`), {
        online: false,
        lastSeen: serverTimestamp(),
      }).catch(() => {});
    }
    localStorage.removeItem(SESSION_KEY);
    setCurrentUser(null);
    setActivePeer(null);
    showToast('Logged out');
  };

  // Loading Screen
  if (isSessionLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#090d16] text-slate-300">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-500 flex items-center justify-center text-white font-black text-2xl font-display shadow-xl shadow-indigo-600/30 animate-pulse mb-4">
          N
        </div>
        <p className="text-sm font-semibold tracking-wider text-slate-400">
          Connecting to NiL dArK NeT...
        </p>
      </div>
    );
  }

  // If Not Logged In, Render Stylish Auth Screen
  if (!currentUser) {
    return (
      <AuthModal
        onSuccess={(user) => {
          setCurrentUser(user);
          showToast(`Welcome, ${user.name}!`);
        }}
      />
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#090d16] text-slate-100 font-sans">
      {/* Browser Notification Permission Banner */}
      <NotificationPermissionBanner
        onPermissionGranted={() => showToast('ব্রাউজার নোটিফিকেশন সক্রিয় হয়েছে!')}
      />

      {/* Incoming Message Notification Toast Banner */}
      <IncomingMessageToast
        toast={incomingToast}
        onOpenChat={(senderId) => handleSelectChat({ uid: senderId })}
        onClose={() => setIncomingToast(null)}
      />

      {/* In-app Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 border border-slate-700/80 text-white text-xs font-semibold shadow-2xl flex items-center gap-2 backdrop-blur-md"
          >
            <CheckCircle2 size={15} className="text-emerald-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl mx-auto h-full flex w-full overflow-hidden shadow-2xl min-h-0">
        {/* Sidebar Component */}
        <Sidebar
          currentUser={currentUser}
          recentChats={recentChats}
          activePeer={activePeer}
          onSelectChat={handleSelectChat}
          onViewProfile={(peer) => {
            setActivePeer(peer);
            setShowPeerProfileModal(true);
          }}
          onDeleteChatHistory={handleDeleteChatHistory}
          onUpdateUser={(updated) =>
            setCurrentUser((prev) => (prev ? { ...prev, ...updated } : prev))
          }
          onOpenVerifyModal={() => setShowVerifyModal(true)}
          onLogout={handleLogout}
          showToast={showToast}
          isMobileChatOpen={isMobileChatOpen}
        />

        {/* Chat Stage */}
        <main
          className={`flex-1 flex flex-col h-full bg-[#0b0f19] relative min-w-0 ${
            !isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activePeer ? (
            <>
              {/* Active Chat Header */}
              <header className="h-[74px] px-4 sm:px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setIsMobileChatOpen(false)}
                    className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <ChevronLeft size={22} />
                  </button>

                  {/* Clickable Profile Avatar */}
                  <button
                    onClick={() => setShowPeerProfileModal(true)}
                    className="relative group cursor-pointer focus:outline-none transition-transform hover:scale-105 active:scale-95"
                    title={`${activePeer.name} এর প্রোফাইল দেখুন (Click to view Profile)`}
                  >
                    <UserAvatar
                      name={activePeer.name}
                      photo={activePeer.photo}
                      size="md"
                      online={peerPresence.online && !activePeer.hideOnlineStatus}
                      showOnlineStatus={true}
                    />
                    <div className="absolute inset-0 rounded-2xl bg-indigo-500/0 group-hover:bg-indigo-500/15 transition-colors pointer-events-none" />
                  </button>

                  {/* Clickable User Name & Info */}
                  <div
                    onClick={() => setShowPeerProfileModal(true)}
                    className="min-w-0 cursor-pointer group hover:opacity-90 transition-opacity"
                    title={`${activePeer.name} এর বিস্তারিত প্রোফাইল দেখুন`}
                  >
                    <div className="flex items-center gap-1.5 font-bold text-sm sm:text-base text-white truncate font-display group-hover:text-indigo-300 transition-colors">
                      <span className="truncate">{activePeer.name}</span>
                      {isUserVerifiedActive(activePeer, false) && <VerifiedBadge size="sm" />}
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-indigo-400 font-mono-code font-semibold">
                        #{activePeer.chatId}
                      </span>
                      <span className="text-slate-500">•</span>
                      <span
                        className={`font-medium ${
                          peerPresence.online && !activePeer.hideOnlineStatus
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {peerPresence.online && !activePeer.hideOnlineStatus ? 'Online' : 'Offline'}
                      </span>
                      {activePeer.bio && (
                        <>
                          <span className="text-slate-600 hidden sm:inline">•</span>
                          <span className="text-slate-400 text-[11px] truncate max-w-[120px] sm:max-w-[220px] hidden sm:inline">
                            {activePeer.bio}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Call Action & Profile Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPeerProfileModal(true)}
                    className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="প্রোফাইল ও বিস্তারিত ফাংশন দেখুন"
                  >
                    <Info size={16} className="text-indigo-400" />
                    <span className="hidden sm:inline">Profile</span>
                  </button>

                  <button
                    onClick={() => startCall(false)}
                    className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Start Audio Call"
                  >
                    <Phone size={16} className="text-emerald-400" />
                    <span className="hidden sm:inline">Audio</span>
                  </button>

                  <button
                    onClick={() => startCall(true)}
                    className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    title="Start Video Call"
                  >
                    <Video size={16} className="text-sky-400" />
                    <span className="hidden sm:inline">Video</span>
                  </button>
                </div>
              </header>

              {/* Messages Scroll Area */}
              <section className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/30 via-[#0b0f19] to-[#090d16]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                      <MessageCircle size={28} />
                    </div>
                    <h3 className="text-base font-bold text-white mb-1">
                      Say hello to {activePeer.name}!
                    </h3>
                    <p className="text-xs text-slate-400 max-w-xs">
                      This is the beginning of your private encrypted conversation. Send a message below.
                    </p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <MessageBubble
                      key={m.key}
                      message={m}
                      isMine={m.senderId === currentUser.uid}
                      peerName={activePeer.name}
                      peerPhoto={activePeer.photo}
                      onAvatarClick={() => setShowPeerProfileModal(true)}
                      onDeleteForMe={handleDeleteForMe}
                      onDeleteForEveryone={
                        m.senderId === currentUser.uid ? handleDeleteForEveryone : undefined
                      }
                      onCopyText={(text) => {
                        navigator.clipboard.writeText(text);
                        showToast('Message copied!');
                      }}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </section>

              {/* Composer */}
              <footer className="p-3 sm:p-4 border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
                <form
                  onSubmit={handleSendMessage}
                  className="flex items-center gap-2 sm:gap-3"
                >
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Write a message to ${activePeer.name}...`}
                      className="w-full px-4 py-3 sm:py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors shadow-inner"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={!inputText.trim() || isSending}
                    className="p-3 sm:px-5 sm:py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    <Send size={18} />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </footer>
            </>
          ) : (
            /* Empty Chat State */
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-xl">
                <ShieldCheck size={36} />
              </div>
              <h2 className="text-2xl font-black text-white font-display">
                NiL dArK NeT
              </h2>
              <p className="text-sm text-slate-400 max-w-sm mt-1 mb-6 leading-relaxed">
                Connect with anyone securely using a 6-digit Chat ID. Start a conversation or search for users.
              </p>
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400 flex items-center gap-2 font-mono-code">
                <span>Your Chat ID:</span>
                <strong className="text-indigo-400 text-sm tracking-wider">
                  {currentUser.chatId}
                </strong>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* WebRTC Video/Audio Call Screen */}
      <AnimatePresence>
        {callActive && activePeer && (
          <CallModal
            peer={activePeer}
            isVideo={callIsVideo}
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            onEndCall={endCall}
            isMuted={isMuted}
            onToggleMute={toggleMute}
            isVideoOff={isVideoOff}
            onToggleVideo={toggleVideo}
          />
        )}
      </AnimatePresence>

      {/* Incoming Call Ringing Alert */}
      <AnimatePresence>
        {incomingCall && incomingCall.callerUser && (
          <IncomingCallModal
            caller={incomingCall.callerUser}
            isVideo={!!incomingCall.data.video}
            onAccept={acceptIncomingCall}
            onDecline={declineIncomingCall}
          />
        )}
      </AnimatePresence>

      {/* Verified Badge Code Modal */}
      <AnimatePresence>
        {showVerifyModal && (
          <VerifyModal
            user={currentUser}
            onClose={() => setShowVerifyModal(false)}
            onVerifiedSuccess={(updates) => {
              setCurrentUser((prev) => (prev ? { ...prev, ...updates } : prev));
              showToast('Verified badge activated!');
            }}
          />
        )}
      </AnimatePresence>

      {/* Peer User Profile & Details Modal */}
      <AnimatePresence>
        {showPeerProfileModal && activePeer && (
          <UserProfileModal
            peer={activePeer}
            isOnline={peerPresence.online}
            messages={messages}
            currentUserId={currentUser.uid}
            onClose={() => setShowPeerProfileModal(false)}
            onStartAudioCall={() => startCall(false)}
            onStartVideoCall={() => startCall(true)}
            onClearChatHistory={handleDeleteChatHistory}
            showToast={showToast}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
