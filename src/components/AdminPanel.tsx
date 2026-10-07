import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { ref, onValue, set, push, remove, update, get } from 'firebase/database';
import { SliderItem, SettingsData, SupportChat, SupportMessage } from '../types';

interface AdminPanelProps {
  onClose: () => void;
  settings: SettingsData;
  onToast: (msg: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose, settings, onToast }) => {
  const [adminTab, setAdminTab] = useState<'banners' | 'payment' | 'notices' | 'deposits' | 'withdrawals' | 'support'>('banners');

  // Banner State
  const [banners, setBanners] = useState<{ id: string; item: SliderItem }[]>([]);
  const [newBannerUrl, setNewBannerUrl] = useState('');
  const [newBannerLink, setNewBannerLink] = useState('');
  const [newBannerTitle, setNewBannerTitle] = useState('');

  // Payment Scanner State
  const [qrUrl, setQrUrl] = useState(settings.manualQrUrl || '');
  const [upiId, setUpiId] = useState(settings.manualUpiId || '');
  const [zapKey, setZapKey] = useState(settings.zapupiKey || '');
  const [gatewayMode, setGatewayMode] = useState(settings.paymentGatewayMode || 'zapupi');

  // Rules & Notice State
  const [rulesText, setRulesText] = useState(settings.rulesText || '[ ROYAL 11 RULES — CLICK HERE ]');
  const [rulesLink, setRulesLink] = useState(settings.rulesLink || '');

  // Requests
  const [depositRequests, setDepositRequests] = useState<any[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([]);

  // Customer Support Live Chat State
  const [supportChats, setSupportChats] = useState<SupportChat[]>([]);
  const [activeChatUserId, setActiveChatUserId] = useState<string | null>(null);
  const [activeChatUser, setActiveChatUser] = useState<SupportChat | null>(null);
  const [activeChatMessages, setActiveChatMessages] = useState<SupportMessage[]>([]);
  const [adminReplyText, setAdminReplyText] = useState('');

  // Load Banners from Firebase
  useEffect(() => {
    const bannersRef = ref(db, 'sliderImages');
    onValue(bannersRef, (snapshot) => {
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = Object.entries(val).map(([id, item]: [string, any]) => ({
          id,
          item: item as SliderItem
        }));
        setBanners(list);
      } else {
        setBanners([]);
      }
    });
  }, []);

  // Load Deposit & Withdrawal Requests
  useEffect(() => {
    onValue(ref(db, 'deposit_request'), (snapshot) => {
      if (snapshot.exists()) {
        const list: any[] = [];
        snapshot.forEach((userSnap) => {
          const uid = userSnap.key;
          userSnap.forEach((reqSnap) => {
            list.push({ reqId: reqSnap.key, uid, ...reqSnap.val() });
          });
        });
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setDepositRequests(list);
      } else {
        setDepositRequests([]);
      }
    });

    onValue(ref(db, 'withdrawal_request'), (snapshot) => {
      if (snapshot.exists()) {
        const list: any[] = [];
        snapshot.forEach((userSnap) => {
          const uid = userSnap.key;
          userSnap.forEach((reqSnap) => {
            list.push({ reqId: reqSnap.key, uid, ...reqSnap.val() });
          });
        });
        list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setWithdrawalRequests(list);
      } else {
        setWithdrawalRequests([]);
      }
    });

    // Listen to All Customer Support Chats
    onValue(ref(db, 'support_chats'), (snapshot) => {
      if (snapshot.exists()) {
        const list: SupportChat[] = [];
        snapshot.forEach((chatSnap) => {
          const val = chatSnap.val();
          list.push({
            userId: chatSnap.key || val.userId,
            username: val.username || 'User',
            userEmail: val.userEmail || '',
            lastMessage: val.lastMessage || '',
            lastMessageTime: val.lastMessageTime || 0,
            unreadByAdmin: val.unreadByAdmin === true
          });
        });
        list.sort((a, b) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        setSupportChats(list);
      } else {
        setSupportChats([]);
      }
    });
  }, []);

  // Listen to messages of active user chat
  useEffect(() => {
    if (!activeChatUserId) {
      setActiveChatMessages([]);
      return;
    }
    const msgsRef = ref(db, `support_chats/${activeChatUserId}/messages`);
    const unsub = onValue(msgsRef, (snapshot) => {
      if (snapshot.exists()) {
        const list: SupportMessage[] = Object.entries(snapshot.val()).map(([id, m]: [string, any]) => ({
          id,
          ...m
        }));
        list.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        setActiveChatMessages(list);

        // Mark unreadByAdmin as false
        update(ref(db, `support_chats/${activeChatUserId}`), { unreadByAdmin: false });
      } else {
        setActiveChatMessages([]);
      }
    });
    return () => unsub();
  }, [activeChatUserId]);

  // Admin Send Reply Handler
  const handleSendAdminReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminReplyText.trim() || !activeChatUserId) return;

    try {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toISOString().split('T')[0];

      // 1. Push admin message
      const msgRef = push(ref(db, `support_chats/${activeChatUserId}/messages`));
      await set(msgRef, {
        sender: 'admin',
        text: adminReplyText.trim(),
        timestamp: Date.now(),
        time: timeStr,
        date: dateStr
      });

      // 2. Update chat metadata
      await update(ref(db, `support_chats/${activeChatUserId}`), {
        lastMessage: `Admin: ${adminReplyText.trim()}`,
        lastMessageTime: Date.now(),
        unreadByAdmin: false,
        unreadByUser: true
      });

      setAdminReplyText('');
      onToast('Reply sent to user!');
    } catch (err: any) {
      alert('Error sending reply: ' + err.message);
    }
  };

  // Add Banner Handler
  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBannerUrl.trim()) {
      alert('Please enter Banner Image URL');
      return;
    }
    try {
      const bannerRef = push(ref(db, 'sliderImages'));
      await set(bannerRef, {
        imageUrl: newBannerUrl.trim(),
        link: newBannerLink.trim() || '',
        title: newBannerTitle.trim() || 'Home Banner',
        createdAt: Date.now()
      });
      setNewBannerUrl('');
      setNewBannerLink('');
      setNewBannerTitle('');
      onToast('Banner added to Home Screen successfully!');
    } catch (err: any) {
      alert('Error adding banner: ' + err.message);
    }
  };

  // Delete Banner Handler
  const handleDeleteBanner = async (bannerId: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return;
    try {
      await remove(ref(db, `sliderImages/${bannerId}`));
      onToast('Banner deleted successfully');
    } catch (err: any) {
      alert('Error deleting banner: ' + err.message);
    }
  };

  // Save Payment Scanner Settings
  const handleSavePaymentSettings = async () => {
    try {
      await update(ref(db, 'settings'), {
        manualQrUrl: qrUrl.trim(),
        manualUpiId: upiId.trim(),
        zapupiKey: zapKey.trim(),
        paymentGatewayMode: gatewayMode
      });
      onToast('Payment Scanner & Gateway updated!');
    } catch (err: any) {
      alert('Error saving payment settings: ' + err.message);
    }
  };

  // Save Rules & Notice Settings
  const handleSaveRules = async () => {
    try {
      await update(ref(db, 'settings'), {
        rulesText: rulesText.trim(),
        rulesLink: rulesLink.trim()
      });
      // Also add to notices list
      await push(ref(db, 'notices'), { text: rulesText.trim() });
      onToast('Notice & Rules updated!');
    } catch (err: any) {
      alert('Error saving rules: ' + err.message);
    }
  };

  // Approve Deposit Request
  const handleApproveDeposit = async (req: any) => {
    try {
      const amt = parseFloat(req.amount || '0');
      // 1. Get user
      const userRef = ref(db, `users/${req.uid}`);
      const userSnap = await get(userRef);
      if (userSnap.exists()) {
        const udata = userSnap.val();
        const curDep = parseFloat(udata.depositBalance || udata.addBalance || 0);
        const curTot = parseFloat(udata.totalBalance || 0);
        const newDep = curDep + amt;
        const newTot = curTot + amt;
        await update(userRef, {
          depositBalance: newDep,
          addBalance: newDep,
          totalBalance: newTot
        });
      }
      // 2. Mark complete
      await update(ref(db, `deposit_request/${req.uid}/${req.reqId}`), {
        status: 'complete',
        approvedAt: Date.now()
      });
      // 3. Add to walletHistory
      await push(ref(db, `walletHistory/${req.uid}`), {
        type: 'deposit',
        amount: amt,
        description: `Add Money to Join Wallet - #${req.utrNumber || req.reqId.slice(-6)}`,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        status: 'approved'
      });
      onToast(`Deposit of ₹${amt} approved! Wallet credited.`);
    } catch (e: any) {
      alert('Error approving deposit: ' + e.message);
    }
  };

  // Reject Deposit Request
  const handleRejectDeposit = async (req: any) => {
    try {
      await update(ref(db, `deposit_request/${req.uid}/${req.reqId}`), {
        status: 'failed',
        rejectedAt: Date.now()
      });
      onToast('Deposit rejected.');
    } catch (e: any) {
      alert('Error rejecting: ' + e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d081e] z-50 overflow-y-auto text-white flex flex-col">
      {/* Admin Top Header */}
      <header className="bg-[#1b1238] px-4 py-3.5 border-b border-white/10 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white"
          >
            <i className="fas fa-arrow-left text-sm"></i>
          </button>
          <div>
            <h1 className="font-extrabold text-base text-white flex items-center gap-2">
              <i className="fas fa-user-shield text-[#e11d2e]"></i> Admin Control Panel
            </h1>
            <p className="text-[10px] text-gray-400">Manage Banners, Scanner, & Payouts</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-bold bg-[#e11d2e] px-3 py-1.5 rounded-lg"
        >
          Exit
        </button>
      </header>

      {/* Admin Sub-tabs */}
      <div className="bg-[#120a26] border-b border-white/10 flex overflow-x-auto no-scrollbar p-1 gap-1">
        {[
          { id: 'banners', label: 'Home Banners', icon: 'fa-images' },
          { id: 'payment', label: 'QR Scanner', icon: 'fa-qrcode' },
          { id: 'notices', label: 'Rules Notice', icon: 'fa-bullhorn' },
          { id: 'deposits', label: 'Deposits', icon: 'fa-arrow-down' },
          { id: 'withdrawals', label: 'Withdrawals', icon: 'fa-arrow-up' },
          { id: 'support', label: 'Support Inbox', icon: 'fa-comments' }
        ].map(tab => {
          const unreadCount = tab.id === 'support' ? supportChats.filter(c => c.unreadByAdmin).length : 0;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setAdminTab(tab.id as any);
                if (tab.id !== 'support') setActiveChatUserId(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition relative ${
                adminTab === tab.id ? 'bg-[#e11d2e] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              <span>{tab.label}</span>
              {unreadCount > 0 && (
                <span className="bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full ml-1">
                  {unreadCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-4 max-w-lg mx-auto w-full flex-grow pb-16">
        {/* ========================================================================= */}
        {/* 1. HOME BANNER MANAGEMENT (Add, List, Delete)                            */}
        {/* ========================================================================= */}
        {adminTab === 'banners' && (
          <div className="space-y-5">
            {/* Add Banner Form */}
            <form onSubmit={handleAddBanner} className="bg-[#1b1238] rounded-2xl p-4 border border-white/10 space-y-3">
              <h2 className="font-bold text-sm text-yellow-400 flex items-center gap-2">
                <i className="fas fa-plus-circle"></i> Add New Home Screen Banner
              </h2>

              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">Banner Image URL *</label>
                <input
                  type="url"
                  placeholder="https://example.com/banner.png"
                  value={newBannerUrl}
                  onChange={e => setNewBannerUrl(e.target.value)}
                  className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#e11d2e]"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">Title / Caption (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. ROYAL 11 Full Guide"
                  value={newBannerTitle}
                  onChange={e => setNewBannerTitle(e.target.value)}
                  className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-gray-300 block mb-1">Click Link / Video URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={newBannerLink}
                  onChange={e => setNewBannerLink(e.target.value)}
                  className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              {/* Banner Live Preview */}
              {newBannerUrl && (
                <div className="pt-1">
                  <p className="text-[10px] text-gray-400 mb-1">Preview:</p>
                  <div className="w-full aspect-[2.1/1] rounded-xl overflow-hidden border border-white/20 bg-black/40">
                    <img src={newBannerUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#e11d2e] hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition active:scale-95"
              >
                + ADD BANNER TO HOME SCREEN
              </button>
            </form>

            {/* List Existing Banners */}
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                Active Banners ({banners.length})
              </h3>
              {banners.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-8">No banners added yet.</p>
              ) : (
                banners.map(({ id, item }) => (
                  <div key={id} className="bg-[#1b1238] rounded-2xl overflow-hidden border border-white/10 p-3 space-y-2">
                    <div className="w-full aspect-[2.3/1] rounded-xl overflow-hidden bg-black/30">
                      <img src={item.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-xs truncate">{item.title || 'Home Banner'}</p>
                        {item.link && <p className="text-[10px] text-blue-400 truncate">{item.link}</p>}
                      </div>
                      <button
                        onClick={() => handleDeleteBanner(id)}
                        className="bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition flex-shrink-0"
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. PAYMENT & SCANNER SETTINGS                                             */}
        {/* ========================================================================= */}
        {adminTab === 'payment' && (
          <div className="bg-[#1b1238] rounded-2xl p-4 border border-white/10 space-y-4">
            <h2 className="font-bold text-sm text-yellow-400 flex items-center gap-2">
              <i className="fas fa-qrcode"></i> Deposit Scanner & UPI Configuration
            </h2>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Manual Payment QR Image URL
              </label>
              <input
                type="url"
                value={qrUrl}
                onChange={e => setQrUrl(e.target.value)}
                placeholder="https://example.com/my-qr-code.jpg"
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#e11d2e]"
              />
              {qrUrl && (
                <div className="mt-2 flex justify-center bg-[#0d081e] p-2 rounded-xl">
                  <img src={qrUrl} alt="QR Preview" className="w-40 h-40 object-contain rounded-lg border border-white/10" />
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                UPI ID (Displayed to users for manual transfer)
              </label>
              <input
                type="text"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                placeholder="e.g. mustakima11@fam"
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                ZapUPI API Key (Auto Scanner Instant Payment)
              </label>
              <input
                type="text"
                value={zapKey}
                onChange={e => setZapKey(e.target.value)}
                placeholder="zap_..."
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">Default Deposit Mode</label>
              <select
                value={gatewayMode}
                onChange={e => setGatewayMode(e.target.value)}
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs focus:outline-none text-white"
              >
                <option value="both">Both (Auto Scanner + Manual QR)</option>
                <option value="manual">Manual QR Only (Admin Approves UTR)</option>
                <option value="zapupi">Auto Scanner Only (Instant ZapUPI)</option>
              </select>
            </div>

            <div className="bg-yellow-900/30 border border-yellow-500/30 p-3 rounded-xl text-[11px] text-yellow-300">
              * Minimum deposit limit is fixed at <strong>₹10</strong>.<br />
              * Withdrawal limit is fixed from <strong>₹50</strong> to <strong>₹2,000</strong>.
            </div>

            <button
              onClick={handleSavePaymentSettings}
              className="w-full bg-[#e11d2e] hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition"
            >
              SAVE PAYMENT SCANNER SETTINGS
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. RULES & NOTICE SETTINGS                                                */}
        {/* ========================================================================= */}
        {adminTab === 'notices' && (
          <div className="bg-[#1b1238] rounded-2xl p-4 border border-white/10 space-y-4">
            <h2 className="font-bold text-sm text-yellow-400 flex items-center gap-2">
              <i className="fas fa-bullhorn"></i> Home Notice & Rules Banner
            </h2>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Notice / Rules Text (Shown in Red Megaphone bar)
              </label>
              <input
                type="text"
                value={rulesText}
                onChange={e => setRulesText(e.target.value)}
                placeholder="[ ROYAL 11 RULES — CLICK HERE ]"
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#e11d2e]"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                Rules Click Link (Optional)
              </label>
              <input
                type="url"
                value={rulesLink}
                onChange={e => setRulesLink(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>

            <button
              onClick={handleSaveRules}
              className="w-full bg-[#e11d2e] hover:bg-red-700 text-white font-extrabold py-3 rounded-xl text-xs shadow-md transition"
            >
              UPDATE RULES NOTICE
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. DEPOSIT REQUESTS APPROVAL                                              */}
        {/* ========================================================================= */}
        {adminTab === 'deposits' && (
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">
              Pending & Recent Deposits ({depositRequests.length})
            </h3>
            {depositRequests.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">No deposit requests yet.</p>
            ) : (
              depositRequests.map(req => {
                const isPending = req.status === 'pending';
                return (
                  <div key={req.reqId} className="bg-[#1b1238] rounded-2xl p-3.5 border border-white/10 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-sm text-green-400">₹{req.amount}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPending ? 'bg-yellow-500/20 text-yellow-300' : req.status === 'complete' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                      }`}>
                        {req.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-gray-300 space-y-0.5">
                      <p><strong>User:</strong> {req.username} ({req.uid})</p>
                      <p><strong>UTR:</strong> {req.utrNumber || 'N/A'}</p>
                      <p><strong>Time:</strong> {req.date} {req.time}</p>
                      <p><strong>Gateway:</strong> {req.gateway || 'Manual'}</p>
                    </div>

                    {isPending && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleApproveDeposit(req)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 rounded-xl text-xs"
                        >
                          ✓ Approve & Credit
                        </button>
                        <button
                          onClick={() => handleRejectDeposit(req)}
                          className="flex-1 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white font-bold py-1.5 rounded-xl text-xs"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. WITHDRAWAL REQUESTS APPROVAL                                           */}
        {/* ========================================================================= */}
        {adminTab === 'withdrawals' && (
          <div className="space-y-3">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">
              Withdrawal Requests ({withdrawalRequests.length})
            </h3>
            {withdrawalRequests.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">No withdrawal requests yet.</p>
            ) : (
              withdrawalRequests.map(w => (
                <div key={w.reqId} className="bg-[#1b1238] rounded-2xl p-3.5 border border-white/10 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-sm text-red-400">₹{w.amount}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
                      {w.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-300">
                    <p><strong>User:</strong> {w.username} ({w.userEmail})</p>
                    <p><strong>Method:</strong> {w.withdrawMethod}</p>
                    <p><strong>Target:</strong> {w.email}</p>
                    <p><strong>TxID:</strong> {w.transactionId}</p>
                    <p><strong>Time:</strong> {w.date} {w.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. CUSTOMER SUPPORT LIVE INBOX (Admin views messages & replies)           */}
        {/* ========================================================================= */}
        {adminTab === 'support' && (
          <div className="space-y-4">
            {activeChatUserId ? (
              /* Active Chat Conversation with User */
              <div className="bg-[#1b1238] rounded-2xl border border-white/10 overflow-hidden flex flex-col h-[520px]">
                {/* Active Chat Top Bar */}
                <div className="bg-[#120a26] p-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <button
                      onClick={() => {
                        setActiveChatUserId(null);
                        setActiveChatUser(null);
                      }}
                      className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                    >
                      <i className="fas fa-arrow-left text-xs"></i>
                    </button>
                    <div>
                      <h4 className="font-bold text-xs text-white">{activeChatUser?.username || 'User Chat'}</h4>
                      <p className="text-[10px] text-gray-400">{activeChatUser?.userEmail}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                </div>

                {/* Message Thread */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                  {activeChatMessages.length === 0 ? (
                    <p className="text-center text-gray-500 text-xs py-10">No messages in this conversation yet</p>
                  ) : (
                    activeChatMessages.map((msg) => {
                      const isAdmin = msg.sender === 'admin';
                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs shadow-sm break-words ${
                              isAdmin
                                ? 'bg-blue-600 text-white rounded-br-xs'
                                : 'bg-[#0d081e] border border-white/15 text-gray-100 rounded-bl-xs'
                            }`}
                          >
                            <span className="text-[9px] font-bold block mb-0.5 opacity-75">
                              {isAdmin ? '🛡️ You (Admin)' : `👤 ${activeChatUser?.username || 'User'}`}
                            </span>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          </div>
                          <span className="text-[9px] text-gray-500 mt-0.5 px-1">{msg.time}</span>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Admin Reply Form */}
                <form onSubmit={handleSendAdminReply} className="p-2.5 bg-[#120a26] border-t border-white/10 flex gap-2">
                  <input
                    type="text"
                    value={adminReplyText}
                    onChange={(e) => setAdminReplyText(e.target.value)}
                    placeholder="Type reply to user..."
                    className="flex-1 bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e11d2e]"
                  />
                  <button
                    type="submit"
                    disabled={!adminReplyText.trim()}
                    className="bg-[#e11d2e] hover:bg-red-700 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
                  >
                    <i className="fas fa-paper-plane text-xs"></i>
                    <span>Reply</span>
                  </button>
                </form>
              </div>
            ) : (
              /* All Support Conversations List */
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-gray-400">
                    User Inquiries ({supportChats.length})
                  </h3>
                  <span className="text-[10px] text-gray-400">Click to reply</span>
                </div>

                {supportChats.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-xs">
                    <i className="fas fa-comments text-3xl mb-2 text-gray-600"></i>
                    <p>No user support messages yet.</p>
                  </div>
                ) : (
                  supportChats.map((chat) => (
                    <div
                      key={chat.userId}
                      onClick={() => {
                        setActiveChatUserId(chat.userId);
                        setActiveChatUser(chat);
                      }}
                      className={`bg-[#1b1238] hover:bg-[#251a4b] rounded-2xl p-3.5 border cursor-pointer transition shadow-sm space-y-1 ${
                        chat.unreadByAdmin ? 'border-yellow-400/60 bg-yellow-950/15' : 'border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white">{chat.username}</span>
                          {chat.unreadByAdmin && (
                            <span className="bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.2 rounded-full">
                              NEW MESSAGE
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {chat.lastMessageTime ? new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-300 truncate">
                        {chat.lastMessage || 'User started conversation'}
                      </p>
                      <p className="text-[10px] text-gray-500">{chat.userEmail}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
