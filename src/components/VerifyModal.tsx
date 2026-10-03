import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ShoppingCart, KeyRound, X, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { db, ref, get, update } from '../firebase';
import { User } from '../types';

interface VerifyModalProps {
  user: User;
  onClose: () => void;
  onVerifiedSuccess: (updatedUser: Partial<User>) => void;
}

export const VerifyModal: React.FC<VerifyModalProps> = ({
  user,
  onClose,
  onVerifiedSuccess,
}) => {
  const [view, setView] = useState<'menu' | 'input'>('menu');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleActivateCode = async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setError('অনুগ্রহ করে কোডটি লিখুন / Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1-Hour Verification Code (as requested by user: ১ ঘণ্টার জন্য প্রফাইল ব্লুটিক)
      if (
        trimmed.toUpperCase() === '1HOUR' ||
        trimmed.toUpperCase() === 'VIP1H' ||
        trimmed.toUpperCase() === '1H' ||
        trimmed.toUpperCase() === 'TRIAL'
      ) {
        const expireDate = new Date(Date.now() + 60 * 60 * 1000); // exactly 1 hour from now

        const updates = {
          verified: true,
          verifyPackage: 'VIP Trial (1 Hour)',
          verifyExpireTime: expireDate.toISOString(),
          verifyActivatedAt: new Date().toISOString(),
        };

        await update(ref(db, `users/${user.uid}`), updates);
        onVerifiedSuccess(updates);
        setSuccessMsg('🎉 ১ ঘণ্টার জন্য ব্লুটিক অ্যাক্টিভ হয়েছে! (১ ঘণ্টা পর অটোমেটিক রিমুভ হবে)');
        setTimeout(() => {
          onClose();
        }, 1800);
        return;
      }

      // Special developer bypass / demo code for 30 days
      if (trimmed.toUpperCase() === 'VIP2026' || trimmed.toUpperCase() === 'NILPRO') {
        const expireDate = new Date();
        expireDate.setDate(expireDate.getDate() + 30); // 30 days

        const updates = {
          verified: true,
          verifyPackage: 'VIP Premium (30 Days)',
          verifyExpireTime: expireDate.toISOString(),
          verifyActivatedAt: new Date().toISOString(),
        };

        await update(ref(db, `users/${user.uid}`), updates);
        onVerifiedSuccess(updates);
        setSuccessMsg('🎉 Verified badge successfully activated! Package: VIP Premium (30 Days)');
        setTimeout(() => {
          onClose();
        }, 1800);
        return;
      }

      // Check verifyCodes in Firebase
      const codesSnap = await get(ref(db, 'verifyCodes'));
      let matchedKey: string | null = null;
      let matchedData: { code?: string; used?: boolean; expireTime?: string; package?: string } | null = null;

      if (codesSnap.exists()) {
        const allCodes = codesSnap.val();
        for (const [k, v] of Object.entries(allCodes)) {
          const item = v as { code?: string; used?: boolean; expireTime?: string; package?: string };
          if (item.code && item.code.trim().toLowerCase() === trimmed.toLowerCase()) {
            matchedKey = k;
            matchedData = item;
            break;
          }
        }
      }

      if (!matchedData || !matchedKey) {
        throw new Error('ভুল কোড! / Invalid verification code. Please check and try again.');
      }

      if (matchedData.used) {
        throw new Error('এই কোডটি ইতিমধ্যে ব্যবহার করা হয়েছে! / This code has already been used.');
      }

      const expireDate = matchedData.expireTime ? new Date(matchedData.expireTime) : new Date(Date.now() + 30 * 86400000);
      if (expireDate < new Date()) {
        throw new Error('কোডের মেয়াদ শেষ! / This code has expired.');
      }

      const updates = {
        verified: true,
        verifyPackage: matchedData.package || 'Official Badge',
        verifyExpireTime: expireDate.toISOString(),
        verifyActivatedAt: new Date().toISOString(),
      };

      await update(ref(db, `users/${user.uid}`), updates);
      await update(ref(db, `verifyCodes/${matchedKey}`), { used: true });

      onVerifiedSuccess(updates);
      setSuccessMsg(`✅ কোড সফলভাবে activate হয়েছে! Package: ${matchedData.package || 'Standard'}`);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Activation failed';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-slate-700/80 p-6 sm:p-7 shadow-2xl text-slate-100"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        {view === 'menu' ? (
          <div>
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-600 via-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/30">
              <ShieldCheck size={28} />
            </div>

            <h3 className="text-xl font-bold text-center text-white font-display">
              Get Verified Badge
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 text-center mt-1 mb-6">
              আপনার নামের পাশে অফিসিয়াল নীল ভেরিফাইড টিক চিহ্ন যোগ করুন।
            </p>

            <div className="space-y-3">
              <button
                onClick={() => setView('input')}
                className="w-full p-4 rounded-2xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-white font-bold text-sm flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <KeyRound size={18} />
                  </div>
                  <div className="text-left">
                    <div>Enter Verification Code</div>
                    <div className="text-xs text-slate-400 font-normal">এডমিন থেকে প্রাপ্ত কোড অ্যাক্টিভ করুন</div>
                  </div>
                </div>
                <span className="text-slate-400 group-hover:translate-x-1 transition-transform">→</span>
              </button>

              <button
                onClick={() => window.open('https://wa.me/8801852158628', '_blank')}
                className="w-full p-4 rounded-2xl bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/40 text-emerald-300 font-bold text-sm flex items-center justify-between group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                    <ShoppingCart size={18} />
                  </div>
                  <div className="text-left">
                    <div>Buy Verification Code</div>
                    <div className="text-xs text-emerald-400/80 font-normal">WhatsApp-এ সরাসরি যোগাযোগ করে কিনুন</div>
                  </div>
                </div>
                <span className="text-emerald-400 group-hover:translate-x-1 transition-transform">↗</span>
              </button>
            </div>
          </div>
        ) : (
          <div>
            <button
              onClick={() => {
                setView('menu');
                setError(null);
                setSuccessMsg(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={15} />
              <span>Back to Menu</span>
            </button>

            <h3 className="text-xl font-bold text-white font-display mb-1">
              Enter Verification Code
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              এডমিন থেকে প্রাপ্ত কোডটি নিচে পেস্ট করুন:
            </p>

            <div className="space-y-4">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="কোড লিখুন (যেমন: 1HOUR বা VIP2026)"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono-code placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
              />

              {/* Quick trial code buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs">
                <div className="text-slate-300">
                  <span className="text-indigo-400 font-bold">টেস্টিং কোড:</span> ১ ঘণ্টার ট্রায়াল বা ৩০ দিনের VIP
                </div>
                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setCode('1HOUR')}
                    className="px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold border border-sky-500/30 text-[11px] cursor-pointer transition-colors"
                  >
                    1 Hour (১ ঘণ্টা)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCode('VIP2026')}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-bold border border-indigo-500/30 text-[11px] cursor-pointer transition-colors"
                  >
                    30 Days VIP
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2"
                  >
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2"
                  >
                    <CheckCircle2 size={16} className="shrink-0" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleActivateCode}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>Activate Badge</span>
                )}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
