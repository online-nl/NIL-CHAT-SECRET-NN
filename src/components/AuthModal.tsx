import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, KeyRound, User as UserIcon, Sparkles, Copy, Check, ArrowRight, Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { createUniqueChatId, hashPin, set, ref, get, db, SESSION_KEY, generateUid } from '../firebase';
import { User } from '../types';

interface AuthModalProps {
  onSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onSuccess }) => {
  const [tab, setTab] = useState<'register' | 'login'>('register');
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [loginId, setLoginId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showLoginPin, setShowLoginPin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Success celebration state
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Trigger celebration confetti
  const triggerConfetti = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#6366f1', '#8b5cf6', '#38bdf8', '#a855f7']
    });
  };

  // Registration handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    const trimmedPin = pin.trim();

    if (trimmedName.length < 2) {
      setError('অনুগ্রহ করে সঠিক নাম লিখুন (কমপক্ষে ২ অক্ষর) / Enter a valid name');
      return;
    }

    if (!/^\d{4,6}$/.test(trimmedPin)) {
      setError('PIN অবশ্যই ৪ থেকে ৬ সংখ্যার হতে হবে / PIN must be 4 to 6 digits');
      return;
    }

    setIsLoading(true);

    try {
      const uid = generateUid();
      const chatId = await createUniqueChatId(uid);
      const pinH = await hashPin(trimmedPin);

      const newUser: User = {
        uid,
        chatId,
        name: trimmedName,
        pinHash: pinH,
        verified: false,
        photo: '',
        createdAt: Date.now()
      };

      await set(ref(db, `users/${uid}`), {
        ...newUser,
        createdAt: { '.sv': 'timestamp' }
      });

      localStorage.setItem(SESSION_KEY, uid);
      setRegisteredUser(newUser);
      triggerConfetti();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedId = loginId.trim();
    const trimmedPin = loginPin.trim();

    if (!/^\d{6}$/.test(trimmedId)) {
      setError('সঠিক ৬-সংখ্যার Chat ID দিন / Enter a valid 6-digit Chat ID');
      return;
    }

    if (!/^\d{4,6}$/.test(trimmedPin)) {
      setError('সঠিক PIN লিখুন / Enter your 4-6 digit PIN');
      return;
    }

    setIsLoading(true);

    try {
      const idSnap = await get(ref(db, `chatIds/${trimmedId}`));
      const uid = idSnap.val();

      if (!uid) {
        throw new Error('Chat ID পাওয়া যায়নি / Chat ID not found');
      }

      const userSnap = await get(ref(db, `users/${uid}`));
      const u = userSnap.val();

      if (!u) {
        throw new Error('User profile পাওয়া যায়নি / User profile not found');
      }

      const testHash = await hashPin(trimmedPin);
      if (testHash !== u.pinHash) {
        throw new Error('ভুল PIN দিয়েছেন / Incorrect PIN entered');
      }

      const loggedInUser: User = {
        uid: u.uid,
        chatId: u.chatId,
        name: u.name,
        verified: !!u.verified,
        photo: u.photo || '',
        verifyPackage: u.verifyPackage,
        verifyExpireTime: u.verifyExpireTime
      };

      localStorage.setItem(SESSION_KEY, uid);
      onSuccess(loggedInUser);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Please check credentials.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const copyRegisteredId = () => {
    if (!registeredUser) return;
    navigator.clipboard.writeText(registeredUser.chatId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden bg-[#090d16]">
      {/* Dynamic Animated Ambient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.3, 0.15],
            x: [0, 40, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-indigo-600/30 blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.35, 0.2],
            x: [0, -40, 0],
            y: [0, 40, 0]
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-violet-600/30 blur-[130px]"
        />
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25" />
      </div>

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Registration Success Celebration Modal */}
        {registeredUser ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl bg-slate-900/90 backdrop-blur-2xl border border-slate-700/60 p-7 sm:p-8 shadow-2xl shadow-indigo-950/60 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
              <Sparkles size={32} />
            </div>

            <h2 className="text-2xl font-black text-white font-display tracking-tight">
              Registration Successful!
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।
            </p>

            {/* Generated Chat ID Box */}
            <div className="my-6 p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/30 shadow-inner">
              <div className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-1">
                Your Unique 6-Digit Chat ID
              </div>
              <div className="text-4xl sm:text-5xl font-extrabold text-white font-mono-code tracking-[0.25em] my-2 select-all">
                {registeredUser.chatId}
              </div>
              <p className="text-[11px] text-amber-300/90 font-medium">
                ⚠️ এই Chat ID এবং আপনার PIN সংরক্ষণ করে রাখুন। অন্য কেউ এটি জানতে পারবে না।
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={copyRegisteredId}
                className="w-full py-3.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copiedId ? (
                  <>
                    <Check size={18} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy size={18} className="text-indigo-400" />
                    <span>Copy 6-Digit Chat ID</span>
                  </>
                )}
              </button>

              <button
                onClick={() => onSuccess(registeredUser)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-transform active:scale-[0.98] cursor-pointer"
              >
                <span>Enter Messenger</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="rounded-3xl bg-slate-900/85 backdrop-blur-2xl border border-slate-800/80 p-6 sm:p-8 shadow-2xl shadow-black/50">
            {/* Header / Brand */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-sky-500 text-white shadow-xl shadow-indigo-500/25 mb-3">
                <span className="text-2xl font-black font-display">N</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white font-display tracking-tight flex items-center justify-center gap-2">
                NiL dArK NeT
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 font-sans">
                Fast, encrypted messenger with 6-digit P2P Chat IDs
              </p>
            </div>

            {/* Stylish Sliding Pill Tabs */}
            <div className="relative flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800 mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab('register');
                  setError(null);
                }}
                className={`relative z-10 flex-1 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  tab === 'register' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Registration
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setError(null);
                }}
                className={`relative z-10 flex-1 py-2.5 text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                  tab === 'login' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Login
              </button>

              {/* Animated Tab Background Indicator */}
              <motion.div
                layoutId="auth-tab-indicator"
                transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                className="absolute inset-1 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-indigo-950"
                style={{
                  width: 'calc(50% - 4px)',
                  left: tab === 'register' ? '4px' : 'calc(50%)'
                }}
              />
            </div>

            {/* Error Alert */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -6, height: 0 }}
                  className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5"
                >
                  <AlertCircle size={16} className="shrink-0 text-rose-400" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration Form */}
            {tab === 'register' && (
              <motion.form
                key="register-form"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRegister}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>আপনার নাম / Your Name</span>
                    <span className="text-[10px] text-slate-500">{name.length}/40</span>
                  </label>
                  <div className="relative">
                    <UserIcon
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      maxLength={40}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sabbir Hossain"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>PIN (৪-৬ সংখ্যার সিক্রেট কোড)</span>
                    <span className="text-[10px] text-indigo-400 font-mono-code">4-6 digits</span>
                  </label>
                  <div className="relative">
                    <KeyRound
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={6}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g. 1234"
                      required
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white font-mono-code placeholder-slate-500 text-sm tracking-wider focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-200/90 leading-relaxed flex items-start gap-2">
                  <Shield size={15} className="text-indigo-400 shrink-0 mt-0.5" />
                  <span>
                    রেজিস্ট্রেশন শেষে আপনার জন্য স্বয়ংক্রিয়ভাবে একটি গোপন <strong>6-digit Chat ID</strong> তৈরি হবে। এটি লগইন করতে লাগবে।
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Create Account</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </motion.form>
            )}

            {/* Login Form */}
            {tab === 'login' && (
              <motion.form
                key="login-form"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleLogin}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    ৬-সংখ্যার Chat ID / 6-Digit Chat ID
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono-code font-bold text-sm">
                      #
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={loginId}
                      onChange={(e) => setLoginId(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      required
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white font-mono-code text-base tracking-[0.2em] placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    PIN (৪-৬ ডিজিট)
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type={showLoginPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={6}
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="••••"
                      required
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white font-mono-code placeholder-slate-500 text-sm tracking-wider focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPin(!showLoginPin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showLoginPin ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Login to Network</span>
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
