import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, onChildAdded, set, get, update, remove, push, runTransaction, serverTimestamp } from 'firebase/database';
import { User } from './types';

const firebaseConfig = {
  apiKey: "AIzaSyBiserV8guWwT2MQqzbrf9hD2qwYBKmYsY",
  authDomain: "chat-b8f7b.firebaseapp.com",
  databaseURL: "https://chat-b8f7b-default-rtdb.firebaseio.com",
  projectId: "chat-b8f7b",
  storageBucket: "chat-b8f7b.firebasestorage.app",
  messagingSenderId: "991663674844",
  appId: "1:991663674844:web:f3a76fe7d47bf405426b19",
  measurementId: "G-XST3WT21C9"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getDatabase(app);

export const SESSION_KEY = "nil_dark_session_v3";

export function getConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateUid(): string {
  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "u_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

export function generateRandom6Digit(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function createUniqueChatId(uid: string): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const id = generateRandom6Digit();
    const idRef = ref(db, `chatIds/${id}`);
    const result = await runTransaction(idRef, (current) => {
      if (current === null) {
        return uid;
      }
      return undefined; // abort
    });

    if (result.committed && result.snapshot.val() === uid) {
      return id;
    }
  }
  throw new Error("Could not allocate a unique 6-digit Chat ID. Please try again.");
}

export { ref, onValue, onChildAdded, set, get, update, remove, push, runTransaction, serverTimestamp };
