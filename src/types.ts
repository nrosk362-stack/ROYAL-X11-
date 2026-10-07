export interface UserData {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
  referralCode?: string;
  depositBalance?: number;
  addBalance?: number;
  winningBalance?: number;
  totalBalance?: number;
  matchesJoined?: number;
  totalKills?: number;
  totalWinnings?: number;
  banned?: boolean;
}

export interface MatchItem {
  matchTitle: string;
  matchTime?: string;
  totalPrize?: string | number;
  perKill?: string | number;
  entryFee?: string | number;
  winningPrize?: string | number;
  matchType?: string;
  version?: string;
  map?: string;
  imageUrl?: string;
  logoUrl?: string;
  status?: string;
  slot?: number;
  currentPlayers?: number;
  ytLiveUrl?: string;
  aboutMatch?: string;
  roomId?: string;
  roomPassword?: string;
  categoryTitle?: string;
}

export interface GameCategory {
  title: string;
  imageUrl: string;
  type?: string;
  mode?: string;
}

export interface SliderItem {
  id?: string;
  imageUrl: string;
  link?: string;
  title?: string;
}

export interface NoticeItem {
  text?: string;
  link?: string;
}

export interface SettingsData {
  appName?: string;
  logo?: string;
  zapupiKey?: string;
  manualQrUrl?: string;
  manualUpiId?: string;
  paymentGatewayMode?: string;
  rulesText?: string;
  rulesLink?: string;
  complaint?: string;
  support?: string;
  whatsapp?: string;
  discord?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  facebook?: string;
  appShare?: string;
}

export interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  description?: string;
  date?: string;
  time?: string;
  timestamp?: number;
  status?: string;
  balanceAfter?: number;
}

export interface SupportMessage {
  id: string;
  sender: 'user' | 'admin';
  text: string;
  timestamp: number;
  time: string;
  date: string;
}

export interface SupportChat {
  userId: string;
  username: string;
  userEmail: string;
  lastMessage: string;
  lastMessageTime: number;
  unreadByAdmin?: boolean;
  unreadByUser?: boolean;
}

declare global {
  interface Window {
    ZapUPI?: {
      setPaymentCallbacks: (callbacks: {
        onSuccess: (orderId: string) => void;
        onFailed: (orderId: string) => void;
        onTimeout: (orderId: string) => void;
      }) => void;
      createOrder: (
        orderData: { zap_key: string; order_id: string; amount: string; remark: string; customer_mobile?: string },
        handlers: { onResponse: (paymentUrl: string, orderId?: string, data?: unknown) => void; onError: (err: unknown) => void }
      ) => void;
      loadPayment: (paymentUrl: string) => void;
    };
  }
}
