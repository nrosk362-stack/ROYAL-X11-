import React, { useState } from 'react';
import { UserData, SettingsData } from '../types';

interface AccountViewProps {
  userData: UserData | null;
  settings: SettingsData;
  onOpenProfile: () => void;
  onOpenWallet: () => void;
  onOpenMatches: () => void;
  onOpenReferrals: () => void;
  onOpenLeaderboard: () => void;
  onOpenTutorials: () => void;
  onOpenAboutUs: () => void;
  onOpenSupport: () => void;
  onOpenTerms: () => void;
  onOpenAdmin: () => void;
  onLogout: () => void;
  onToast: (msg: string) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  userData,
  settings,
  onOpenProfile,
  onOpenWallet,
  onOpenMatches,
  onOpenReferrals,
  onOpenLeaderboard,
  onOpenTutorials,
  onOpenAboutUs,
  onOpenSupport,
  onOpenTerms,
  onOpenAdmin,
  onLogout,
  onToast
}) => {
  const [pushNotification, setPushNotification] = useState(true);
  const [activeModal, setActiveModal] = useState<'none' | 'order' | 'stats' | 'rewards' | 'announcement' | 'topPlayers' | 'language'>('none');

  const matchesPlayed = userData?.matchesJoined || 0;
  const totalKills = userData?.totalKills || 0;
  const amountWon = (userData?.totalWinnings || 0).toFixed(2);
  const username = userData?.username || 'royal10k';

  const handleShareApp = () => {
    const shareText = `Play esports tournaments and win cash on ROYAL 11! Use code: ${username}`;
    if (navigator.share) {
      navigator.share({ title: 'ROYAL 11', text: shareText, url: window.location.origin }).catch(() => {});
    } else {
      navigator.clipboard.writeText(shareText);
      onToast('Share link copied to clipboard!');
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#1b1530] pb-24 px-4 pt-3 max-w-md mx-auto">
      {/* Top Profile Card */}
      <div className="flex flex-col items-center mb-4">
        {/* Profile Avatar with Red Ring */}
        <div className="w-20 h-20 rounded-full border-2 border-red-500 p-0.5 shadow-md bg-gray-100 relative overflow-hidden flex items-center justify-center">
          <img
            src={settings.logo || 'https://plain-apac-prod-public.komododecks.com/202610/07/6yV4gzF8Htu4nBx2lHM7/image.png'}
            alt="Profile Avatar"
            className="w-full h-full rounded-full object-cover"
            onError={(e: any) => {
              e.target.src = 'https://plain-apac-prod-public.komododecks.com/202610/07/6yV4gzF8Htu4nBx2lHM7/image.png';
            }}
          />
        </div>

        {/* Username */}
        <h2 className="text-lg font-black text-[#1b1530] mt-2 tracking-wide">{username}</h2>
      </div>

      {/* Stats Box (Matches Played | Total Killed | Amount Won) */}
      <div className="bg-[#f6f4fa] rounded-2xl p-4 border border-[#ebe8f2] mb-4 shadow-xs">
        <div className="grid grid-cols-3 divide-x divide-gray-200 text-center">
          <div>
            <p className="text-lg font-black text-[#1b1530]">{matchesPlayed}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Matches<br />Played</p>
          </div>
          <div>
            <p className="text-lg font-black text-[#1b1530]">{totalKills}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">Total<br />Killed</p>
          </div>
          <div>
            <p className="text-lg font-black text-[#1b1530] flex items-center justify-center gap-1">
              <span className="text-yellow-500 text-sm">⚡</span>
              <span>{amountWon}</span>
            </p>
            <p className="text-[11px] text-gray-500 mt-0.5">Amount<br />Won</p>
          </div>
        </div>
      </div>

      {/* Admin Panel Quick Access Button */}
      <button
        onClick={onOpenAdmin}
        className="w-full bg-[#1b1530] text-white rounded-2xl px-4 py-3 flex items-center justify-between mb-3 text-xs font-black shadow-xs active:scale-95 transition"
      >
        <span className="flex items-center gap-2.5">
          <i className="fas fa-user-shield text-yellow-400"></i>
          <span>Admin Control Panel (Banners, Notices, Gateway)</span>
        </span>
        <i className="fas fa-chevron-right text-gray-400"></i>
      </button>

      {/* Full 18 Items List (100% English) */}
      <div className="space-y-2">
        {/* 1. Push Notification */}
        <div className="bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-bell text-gray-600 w-4 text-center"></i>
            <span>Push Notification</span>
          </div>
          <button
            onClick={() => {
              setPushNotification(!pushNotification);
              onToast(pushNotification ? 'Notifications turned off' : 'Notifications enabled');
            }}
            className={`w-11 h-6 rounded-full transition p-0.5 flex items-center ${
              pushNotification ? 'bg-[#e11d2e] justify-end' : 'bg-gray-300 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-xs"></div>
          </button>
        </div>

        {/* 2. My Profile */}
        <button
          onClick={onOpenProfile}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-user text-gray-600 w-4 text-center"></i>
            <span>My Profile</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 3. My Wallet */}
        <button
          onClick={onOpenWallet}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-wallet text-gray-600 w-4 text-center"></i>
            <span>My Wallet</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 4. My Matches */}
        <button
          onClick={onOpenMatches}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-gamepad text-gray-600 w-4 text-center"></i>
            <span>My Matches</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 5. My Order */}
        <button
          onClick={() => setActiveModal('order')}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-shopping-cart text-gray-600 w-4 text-center"></i>
            <span>My Order</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 6. My Statistics */}
        <button
          onClick={() => setActiveModal('stats')}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-chart-bar text-gray-600 w-4 text-center"></i>
            <span>My Statistics</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 7. My Rewards */}
        <button
          onClick={() => setActiveModal('rewards')}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-gift text-gray-600 w-4 text-center"></i>
            <span>My Rewards</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 8. My Referrals */}
        <button
          onClick={onOpenReferrals}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-users text-gray-600 w-4 text-center"></i>
            <span>My Referrals</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 9. Announcement */}
        <button
          onClick={() => setActiveModal('announcement')}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-flag text-gray-600 w-4 text-center"></i>
            <span>Announcement</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 10. Top Players */}
        <button
          onClick={() => setActiveModal('topPlayers')}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-star text-gray-600 w-4 text-center"></i>
            <span>Top Players</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 11. Leaderboard */}
        <button
          onClick={onOpenLeaderboard}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-trophy text-gray-600 w-4 text-center"></i>
            <span>Leaderboard</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 12. App Tutorial */}
        <button
          onClick={onOpenTutorials}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-play-circle text-gray-600 w-4 text-center"></i>
            <span>App Tutorial</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 13. About us */}
        <button
          onClick={onOpenAboutUs}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-info-circle text-gray-600 w-4 text-center"></i>
            <span>About us</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 14. Customer Support */}
        <button
          onClick={onOpenSupport}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-headphones text-gray-600 w-4 text-center"></i>
            <span>Customer Support</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 15. Share App */}
        <button
          onClick={handleShareApp}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-share-alt text-gray-600 w-4 text-center"></i>
            <span>Share App</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 16. Terms & Conditions */}
        <button
          onClick={onOpenTerms}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-clipboard-list text-gray-600 w-4 text-center"></i>
            <span>Terms & Conditions</span>
          </div>
          <i className="fas fa-chevron-right text-gray-400 text-xs"></i>
        </button>

        {/* 17. Change Language */}
        <button
          onClick={() => setActiveModal('language')}
          className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left"
        >
          <div className="flex items-center space-x-3.5 font-bold text-xs text-[#1b1530]">
            <i className="fas fa-globe text-gray-600 w-4 text-center"></i>
            <span>Change Language</span>
          </div>
          <span className="text-[11px] text-gray-500 font-bold">English</span>
        </button>

        {/* 18. Logout */}
        <button
          onClick={onLogout}
          className="w-full bg-[#f6f4fa] border border-red-200 rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-xs active:scale-95 transition text-left text-[#e11d2e] hover:bg-red-50"
        >
          <div className="flex items-center space-x-3.5 font-extrabold text-xs">
            <i className="fas fa-power-off w-4 text-center"></i>
            <span>Logout</span>
          </div>
          <i className="fas fa-chevron-right text-red-300 text-xs"></i>
        </button>
      </div>

      {/* Version Tag */}
      <p className="text-center text-gray-400 text-xs font-semibold mt-6 tracking-wide">
        Version : 4
      </p>

      {/* MODALS */}
      {activeModal === 'order' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-gray-200 space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-[#1b1530]">My Orders</h3>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <div className="text-center py-8 text-gray-400 text-xs">
              <i className="fas fa-shopping-bag text-3xl mb-2 text-gray-300"></i>
              <p>No orders found</p>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'stats' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-gray-200 space-y-3 shadow-xl">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-extrabold text-base text-[#1b1530]">Player Statistics</h3>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="bg-[#f6f4fa] p-3 rounded-xl flex justify-between">
                <span className="text-gray-500">Total Matches:</span>
                <span className="font-bold text-[#1b1530]">{matchesPlayed}</span>
              </div>
              <div className="bg-[#f6f4fa] p-3 rounded-xl flex justify-between">
                <span className="text-gray-500">Total Kills:</span>
                <span className="font-bold text-[#1b1530]">{totalKills}</span>
              </div>
              <div className="bg-[#f6f4fa] p-3 rounded-xl flex justify-between">
                <span className="text-gray-500">K/D Ratio:</span>
                <span className="font-bold text-green-600">
                  {matchesPlayed > 0 ? (totalKills / matchesPlayed).toFixed(2) : '0.00'}
                </span>
              </div>
              <div className="bg-[#f6f4fa] p-3 rounded-xl flex justify-between">
                <span className="text-gray-500">Total Winnings:</span>
                <span className="font-bold text-yellow-600">₹{amountWon}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'rewards' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-gray-200 space-y-3 text-center shadow-xl">
            <h3 className="font-extrabold text-base text-[#1b1530]">My Rewards</h3>
            <div className="py-6">
              <i className="fas fa-gift text-4xl text-yellow-500 mb-2"></i>
              <p className="text-xs text-gray-600">Daily Login Bonus & Referral Rewards</p>
              <p className="text-sm font-bold text-green-600 mt-2">Active Bonus: ₹{userData?.depositBalance || 0}</p>
            </div>
            <button
              onClick={() => setActiveModal('none')}
              className="w-full bg-[#e11d2e] text-white font-bold py-2.5 rounded-xl text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {activeModal === 'announcement' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-gray-200 space-y-3 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-[#1b1530]">Announcements</h3>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <div className="bg-[#f6f4fa] p-3 rounded-xl text-xs text-gray-700 space-y-1">
              <p className="font-bold text-[#e11d2e]">🎮 Welcome to ROYAL 11!</p>
              <p>Daily tournaments are active for Free Fire and BGMI. Winners receive instant cash prizes!</p>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'topPlayers' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-gray-200 space-y-3 shadow-xl">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-[#1b1530]">Top Elite Players</h3>
              <button onClick={() => setActiveModal('none')} className="text-gray-400 hover:text-black">✕</button>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="bg-[#f6f4fa] p-2.5 rounded-xl flex justify-between items-center">
                <span className="font-bold text-yellow-600">👑 #1 Thunder_X</span>
                <span className="font-black text-[#1b1530]">1,450 Kills</span>
              </div>
              <div className="bg-[#f6f4fa] p-2.5 rounded-xl flex justify-between items-center">
                <span className="font-bold text-gray-600">🥈 #2 Hunter_FF</span>
                <span className="font-black text-[#1b1530]">1,120 Kills</span>
              </div>
              <div className="bg-[#f6f4fa] p-2.5 rounded-xl flex justify-between items-center">
                <span className="font-bold text-orange-600">🥉 #3 GhostRider</span>
                <span className="font-black text-[#1b1530]">980 Kills</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeModal === 'language' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xs w-full p-5 border border-gray-200 space-y-3 shadow-xl text-center">
            <h3 className="font-extrabold text-base text-[#1b1530]">Language</h3>
            <p className="text-xs text-gray-500">App interface is configured in English</p>
            <button
              onClick={() => setActiveModal('none')}
              className="w-full py-2.5 bg-[#e11d2e] text-white font-bold rounded-xl text-xs"
            >
              English (Active)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
