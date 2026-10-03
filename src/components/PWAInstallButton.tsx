import React, { useState } from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { InstallAppModal } from './InstallAppModal';

interface PWAInstallButtonProps {
  variant?: 'compact' | 'full' | 'icon';
  className?: string;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  const handleClick = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted) {
        setShowModal(true);
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      {variant === 'icon' ? (
        <button
          onClick={handleClick}
          className={`p-2 rounded-xl text-indigo-300 hover:text-white bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 transition-colors flex items-center justify-center cursor-pointer ${className}`}
          title="Install APK / App"
        >
          <Download size={16} />
        </button>
      ) : variant === 'full' ? (
        <button
          onClick={handleClick}
          className={`w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-indigo-600/20 via-sky-600/20 to-indigo-600/20 hover:from-indigo-600/30 hover:to-sky-600/30 border border-indigo-500/30 text-indigo-200 hover:text-white text-xs font-bold flex items-center justify-between transition-all group cursor-pointer shadow-sm ${className}`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/30 text-indigo-300 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Smartphone size={14} />
            </div>
            <div className="text-left">
              <div className="text-white font-semibold">Install APK / App</div>
              <div className="text-[10px] text-indigo-300/80">ফোনে অ্যাপ হিসেবে ইনস্টল করুন</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] border border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
            {isInstalled ? 'Installed' : 'Install'}
          </span>
        </button>
      ) : (
        <button
          onClick={handleClick}
          className={`py-1.5 px-3 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-200 hover:text-white border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${className}`}
          title="Install App on Phone"
        >
          <Download size={13} className="text-indigo-400" />
          <span>Install APK</span>
        </button>
      )}

      {showModal && (
        <InstallAppModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </>
  );
};
