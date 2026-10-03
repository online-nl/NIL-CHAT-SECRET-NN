import React, { useState } from 'react';
import { KeyRound, Lock, Eye, EyeOff, Check, X, ShieldAlert } from 'lucide-react';
import { motion } from 'motion/react';
import { db, ref, update, hashPin } from '../firebase';
import { User } from '../types';

interface ChangePinModalProps {
  user: User;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const ChangePinModal: React.FC<ChangePinModalProps> = ({
  user,
  onClose,
  showToast,
}) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (currentPin.length !== 4 || !/^\d{4}$/.test(currentPin)) {
      setError('বর্তমান ৪-সংখ্যার পিন প্রদান করুন');
      return;
    }

    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setError('নতুন পিন অবশ্যই ঠিক ৪ সংখ্যার হতে হবে');
      return;
    }

    if (newPin !== confirmPin) {
      setError('নতুন পিন এবং নিশ্চিতকরণ পিন মিলছে না');
      return;
    }

    if (newPin === currentPin) {
      setError('নতুন পিন বর্তমান পিন থেকে আলাদা হতে হবে');
      return;
    }

    setIsUpdating(true);
    try {
      // Check current pin hash
      const currentHashed = await hashPin(currentPin);
      if (user.pinHash && user.pinHash !== currentHashed) {
        setError('বর্তমান পিন কোড ভুল হয়েছে / Current PIN is incorrect');
        setIsUpdating(false);
        return;
      }

      const newHashed = await hashPin(newPin);
      await update(ref(db, `users/${user.uid}`), {
        pinHash: newHashed,
      });

      showToast('সিকিউরিটি পিন সফলভাবে পরিবর্তন হয়েছে! / PIN Changed');
      onClose();
    } catch {
      setError('পিন পরিবর্তন ব্যর্থ হয়েছে, পুনরায় চেষ্টা করুন');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <KeyRound size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Change Security PIN
            </h3>
            <p className="text-xs text-slate-400">৪-সংখ্যার গোপন পিন পরিবর্তন করুন</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <ShieldAlert size={16} className="shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Current 4-digit PIN / বর্তমান পিন
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                maxLength={4}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-center font-mono-code tracking-[0.5em] text-base focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              New 4-digit PIN / নতুন পিন
            </label>
            <input
              type={showPin ? 'text' : 'password'}
              maxLength={4}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-center font-mono-code tracking-[0.5em] text-base focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirm New PIN / নতুন পিন নিশ্চিত করুন
            </label>
            <input
              type={showPin ? 'text' : 'password'}
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-center font-mono-code tracking-[0.5em] text-base focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowPin(!showPin)}
            className="text-xs text-slate-400 hover:text-indigo-400 flex items-center gap-1.5 cursor-pointer pt-1"
          >
            {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showPin ? 'Hide digits' : 'Show digits'}</span>
          </button>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isUpdating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={16} />
                <span>Update Security PIN</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
