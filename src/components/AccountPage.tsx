import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Save,
  LogOut,
  ShieldCheck,
  Clock,
  Check,
  Trash2,
  Copy,
  Volume2,
  VolumeX,
  EyeOff,
  Eye,
  KeyRound,
  Sparkles,
  Info,
  Smile,
  Bell,
  Smartphone,
  Download,
} from 'lucide-react';
import { db, ref, update } from '../firebase';
import { User } from '../types';
import { VerifiedBadge } from './VerifiedBadge';
import { ChangePinModal } from './ChangePinModal';
import { PWAInstallButton } from './PWAInstallButton';
import { isSoundEnabled, setSoundEnabled, playNotificationChime } from '../utils/sound';
import { isUserVerifiedActive } from '../utils/verification';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/notifications';

interface AccountPageProps {
  user: User;
  onUpdateUser: (updated: Partial<User>) => void;
  onOpenVerifyModal: () => void;
  onLogout: () => void;
  showToast: (msg: string) => void;
}

const BIO_PRESETS = [
  '🟢 Active & Available',
  '🌙 Stealth / Private',
  '💻 Coding / Busy',
  '⚡ NiL Dark VIP',
  '🎧 Listening to Music',
];

export const AccountPage: React.FC<AccountPageProps> = ({
  user,
  onUpdateUser,
  onOpenVerifyModal,
  onLogout,
  showToast,
}) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [photoPreview, setPhotoPreview] = useState<string | null>(user.photo || null);
  const [hideOnline, setHideOnline] = useState(!!user.hideOnlineStatus);
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [isSaving, setIsSaving] = useState(false);
  const [countdownText, setCountdownText] = useState<string>('');
  const [copiedId, setCopiedId] = useState(false);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    getNotificationPermission()
  );

  // Modal states (crop option removed)
  const [showPinModal, setShowPinModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEnableNotification = async () => {
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      showToast('ব্রাউজার নোটিফিকেশন চালু হয়েছে! মেসেজ আসলে অ্যালার্ট পাবেন।');
      playNotificationChime();
    } else if (perm === 'denied') {
      showToast('ব্রাউজার সেটিংসে গিয়ে Notification Allow করুন');
    }
  };

  useEffect(() => {
    setName(user.name);
    setBio(user.bio || '');
    setPhotoPreview(user.photo || null);
    setHideOnline(!!user.hideOnlineStatus);
  }, [user]);

  // Live countdown timer for verified badge & automatic removal when 1 hour or duration expires
  useEffect(() => {
    if (!user.verified || !user.verifyExpireTime) {
      setCountdownText('');
      return;
    }

    const checkAndTick = () => {
      const now = new Date().getTime();
      const expire = new Date(user.verifyExpireTime!).getTime();
      const diff = expire - now;

      if (diff <= 0 || isNaN(diff)) {
        setCountdownText('Verification expired');
        update(ref(db, `users/${user.uid}`), {
          verified: false,
          verifyPackage: null,
          verifyExpireTime: null,
        }).catch(() => {});
        onUpdateUser({ verified: false, verifyPackage: undefined, verifyExpireTime: undefined });
        return true;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      let text = '';
      if (days > 0) text += `${days}d `;
      text += `${hours}h ${minutes}m ${seconds}s`;
      setCountdownText(text);
      return false;
    };

    if (checkAndTick()) return;

    const interval = setInterval(() => {
      if (checkAndTick()) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [user.verified, user.verifyExpireTime, user.uid, onUpdateUser]);

  // Direct photo select handler -> No cropping required, directly saves photo!
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('শুধুমাত্র ছবি ফাইল নির্বাচন করুন / Images only');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('ছবির সাইজ ১০MB-এর কম হতে হবে / Photo must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      if (!src) return;

      const img = new Image();
      img.onload = async () => {
        try {
          // Auto optimize image into an avatar square (400x400) without cropping modal
          const canvas = document.createElement('canvas');
          const minDim = Math.min(img.width, img.height);
          canvas.width = 400;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 400, 400);
            const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.88);

            setPhotoPreview(optimizedDataUrl);
            await update(ref(db, `users/${user.uid}`), {
              photo: optimizedDataUrl,
            });
            onUpdateUser({ photo: optimizedDataUrl });
            showToast('প্রোফাইল ছবি সফলভাবে আপডেট হয়েছে!');
          }
        } catch {
          setPhotoPreview(src);
          showToast('ছবি নির্বাচন হয়েছে। সেভ করতে Save Profile চাপুন।');
        }
      };
      img.src = src;
    };
    reader.readAsDataURL(file);

    // Reset input value
    e.target.value = '';
  };

  // Remove profile photo
  const handleRemovePhoto = async () => {
    if (!photoPreview) return;
    setPhotoPreview(null);
    try {
      await update(ref(db, `users/${user.uid}`), {
        photo: '',
      });
      onUpdateUser({ photo: '' });
      showToast('প্রোফাইল ছবি সরানো হয়েছে / Photo removed');
    } catch {
      showToast('Photo removed locally. Click Save.');
    }
  };

  // Toggle online privacy status
  const handleToggleHideOnline = async () => {
    const nextVal = !hideOnline;
    setHideOnline(nextVal);
    try {
      await update(ref(db, `users/${user.uid}`), {
        hideOnlineStatus: nextVal,
      });
      onUpdateUser({ hideOnlineStatus: nextVal });
      showToast(
        nextVal
          ? 'স্টেলথ মোড চালু: অনলাইন স্ট্যাটাস লুকানো থাকবে'
          : 'অনলাইন স্ট্যাটাস এখন দৃশ্যমান'
      );
    } catch {
      showToast('Setting updated');
    }
  };

  // Toggle message audio chime
  const handleToggleSound = () => {
    const nextVal = !soundOn;
    setSoundOn(nextVal);
    setSoundEnabled(nextVal);
    if (nextVal) {
      playNotificationChime();
      showToast('সাউন্ড নোটিফিকেশন চালু (Sound Enabled)');
    } else {
      showToast('সাউন্ড নোটিফিকেশন বন্ধ (Muted)');
    }
  };

  // Copy chat ID
  const handleCopyChatId = () => {
    navigator.clipboard.writeText(user.chatId);
    setCopiedId(true);
    showToast(`Chat ID (${user.chatId}) কপি হয়েছে!`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Save full profile
  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      showToast('সঠিক নাম দিন (কমপক্ষে ২ অক্ষর)');
      return;
    }

    setIsSaving(true);
    try {
      const updates = {
        name: trimmed,
        bio: bio.trim(),
        photo: photoPreview || '',
        hideOnlineStatus: hideOnline,
      };

      await update(ref(db, `users/${user.uid}`), updates);
      onUpdateUser(updates);
      showToast('প্রোফাইল সফলভাবে আপডেট করা হয়েছে! / Profile Saved');
    } catch {
      showToast('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
      {/* 1. Profile Picture Card with Facebook-like Cropping */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center">
          {/* Avatar frame */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-indigo-600/30 border-4 border-slate-800 ring-2 ring-indigo-500/40 transition-transform group-hover:scale-[1.02]">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{(user.name || 'U').charAt(0).toUpperCase()}</span>
              )}
            </div>

            {/* Quick Camera Picker Icon */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl transition-transform active:scale-95 border-2 border-slate-900 cursor-pointer"
              title="নতুন ছবি আপলোড ও ক্রপ করুন"
            >
              <Camera size={16} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* User Name & Badges */}
          <div className="mt-3.5 flex items-center justify-center gap-1.5">
            <h3 className="text-xl font-bold text-white font-display tracking-tight">
              {user.name}
            </h3>
            {user.verified && <VerifiedBadge size="sm" />}
          </div>

          {/* Chat ID with 1-click copy */}
          <button
            onClick={handleCopyChatId}
            className="mt-1.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-xs text-indigo-400 font-mono-code font-bold cursor-pointer transition-colors"
            title="Click to copy Chat ID"
          >
            <span>ID: {user.chatId}</span>
            {copiedId ? (
              <Check size={13} className="text-emerald-400" />
            ) : (
              <Copy size={13} className="text-slate-400" />
            )}
          </button>

          {/* Profile Photo Action Buttons: Upload New, Remove */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="py-1.5 px-3.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera size={13} />
              <span>ছবি পরিবর্তন / Upload</span>
            </button>

            {photoPreview && (
              <button
                onClick={handleRemovePhoto}
                className="py-1.5 px-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="ছবি মুছুন"
              >
                <Trash2 size={13} />
                <span>Remove</span>
              </button>
            )}
          </div>
        </div>

        {/* Display Name Field */}
        <div className="mt-6 space-y-2">
          <label className="block text-xs font-bold text-slate-300">
            Display Name / আপনার নাম
          </label>
          <input
            type="text"
            maxLength={40}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার নাম লিখুন..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Custom Bio / Status Message Field */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Smile size={14} className="text-indigo-400" />
              <span>About / Bio Status (বায়ো ও স্ট্যাটাস)</span>
            </label>
            <span className="text-[11px] font-mono-code text-slate-500">
              {bio.length}/80
            </span>
          </div>

          <input
            type="text"
            maxLength={80}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="e.g. 🟢 Active, Coding, Available on NiL dArK NeT..."
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
          />

          {/* Quick Bio Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {BIO_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setBio(preset)}
                className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                  bio === preset
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Save Profile Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 active:scale-[0.99]"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Save size={16} />
              <span>Save Profile Changes</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Professional Settings & Privacy Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
        <h4 className="text-sm font-bold text-white font-display flex items-center gap-2">
          <Sparkles size={16} className="text-indigo-400" />
          <span>Professional Preferences & Privacy</span>
        </h4>

        {/* Hide Online Status (Stealth Mode) */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              {hideOnline ? <EyeOff size={18} /> : <Eye size={18} />}
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Stealth Mode / অনলাইন স্ট্যাটাস লুকান
              </div>
              <div className="text-[11px] text-slate-400">
                {hideOnline ? 'অনলাইন গোপন রাখা হয়েছে' : 'অন্য ব্যবহারকারীরা অনলাইন দেখতে পাবে'}
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleHideOnline}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              hideOnline ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                hideOnline ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Message Sound Notification */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Notification Sounds / মেসেজ সাউন্ড
              </div>
              <div className="text-[11px] text-slate-400">
                {soundOn ? 'সাউন্ড এফেক্ট সক্রিয়' : 'নিঃশব্দ (Mute)'}
              </div>
            </div>
          </div>

          <button
            onClick={handleToggleSound}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              soundOn ? 'bg-indigo-600' : 'bg-slate-800'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                soundOn ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Web Push Notification */}
        {isNotificationSupported() && (
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
                <Bell size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white">
                  Push Notifications / পুশ নোটিফিকেশন
                </div>
                <div className="text-[11px] text-slate-400">
                  {notifPermission === 'granted'
                    ? 'অনুমতি দেওয়া আছে (সক্রিয়)'
                    : notifPermission === 'denied'
                    ? 'ব্লক করা আছে (Allow প্রয়োজন)'
                    : 'অনুমতি প্রয়োজন'}
                </div>
              </div>
            </div>

            {notifPermission === 'granted' ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                <Check size={13} /> Active
              </span>
            ) : (
              <button
                onClick={handleEnableNotification}
                className="py-1.5 px-3 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-bold text-indigo-200 transition-colors cursor-pointer"
              >
                অনুমতি দিন
              </button>
            )}
          </div>
        )}

        {/* Security: Change PIN */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400">
              <KeyRound size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                Security PIN Code / পিন কোড
              </div>
              <div className="text-[11px] text-slate-400">
                লগইন ও অ্যাকাউন্টের গোপনীয়তা রক্ষা করুন
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowPinModal(true)}
            className="py-1.5 px-3 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-indigo-300 transition-colors cursor-pointer"
          >
            Change PIN
          </button>
        </div>
      </div>

      {/* APK / App Installation Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-indigo-500/30 p-6 shadow-xl relative overflow-hidden">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <Smartphone size={22} />
          </div>
          <div>
            <h4 className="text-base font-bold text-white font-display">Install APK / Mobile App</h4>
            <p className="text-xs text-slate-400">ফোনে ফুলস্ক্রিন অ্যাপ হিসেবে ইনস্টল করুন</p>
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          NiL dArK NeT-কে সরাসরি আপনার মোবাইল বা ট্যাবলেটে ইনস্টল করে ফুলস্ক্রিনে ব্যবহার করুন। নতুন মেসেজ আসলে স্বয়ংক্রিয় সাউন্ড ও নোটিফিকেশন পাবেন।
        </p>

        <PWAInstallButton variant="full" />
      </div>

      {/* 3. Verification Badge Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-blue-500/20 text-sky-400">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4 className="text-base font-bold text-white font-display">Verified Badge</h4>
            <p className="text-xs text-slate-400">অফিসিয়াল ব্লু ভেরিফাইড টিক চিহ্ন</p>
          </div>
        </div>

        {user.verified ? (
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-sky-300 text-xs flex items-center gap-2">
              <Check size={16} className="text-sky-400 shrink-0" />
              <span>
                আপনার অ্যাকাউন্ট <strong>Verified</strong> সক্রিয় আছে ({user.verifyPackage || 'VIP'}).
              </span>
            </div>

            {countdownText && (
              <div className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 text-xs text-slate-300 flex items-center gap-2 font-mono-code">
                <Clock size={15} className="text-indigo-400 shrink-0" />
                <span>
                  ⏳ Time Remaining: <strong className="text-indigo-300">{countdownText}</strong>
                </span>
              </div>
            )}
          </div>
        ) : (
          <div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              আপনার নামের পাশে নীল ভেরিফাইড টিক চিহ্ন যোগ করে আপনার প্রোফাইলকে আরও প্রফেশনাল ও নিরাপদ করুন।
            </p>
            <button
              onClick={onOpenVerifyModal}
              className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-sky-300 border border-sky-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>Get Verified Badge</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Logout Action */}
      <button
        onClick={onLogout}
        className="w-full py-3.5 px-4 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
      >
        <LogOut size={17} />
        <span>Log Out of Session</span>
      </button>

      {/* Change PIN Modal */}
      {showPinModal && (
        <ChangePinModal
          user={user}
          onClose={() => setShowPinModal(false)}
          showToast={showToast}
        />
      )}
    </div>
  );
};
