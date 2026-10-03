import React from 'react';
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share,
  MoreVertical,
  Bell,
  Zap,
  ShieldCheck,
  ExternalLink,
  Package,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const appUrl = 'https://ais-pre-ylxwe6i6sb5i6l3s3kkkzs-696093417207.asia-east1.run.app';
  const pwaBuilderUrl = `https://www.pwabuilder.com/?site=${encodeURIComponent(appUrl)}`;

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    const success = await install();
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 shadow-2xl text-slate-100 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-sky-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Header with App Icon */}
        <div className="flex items-center gap-3.5 mb-5 pb-4 border-b border-slate-800 shrink-0">
          <div className="relative w-14 h-14 rounded-2xl p-0.5 bg-gradient-to-tr from-indigo-500 to-sky-400 shrink-0 shadow-lg shadow-indigo-500/25">
            <img
              src="/pwa-192x192.png"
              alt="App Icon"
              className="w-full h-full object-cover rounded-[14px]"
            />
            <div className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-500 rounded-full border-2 border-slate-900">
              <CheckCircle2 size={12} className="text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white font-display tracking-tight">
                NiL dArK NeT
              </h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                APK / App
              </span>
            </div>
            <p className="text-xs text-slate-400">
              অ্যান্ড্রয়েড ফোন বা পিসিতে অ্যাপ হিসেবে ইনস্টল করুন
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto space-y-4 pr-1 text-sm custom-scrollbar flex-1">
          {/* Status banner if already running standalone */}
          {isInstalled && (
            <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-semibold text-emerald-200">অ্যাপটি ইতিমধ্যে ইনস্টল করা আছে!</p>
                <p className="text-emerald-400/80">আপনি সরাসরি হোমস্ক্রিন অ্যাপ মোডে আছেন।</p>
              </div>
            </div>
          )}

          {/* Direct One-Click Install Button if supported */}
          {isInstallable && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600/30 to-sky-600/20 border border-indigo-500/40 text-center">
              <h3 className="font-bold text-white text-base mb-1">
                এক ক্লিকে ফোনে ইনস্টল করুন
              </h3>
              <p className="text-xs text-slate-300 mb-3.5">
                কোনো ঝামেলা ছাড়া সরাসরি হোমস্ক্রিনে অ্যাপ ডাউনলোড হয়ে যাবে
              </p>
              <button
                onClick={handleDirectInstall}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Download size={18} />
                <span>Install APK / App (এখনই ইনস্টল করুন)</span>
              </button>
            </div>
          )}

          {/* Android APK manual installation guide (Chrome / Browser) */}
          <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs uppercase tracking-wider">
              <Smartphone size={15} />
              <span>Android ফোনে ইনস্টল করার নিয়ম (APK Mode)</span>
            </div>

            <ol className="space-y-2.5 text-xs text-slate-300 pl-1">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  ব্রাউজারের (Chrome/Brave) উপরের ডানে{' '}
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-slate-700 rounded text-slate-100 font-mono">
                    <MoreVertical size={11} className="inline mr-0.5" /> ৩-ডট
                  </span>{' '}
                  মেনুতে চাপুন।
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  তালিকা থেকে <strong className="text-white">"Install app"</strong> অথবা{' '}
                  <strong className="text-white">"Add to Home screen"</strong> (হোম স্ক্রিনে যোগ
                  করুন) চাপুন।
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-emerald-400">Install</strong> চাপলেই আপনার ফোনে WebAPK
                  প্যাকেজ তৈরি হয়ে হোমস্ক্রিনে চলে আসবে এবং নোটিফিকেশন সহ পুরোদমে চলবে!
                </div>
              </li>
            </ol>
          </div>

          {/* APK & App Installation Guide */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/70 border border-indigo-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                <Package size={16} className="text-indigo-400" />
                <span>অ্যান্ড্রয়েডে আসল APK এর মতো ইনস্টল করার নিয়ম</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                WebAPK / 100% Native
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Google AI Studio-এর প্রিভিউ লিংকগুলোতে স্বয়ংক্রিয় গুগল সিকিউরিটি গেটওয়ে থাকার কারণে থার্ড-পার্টি টুল (যেমন PWABuilder) সাইটের ব্যাকএন্ড সরাসরি অ্যাক্সেস করতে পারে না।
            </p>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <p className="text-indigo-300 font-semibold">
                সবচেয়ে নির্ভরযোগ্য উপায় — Google Chrome WebAPK:
              </p>
              <p className="text-slate-300 leading-relaxed">
                আপনার ফোনের Chrome ব্রাউজারে এই লিংকটি ওপেন করে উপরের <strong>"Install APK / App"</strong> বাটনে চাপুন (বা ৩-ডট মেনু থেকে <strong>"Install app"</strong> চাপুন)। Google Play Services আপনার ফোনে স্বয়ংক্রিয়ভাবে একটি নিজস্ব <strong>Android APK প্যাকেজ</strong> তৈরি ও ইনস্টল করে দেয়!
              </p>
            </div>
          </div>

          {/* iOS Safari Guide if user on Apple device */}
          {isIOS && (
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <div className="flex items-center gap-2 text-sky-300 font-bold text-xs uppercase tracking-wider">
                <Share size={15} />
                <span>iPhone / iPad এ ইনস্টল করার নিয়ম</span>
              </div>
              <ol className="space-y-2 text-xs text-slate-300 pl-1">
                <li>
                  ১. Safari ব্রাউজারের নিচে <strong>Share</strong> বাটনে ট্যাপ করুন।
                </li>
                <li>
                  ২. নিচে স্ক্রল করে <strong>"Add to Home Screen"</strong> চাপুন।
                </li>
                <li>
                  ৩. উপরে <strong>"Add"</strong> বাটনে চাপ দিলেই অ্যাপটি হোমস্ক্রিনে চলে আসবে।
                </li>
              </ol>
            </div>
          )}

          {/* Key Advantages of App Mode */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center">
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <Bell size={16} className="mx-auto text-indigo-400 mb-1" />
              <div className="text-[11px] font-bold text-white">ইনস্ট্যান্ট সাউন্ড</div>
              <div className="text-[9px] text-slate-400">নতুন মেসেজে রিং</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <Zap size={16} className="mx-auto text-amber-400 mb-1" />
              <div className="text-[11px] font-bold text-white">ফুলস্ক্রিন</div>
              <div className="text-[9px] text-slate-400">ব্রাউজার বার ছাড়া</div>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40">
              <ShieldCheck size={16} className="mx-auto text-sky-400 mb-1" />
              <div className="text-[11px] font-bold text-white">নিরাপদ PIN</div>
              <div className="text-[9px] text-slate-400">এন্ড-টু-এন্ড প্রটেক্টেড</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400">NiL dArK NeT v2.0 PWA</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            বন্ধ করুন / Close
          </button>
        </div>
      </div>
    </div>
  );
};
