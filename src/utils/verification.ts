import { db, ref, update } from '../firebase';
import { User } from '../types';

/**
 * Checks if a user's verified badge is active and has not expired.
 * If expired (e.g. 1-hour trial or past date), automatically returns false
 * and cleans up the record in Firebase.
 */
export function isUserVerifiedActive(user?: Partial<User> | null, autoCleanupDb: boolean = true): boolean {
  if (!user || !user.verified) return false;

  if (user.verifyExpireTime) {
    const expireTime = new Date(user.verifyExpireTime).getTime();
    if (!isNaN(expireTime) && expireTime <= Date.now()) {
      // Expired!
      if (autoCleanupDb && user.uid) {
        update(ref(db, `users/${user.uid}`), {
          verified: false,
          verifyPackage: null,
          verifyExpireTime: null,
        }).catch(() => {});
      }
      return false;
    }
  }

  return true;
}

/**
 * Helper to get human-readable expiration time remaining.
 */
export function getVerificationRemaining(expireIso?: string | null): { expired: boolean; text: string } {
  if (!expireIso) return { expired: false, text: '' };
  const expire = new Date(expireIso).getTime();
  if (isNaN(expire)) return { expired: false, text: '' };

  const diff = expire - Date.now();
  if (diff <= 0) {
    return { expired: true, text: 'Expired' };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { expired: false, text: `${days}d ${hours % 24}h remaining` };
  }

  if (hours > 0) {
    return { expired: false, text: `${hours}h ${minutes}m ${seconds}s remaining` };
  }

  return { expired: false, text: `${minutes}m ${seconds}s remaining` };
}
