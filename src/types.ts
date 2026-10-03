export interface User {
  uid: string;
  chatId: string;
  name: string;
  pinHash?: string;
  verified?: boolean;
  photo?: string;
  bio?: string;
  hideOnlineStatus?: boolean;
  soundEnabled?: boolean;
  verifyPackage?: string;
  verifyExpireTime?: string;
  verifyActivatedAt?: string;
  createdAt?: number;
}

export interface Message {
  key: string;
  senderId: string;
  receiverId: string;
  text: string;
  deliveredAt?: number | null;
  seenAt?: number | null;
  deletedFor?: Record<string, boolean>;
  createdAt?: number;
}

export interface UserChatSummary {
  uid: string;
  name: string;
  chatId: string;
  lastMessage?: string;
  lastSenderId?: string;
  updatedAt?: number;
  photo?: string;
  bio?: string;
  verified?: boolean;
  online?: boolean;
  hideOnlineStatus?: boolean;
}

export interface VerifyCodeData {
  code: string;
  package: string;
  expireTime: string;
  used: boolean;
}

export interface CallSignal {
  caller: string;
  callee: string;
  video: boolean;
  offer?: {
    type: RTCSdpType;
    sdp: string;
  };
  answer?: {
    type: RTCSdpType;
    sdp: string;
  };
  createdAt?: number;
}
