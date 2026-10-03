import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
} from '../utils/notifications';

interface NotificationPermissionBannerProps {
  onPermissionGranted?: () => void;
}

export const NotificationPermissionBanner: React.FC<NotificationPermissionBannerProps> = ({
  onPermissionGranted,
}) => {
  const [show, setShow] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;
    const dismissed = sessionStorage.getItem('nil_notif_banner_dismissed');
    if (getNotificationPermission() === 'default' && !dismissed) {
      // Delay slightly for smooth appearance
      const t = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(t);
    }
  }, []);

  if (!show) return null;

  const handleEnable = async () => {
    setIsProcessing(true);
    try {
      const perm = await requestNotificationPermission();
      if (perm === 'granted') {
        setShow(false);
        if (onPermissionGranted) onPermissionGranted();
      } else {
        setShow(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('nil_notif_banner_dismissed', 'true');
  };

  return (
    <div className="relative z-40 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-indigo-500/30 px-3 py-2 sm:px-4 animate-in slide-in-from-top duration-300">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 shrink-0">
            <Bell size={15} className="animate-bounce" />
          </div>
          <p className="text-slate-200 truncate">
            মেসেজ আসলে সরাসরি স্ক্রিনে নোটিফিকেশন ও সাউন্ড পেতে পারমিশন চালু করুন
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleEnable}
            disabled={isProcessing}
            className="py-1 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 shadow transition cursor-pointer"
          >
            <Check size={13} />
            <span>চালু করুন / Allow</span>
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
