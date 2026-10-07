import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { ref, onValue, push, set, update } from 'firebase/database';
import { UserData, SettingsData, SupportMessage } from '../types';

interface CustomerSupportChatProps {
  userData: UserData | null;
  userId: string;
  userEmail: string;
  settings: SettingsData;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const CustomerSupportChat: React.FC<CustomerSupportChatProps> = ({
  userData,
  userId,
  userEmail,
  settings,
  onClose,
  onToast
}) => {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const username = userData?.username || userEmail.split('@')[0] || 'User';

  // Listen to user's conversation with admin in Firebase
  useEffect(() => {
    if (!userId) return;
    const chatRef = ref(db, `support_chats/${userId}/messages`);
    const unsub = onValue(chatRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list: SupportMessage[] = Object.entries(val).map(([id, m]: [string, any]) => ({
          id,
          ...m
        }));
        list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setMessages(list);

        // Mark unreadByUser as false
        update(ref(db, `support_chats/${userId}`), { unreadByUser: false });
      } else {
        setMessages([]);
      }
    });

    return () => unsub();
  }, [userId]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send Message Handler
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !userId) return;

    setLoading(true);
    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toISOString().split('T')[0];

      // 1. Push message
      const msgRef = push(ref(db, `support_chats/${userId}/messages`));
      await set(msgRef, {
        sender: 'user',
        text,
        timestamp: Date.now(),
        time: timeStr,
        date: dateStr
      });

      // 2. Update chat metadata for Admin Inbox
      await update(ref(db, `support_chats/${userId}`), {
        userId,
        username,
        userEmail,
        lastMessage: text,
        lastMessageTime: Date.now(),
        unreadByAdmin: true,
        unreadByUser: false
      });

      setInputText('');
    } catch (err: any) {
      alert('Error sending message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    handleSendMessage(q);
  };

  return (
    <div className="fixed inset-0 bg-[#0d081e] z-50 flex flex-col text-white max-w-md mx-auto">
      {/* Header */}
      <header className="bg-[#1b1238] px-4 py-3 border-b border-white/10 flex items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <div>
            <h1 className="font-extrabold text-sm text-white flex items-center gap-1.5">
              <span>Customer Support</span>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            </h1>
            <p className="text-[10px] text-green-400 font-semibold">Live Admin Helpdesk • Online</p>
          </div>
        </div>

        <div className="text-[11px] font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
          In-App Support
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Support Greeting Card */}
        <div className="bg-[#1b1238] rounded-2xl p-3.5 border border-white/10 text-center space-y-1 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#e11d2e] flex items-center justify-center mx-auto text-white shadow-md mb-1">
            <i className="fas fa-headset text-lg"></i>
          </div>
          <h3 className="font-extrabold text-xs text-white">Welcome to ROYAL 11 Support</h3>
          <p className="text-[11px] text-gray-300 leading-relaxed">
            Need help or have an inquiry? Send a message and our support admin will reply directly.
          </p>
        </div>

        {/* Quick Issue Chips */}
        {messages.length === 0 && (
          <div className="space-y-1.5 pt-1">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Quick Inquiries:</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Deposit problem / Balance not added',
                'Withdrawal status inquiry',
                'Need Match Room ID & Password',
                'Tournament rules & guidelines'
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuestion(chip)}
                  className="bg-[#1b1238] hover:bg-[#281b52] border border-white/15 text-gray-200 text-[11px] py-1.5 px-3 rounded-full text-left transition active:scale-95"
                >
                  💬 {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Bubbles */}
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-md break-words ${
                  isUser
                    ? 'bg-[#e11d2e] text-white rounded-br-xs'
                    : 'bg-[#1b1238] border border-purple-500/30 text-white rounded-bl-xs'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1 text-[10px] text-yellow-400 font-black mb-1">
                    <i className="fas fa-shield-alt"></i>
                    <span>ADMIN SUPPORT</span>
                  </div>
                )}
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
              <span className="text-[9px] text-gray-500 mt-1 px-1">
                {msg.time}
              </span>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <div className="bg-[#1b1238] border-t border-white/10 p-3 flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSendMessage();
          }}
          placeholder="Type your message here..."
          className="flex-1 bg-[#0d081e] border border-white/15 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e11d2e]"
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={loading || !inputText.trim()}
          className="bg-[#e11d2e] hover:bg-red-700 disabled:opacity-40 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md active:scale-95 transition"
        >
          <i className="fas fa-paper-plane text-xs"></i>
        </button>
      </div>
    </div>
  );
};
