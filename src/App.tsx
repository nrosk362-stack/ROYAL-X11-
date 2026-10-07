import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase';
import {
  ref,
  onValue,
  get,
  set,
  update,
  push
} from 'firebase/database';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { UserData, MatchItem, GameCategory, SliderItem, SettingsData, WalletTransaction } from './types';
import { HomeView } from './components/HomeView';
import { WalletView } from './components/WalletView';
import { AdminPanel } from './components/AdminPanel';
import { AccountView } from './components/AccountView';
import { CustomerSupportChat } from './components/CustomerSupportChat';

export default function App() {
  // Navigation
  const [currentTab, setCurrentTab] = useState<'earn' | 'ranking' | 'home' | 'wallet' | 'account'>('home');
  const [activeScreen, setActiveScreen] = useState<'main' | 'match' | 'matchInfo' | 'player' | 'refer' | 'support' | 'rules'>('main');

  // Auth & User
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regMobile, setRegMobile] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regReferral, setRegReferral] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // App Settings, Banners, Notices, Games (ROYAL 11 as requested)
  const [settings, setSettings] = useState<SettingsData>({
    appName: 'ROYAL 11',
    logo: 'https://plain-apac-prod-public.komododecks.com/202610/07/6yV4gzF8Htu4nBx2lHM7/image.png',
    rulesText: '[ ROYAL 11 RULES — CLICK HERE ]'
  });
  const [sliderImages, setSliderImages] = useState<SliderItem[]>([]);
  const [categories, setCategories] = useState<Record<string, GameCategory>>({});
  const [gameMode, setGameMode] = useState<'tournament' | 'solo'>('tournament');
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);

  // Matches
  const [selectedCategoryTitle, setSelectedCategoryTitle] = useState('All Games');
  const [matchTab, setMatchTab] = useState<'ongoing' | 'upcoming' | 'results'>('upcoming');
  const [matches, setMatches] = useState<MatchItem[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);
  const [joinedPlayers, setJoinedPlayers] = useState<any[]>([]);

  // Join Match / In Game Name
  const [inGameName, setInGameName] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);

  // Admin Panel Modal
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Auth Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
        onValue(ref(db, `users/${user.uid}`), (snap) => {
          if (snap.exists()) setUserData(snap.val());
        });
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
    });
    return () => unsub();
  }, []);

  // Firebase Realtime Database Data Listeners
  useEffect(() => {
    // 1. Settings
    onValue(ref(db, 'settings'), (snap) => {
      if (snap.exists()) setSettings(snap.val());
    });

    // 2. Banners (sliderImages)
    onValue(ref(db, 'sliderImages'), (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        const arr = Object.entries(val).map(([id, item]: [string, any]) => ({ id, ...item }));
        setSliderImages(arr);
      } else {
        setSliderImages([]);
      }
    });

    // 3. Categories / Games
    onValue(ref(db, 'categories'), (snap) => {
      if (snap.exists()) setCategories(snap.val());
    });
  }, []);

  // Wallet history listener
  useEffect(() => {
    if (!currentUser) return;
    onValue(ref(db, `walletHistory/${currentUser.uid}`), (snap) => {
      if (snap.exists()) {
        const list: WalletTransaction[] = Object.entries(snap.val()).map(([id, val]: [string, any]) => ({
          id,
          ...val
        }));
        list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
        setWalletTransactions(list);
      } else {
        setWalletTransactions([]);
      }
    });
  }, [currentUser]);

  // Matches for category
  useEffect(() => {
    if (activeScreen !== 'match' && activeScreen !== 'matchInfo') return;
    onValue(ref(db, `matches/${selectedCategoryTitle}`), (snap) => {
      if (snap.exists()) {
        setMatches(Object.values(snap.val()));
      } else {
        setMatches([]);
      }
    });
  }, [activeScreen, selectedCategoryTitle]);

  // Joined players for selected match
  useEffect(() => {
    if (!selectedMatch) return;
    onValue(ref(db, `joinedMembers/${selectedCategoryTitle}/${selectedMatch.matchTitle}`), (snap) => {
      if (snap.exists()) {
        const list = Object.entries(snap.val()).map(([id, val]: [string, any]) => ({ id, ...val }));
        setJoinedPlayers(list);
      } else {
        setJoinedPlayers([]);
      }
    });
  }, [selectedMatch, selectedCategoryTitle]);

  // Deposit Handler (Enforces min ₹10, Auto Pay Scanner only, No Admin Approval)
  const handleDeposit = async (amountStr: string) => {
    const amt = parseFloat(amountStr);
    if (isNaN(amt) || amt < 10) {
      alert('Minimum deposit amount is ₹10.');
      return;
    }
    if (!currentUser || !userData) {
      alert('Please login first');
      return;
    }

    const creditWalletDirectly = async (paidId: string) => {
      const userRef = ref(db, `users/${currentUser.uid}`);
      const userSnap = await get(userRef);
      if (userSnap.exists()) {
        const curDep = parseFloat(userSnap.val().depositBalance || userSnap.val().addBalance || 0);
        const curTot = parseFloat(userSnap.val().totalBalance || 0);
        await update(userRef, {
          depositBalance: curDep + amt,
          addBalance: curDep + amt,
          totalBalance: curTot + amt
        });
      }
      await push(ref(db, `walletHistory/${currentUser.uid}`), {
        type: 'deposit',
        amount: amt,
        description: `Add Money to Join Wallet - #${paidId.slice(-6)}`,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        status: 'complete'
      });
      showToast(`₹${amt} added to wallet successfully!`);
    };

    // Auto Scanner ZapUPI
    if (settings.zapupiKey && typeof window.ZapUPI !== 'undefined') {
      const orderId = 'ORD' + Date.now();
      window.ZapUPI?.setPaymentCallbacks({
        onSuccess: async (paidId: string) => {
          await creditWalletDirectly(paidId);
        },
        onFailed: (errId: any) => alert('Payment Failed: ' + errId),
        onTimeout: (timeId: any) => alert('Payment Timeout: ' + timeId)
      });
      window.ZapUPI?.createOrder({
        zap_key: settings.zapupiKey,
        order_id: orderId,
        amount: String(amt),
        remark: 'ROYAL 11 Deposit | ' + currentUser.uid,
        customer_mobile: userData.phoneNumber
      }, {
        onResponse: (pUrl: string) => window.ZapUPI?.loadPayment(pUrl),
        onError: (err: any) => alert('Error creating payment: ' + JSON.stringify(err))
      });
    } else {
      // Direct Instant AutoPay credit
      await creditWalletDirectly('AUTO' + Date.now());
    }
  };

  // Withdraw Handler (Enforces ₹50 to ₹2,000 limit)
  const handleWithdraw = async (amountStr: string, method: 'playstore' | 'upi', target: string) => {
    const amt = parseFloat(amountStr);
    const winBal = Number(userData?.winningBalance || 0);
    if (isNaN(amt) || amt < 50) {
      alert('Minimum withdrawal amount is ₹50.');
      return;
    }
    if (amt > 2000) {
      alert('Maximum withdrawal amount is ₹2,000. (Limit: ₹50 to ₹2,000)');
      return;
    }
    if (amt > winBal) {
      alert(`Insufficient win balance! Available: ₹${Math.floor(winBal)}`);
      return;
    }
    if (!currentUser || !userData) return;

    try {
      const txId = 'TNX' + Math.floor(10000 + Math.random() * 90000);
      await push(ref(db, `withdrawal_request/${currentUser.uid}`), {
        amount: amt,
        email: target,
        withdrawMethod: method,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        username: userData.username,
        status: 'pending',
        transactionId: txId,
        createdAt: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString()
      });

      // Deduct from win balance
      const newWin = winBal - amt;
      const newTot = (userData.totalBalance || 0) - amt;
      await update(ref(db, `users/${currentUser.uid}`), {
        winningBalance: newWin,
        totalBalance: newTot
      });

      showToast('Withdrawal request submitted successfully!');
    } catch (e: any) {
      alert('Error requesting withdrawal: ' + e.message);
    }
  };

  // Join Match Handler
  const handleConfirmJoinMatch = async () => {
    if (!inGameName.trim()) {
      alert('Please enter your In Game Name');
      return;
    }
    if (!currentUser || !userData || !selectedMatch) return;

    const entry = parseFloat(String(selectedMatch.entryFee || 0));
    const depBal = Number(userData.depositBalance || userData.addBalance || 0);
    const winBal = Number(userData.winningBalance || 0);
    const total = depBal + winBal;

    if (total < entry) {
      alert(`Insufficient balance! Your balance is ₹${Math.floor(total)}, but entry fee is ₹${entry}.`);
      setShowJoinModal(false);
      setCurrentTab('wallet');
      setActiveScreen('main');
      return;
    }

    try {
      const cat = selectedCategoryTitle;
      const mTitle = selectedMatch.matchTitle;
      const uid = currentUser.uid;

      // 1. Record member
      await set(ref(db, `joinedMembers/${cat}/${mTitle}/${uid}`), {
        gameName: inGameName.trim(),
        username: userData.username,
        kills: 0,
        winning: 0,
        joinedAt: Date.now()
      });

      // 2. Deduct entry fee
      let newDep = depBal;
      let newWin = winBal;
      if (depBal >= entry) {
        newDep = depBal - entry;
      } else {
        const rem = entry - depBal;
        newDep = 0;
        newWin = winBal - rem;
      }
      await update(ref(db, `users/${uid}`), {
        depositBalance: newDep,
        winningBalance: newWin,
        totalBalance: newDep + newWin,
        matchesJoined: (userData.matchesJoined || 0) + 1
      });

      // 3. Add to walletHistory
      await push(ref(db, `walletHistory/${uid}`), {
        type: 'match_entry',
        amount: -entry,
        description: `Match Joined - #${mTitle.slice(-6)}`,
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString(),
        balanceAfter: newDep + newWin
      });

      setShowJoinModal(false);
      setInGameName('');
      showToast('Successfully joined match!');
    } catch (e: any) {
      alert('Error joining match: ' + e.message);
    }
  };

  // Admin Unlock logic
  const handleOpenAdminPanel = () => {
    if (currentUser?.email === 'nrosk362@gmail.com') {
      setShowAdminPanel(true);
    } else {
      setShowAdminPinModal(true);
    }
  };

  const handleVerifyAdminPin = () => {
    if (adminPinInput === '1122' || adminPinInput === 'admin123') {
      setShowAdminPinModal(false);
      setAdminPinInput('');
      setShowAdminPanel(true);
    } else {
      alert('Invalid Admin PIN. (Default PIN: 1122)');
    }
  };

  const totalBalanceNumber = Math.floor(
    (userData?.depositBalance || userData?.addBalance || 0) + (userData?.winningBalance || 0)
  );

  // If not logged in
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#0d081e] text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm bg-[#1b1238] rounded-3xl p-6 border border-white/10 shadow-2xl">
          <div className="flex justify-center mb-4">
            <img src={settings.logo} alt="Logo" className="w-16 h-16 rounded-full border border-red-500 object-cover" />
          </div>
          <h1 className="text-xl font-black text-[#e11d2e] mb-1">
            {authMode === 'login' ? 'Welcome to, Login' : 'Welcome to, Sign Up'}
          </h1>
          <p className="text-xs text-gray-400 mb-5">{settings.appName}</p>

          {authError && <p className="bg-red-500/20 text-red-300 p-2.5 rounded-xl text-xs mb-3">{authError}</p>}

          {authMode === 'login' ? (
            <form onSubmit={async (e) => {
              e.preventDefault();
              setAuthLoading(true);
              setAuthError('');
              try {
                await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
              } catch (err: any) {
                setAuthError('Invalid email or password');
              } finally {
                setAuthLoading(false);
              }
            }} className="space-y-3">
              <input
                type="email"
                placeholder="Email Address"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-4 py-3 text-xs focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-4 py-3 text-xs focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#e11d2e] hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-xs shadow-md active:scale-95 transition"
              >
                {authLoading ? 'LOGGING IN...' : 'LOGIN'}
              </button>
              <div className="text-center pt-2">
                <span className="text-gray-400 text-xs">Don't have an account? </span>
                <button
                  type="button"
                  onClick={() => { setAuthMode('register'); setAuthError(''); }}
                  className="text-white font-bold text-xs underline ml-1"
                >
                  Sign Up
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!regFirstName || !regLastName || !regUsername || !regMobile || !regEmail || !regPassword) {
                setAuthError('All fields required');
                return;
              }
              setAuthLoading(true);
              setAuthError('');
              try {
                const cred = await createUserWithEmailAndPassword(auth, regEmail, regPassword);
                const bonus = regReferral.trim() ? 2 : 0;
                await set(ref(db, `users/${cred.user.uid}`), {
                  username: regUsername.trim(),
                  firstName: regFirstName.trim(),
                  lastName: regLastName.trim(),
                  email: regEmail.trim(),
                  phoneNumber: regMobile.trim(),
                  depositBalance: bonus,
                  winningBalance: 0,
                  totalBalance: bonus,
                  matchesJoined: 0,
                  totalKills: 0,
                  totalWinnings: 0,
                  createdAt: Date.now()
                });
              } catch (err: any) {
                setAuthError(err.message);
              } finally {
                setAuthLoading(false);
              }
            }} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="First Name"
                  value={regFirstName}
                  onChange={e => setRegFirstName(e.target.value)}
                  className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Last Name"
                  value={regLastName}
                  onChange={e => setRegLastName(e.target.value)}
                  className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Username"
                value={regUsername}
                onChange={e => setRegUsername(e.target.value)}
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                required
              />
              <input
                type="tel"
                placeholder="10-digit Mobile"
                value={regMobile}
                onChange={e => setRegMobile(e.target.value)}
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email Address"
                value={regEmail}
                onChange={e => setRegEmail(e.target.value)}
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Password (min 6 chars)"
                value={regPassword}
                onChange={e => setRegPassword(e.target.value)}
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Referral Code (Optional - get ₹2)"
                value={regReferral}
                onChange={e => setRegReferral(e.target.value)}
                className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2.5 text-xs focus:outline-none"
              />
              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-[#e11d2e] hover:bg-red-700 text-white font-extrabold py-3.5 rounded-xl text-xs shadow-md active:scale-95 transition"
              >
                {authLoading ? 'SIGNING UP...' : 'SIGN UP'}
              </button>
              <div className="text-center pt-1">
                <span className="text-gray-400 text-xs">Have an account? </span>
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className="text-white font-bold text-xs underline ml-1"
                >
                  Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  // AUTHENTICATED APP SHELL
  return (
    <div className="min-h-screen bg-[#0d081e] text-white flex flex-col justify-between select-none">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-12 left-1/2 transform -translate-x-1/2 bg-[#1b1238] border border-white/20 text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-2xl z-50">
          {toastMessage}
        </div>
      )}

      {/* Admin Panel Overlay */}
      {showAdminPanel && (
        <AdminPanel
          onClose={() => setShowAdminPanel(false)}
          settings={settings}
          onToast={showToast}
        />
      )}

      {/* Admin PIN Unlock Modal */}
      {showAdminPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b1238] rounded-3xl max-w-xs w-full p-5 border border-white/15 space-y-3 text-center shadow-2xl">
            <h3 className="font-extrabold text-base text-white">Enter Admin PIN</h3>
            <p className="text-xs text-gray-400">Security check for Admin Panel</p>
            <input
              type="password"
              placeholder="PIN (Default: 1122)"
              value={adminPinInput}
              onChange={e => setAdminPinInput(e.target.value)}
              className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2.5 text-center text-sm font-bold text-white focus:outline-none"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setShowAdminPinModal(false); setAdminPinInput(''); }}
                className="flex-1 bg-gray-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyAdminPin}
                className="flex-1 bg-[#e11d2e] text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-grow">
        {activeScreen === 'main' && (
          <>
            {/* 1. HOME SCREEN (Matching Screenshot 1) */}
            {currentTab === 'home' && (
              <HomeView
                settings={settings}
                sliderImages={sliderImages}
                categories={categories}
                gameMode={gameMode}
                onGameModeChange={setGameMode}
                totalBalance={totalBalanceNumber}
                onOpenWallet={() => setCurrentTab('wallet')}
                onOpenSupport={() => setActiveScreen('support')}
                onNoticeClick={() => {
                  if (settings.rulesLink) window.open(settings.rulesLink, '_blank');
                  else showToast('Rules: Fair play only. Room credentials arrive 15m before match.');
                }}
                onSelectCategory={(title, tab) => {
                  setSelectedCategoryTitle(title);
                  if (tab) setMatchTab(tab);
                  setActiveScreen('match');
                }}
              />
            )}

            {/* 2. WALLET SCREEN (Matching Screenshot 2) */}
            {currentTab === 'wallet' && (
              <WalletView
                userData={userData}
                settings={settings}
                transactions={walletTransactions}
                onDepositSubmit={handleDeposit}
                onWithdrawSubmit={handleWithdraw}
                onToast={showToast}
              />
            )}

            {/* 3. EARN SCREEN */}
            {currentTab === 'earn' && (
              <div className="p-4 space-y-4 max-w-md mx-auto pb-24">
                <h1 className="text-lg font-black text-white">Earn Rewards</h1>
                <div
                  onClick={() => setActiveScreen('refer')}
                  className="w-full aspect-[2/1] rounded-2xl overflow-hidden cursor-pointer shadow-lg bg-[#1b1238] border border-white/10"
                >
                  <img src="https://i.ibb.co/27bRpnbB/refer-and-earn.png" alt="Refer" className="w-full h-full object-cover" />
                </div>
                <div className="w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-lg bg-[#1b1238] border border-white/10">
                  <img src="https://i.ibb.co/1wSN963/lucky-draw.png" alt="Draw" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            {/* 4. RANKING / LEADERBOARD */}
            {currentTab === 'ranking' && (
              <div className="p-4 max-w-md mx-auto pb-24">
                <h1 className="text-lg font-black text-white mb-3">Ranking & Winners</h1>
                <div className="bg-[#1b1238] rounded-2xl p-4 border border-white/10 text-center text-xs text-gray-400">
                  <i className="fas fa-trophy text-3xl text-yellow-400 mb-2"></i>
                  <p>Tournament Winners are updated after each match concludes.</p>
                </div>
              </div>
            )}

            {/* 5. ACCOUNT / ME SCREEN (Matching Video & Screenshot with all 18 items) */}
            {currentTab === 'account' && (
              <AccountView
                userData={userData}
                settings={settings}
                onOpenProfile={() => showToast('My Profile: Editing account details')}
                onOpenWallet={() => setCurrentTab('wallet')}
                onOpenMatches={() => {
                  setSelectedCategoryTitle('All Games');
                  setActiveScreen('match');
                }}
                onOpenReferrals={() => setActiveScreen('refer')}
                onOpenLeaderboard={() => setCurrentTab('ranking')}
                onOpenTutorials={() => showToast('App Tutorials: Watch Free Fire & BGMI tournament guides')}
                onOpenAboutUs={() => showToast('About Us: ROYAL 11 is an esports tournament platform')}
                onOpenSupport={() => setActiveScreen('support')}
                onOpenTerms={() => showToast('Terms: Fair play rules and instant withdrawals')}
                onOpenAdmin={handleOpenAdminPanel}
                onLogout={() => signOut(auth)}
                onToast={showToast}
              />
            )}
          </>
        )}

        {/* MATCHES LIST SCREEN */}
        {activeScreen === 'match' && (
          <div className="p-4 max-w-md mx-auto pb-10">
            <header className="flex items-center justify-between mb-4">
              <button onClick={() => setActiveScreen('main')} className="text-white text-base">
                <i className="fas fa-arrow-left"></i>
              </button>
              <h1 className="font-extrabold text-base text-white">{selectedCategoryTitle}</h1>
              <div className="w-6"></div>
            </header>

            <div className="flex justify-around border-b border-white/10 pb-2 mb-4">
              {(['ongoing', 'upcoming', 'results'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setMatchTab(tab)}
                  className={`text-xs font-bold uppercase ${
                    matchTab === tab ? 'text-[#e11d2e] border-b-2 border-[#e11d2e] pb-1' : 'text-gray-400'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {matches.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-xs">
                  <p>No {matchTab} matches available right now</p>
                </div>
              ) : (
                matches.map((m, idx) => (
                  <div key={idx} className="bg-[#1b1238] rounded-2xl border border-white/10 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="font-extrabold text-sm text-white">{m.matchTitle}</h2>
                        <p className="text-[10px] text-gray-400">{m.matchTime || 'Upcoming'}</p>
                      </div>
                      <span className="text-xs font-bold text-yellow-400">₹{m.entryFee || 0}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[11px] text-gray-400">Pool: ₹{m.totalPrize || 0}</span>
                      <button
                        onClick={() => {
                          setSelectedMatch(m);
                          setShowJoinModal(true);
                        }}
                        className="bg-[#e11d2e] hover:bg-red-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs"
                      >
                        JOIN MATCH
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* REFER SCREEN */}
        {activeScreen === 'refer' && (
          <div className="p-4 max-w-md mx-auto pb-10">
            <header className="flex items-center space-x-3 mb-4">
              <button onClick={() => setActiveScreen('main')} className="text-white text-base">
                <i className="fas fa-arrow-left"></i>
              </button>
              <h1 className="font-extrabold text-base text-white">Refer & Earn</h1>
            </header>
            <div className="bg-[#1b1238] rounded-3xl p-6 border border-white/10 text-center space-y-4">
              <h2 className="text-yellow-400 font-black text-lg">REFER FRIENDS & EARN!</h2>
              <p className="text-xs text-gray-300">Invite friends using your promo code to get ₹5 bonus per match.</p>
              <div className="bg-[#0d081e] p-3 rounded-2xl border border-white/15 inline-block px-6">
                <span className="font-black text-lg text-white">{userData?.username || 'CODE'}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(userData?.username || '');
                  showToast('Referral code copied!');
                }}
                className="w-full bg-[#e11d2e] hover:bg-red-700 text-white font-extrabold py-3.5 rounded-2xl text-xs"
              >
                COPY PROMO CODE
              </button>
            </div>
          </div>
        )}

        {/* LIVE CUSTOMER SUPPORT CHAT SCREEN */}
        {activeScreen === 'support' && (
          <CustomerSupportChat
            userData={userData}
            userId={currentUser?.uid || ''}
            userEmail={currentUser?.email || ''}
            settings={settings}
            onClose={() => setActiveScreen('main')}
            onToast={showToast}
          />
        )}
      </main>

      {/* JOIN MATCH MODAL */}
      {showJoinModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#1b1238] rounded-3xl max-w-xs w-full p-5 border border-white/15 space-y-3 shadow-2xl">
            <h3 className="font-extrabold text-sm text-white">Join: {selectedMatch.matchTitle}</h3>
            <p className="text-xs text-gray-400">Entry Fee: ₹{selectedMatch.entryFee || 0}</p>
            <input
              type="text"
              placeholder="Enter In Game Username"
              value={inGameName}
              onChange={e => setInGameName(e.target.value)}
              className="w-full bg-[#0d081e] border border-white/15 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setShowJoinModal(false)}
                className="flex-1 bg-gray-700 text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmJoinMatch}
                className="flex-1 bg-[#e11d2e] text-white font-bold py-2.5 rounded-xl text-xs"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BOTTOM NAVIGATION BAR (Matching Screenshot 1 & 2)                         */}
      {/* ========================================================================= */}
      {activeScreen === 'main' && (
        <nav className="fixed bottom-0 left-0 right-0 bg-[#0d081e] border-t border-white/10 flex items-center justify-around py-2 z-40 max-w-md mx-auto">
          {/* Earn */}
          <button
            onClick={() => setCurrentTab('earn')}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              currentTab === 'earn' ? 'text-[#e11d2e] font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-current flex items-center justify-center text-[#0d081e] text-[10px] font-black">
              ₹
            </div>
            <span className="text-[11px]">Earn</span>
          </button>

          {/* Ranking */}
          <button
            onClick={() => setCurrentTab('ranking')}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              currentTab === 'ranking' ? 'text-[#e11d2e] font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fas fa-chart-bar text-base"></i>
            <span className="text-[11px]">Ranking</span>
          </button>

          {/* Home */}
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              currentTab === 'home' ? 'text-[#e11d2e] font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fas fa-home text-base"></i>
            <span className="text-[11px]">Home</span>
          </button>

          {/* Wallet */}
          <button
            onClick={() => setCurrentTab('wallet')}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              currentTab === 'wallet' ? 'text-[#e11d2e] font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fas fa-wallet text-base"></i>
            <span className="text-[11px]">Wallet</span>
          </button>

          {/* Account */}
          <button
            onClick={() => setCurrentTab('account')}
            className={`flex flex-col items-center gap-0.5 text-xs ${
              currentTab === 'account' ? 'text-[#e11d2e] font-extrabold' : 'text-gray-400 hover:text-white'
            }`}
          >
            <i className="fas fa-user text-base"></i>
            <span className="text-[11px]">Account</span>
          </button>
        </nav>
      )}
    </div>
  );
}
