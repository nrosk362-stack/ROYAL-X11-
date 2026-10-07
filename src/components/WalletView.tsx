import React, { useState } from 'react';
import { UserData, SettingsData, WalletTransaction } from '../types';

interface WalletViewProps {
  userData: UserData | null;
  settings: SettingsData;
  transactions: WalletTransaction[];
  onDepositSubmit: (amount: string) => Promise<void>;
  onWithdrawSubmit: (amount: string, method: 'playstore' | 'upi', target: string) => Promise<void>;
  onToast: (msg: string) => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  userData,
  settings,
  transactions,
  onDepositSubmit,
  onWithdrawSubmit,
  onToast
}) => {
  const [subModal, setSubModal] = useState<'none' | 'add' | 'withdraw'>('none');
  const [depositAmount, setDepositAmount] = useState('20');
  const [withdrawAmount, setWithdrawAmount] = useState('50');
  const [withdrawMethod, setWithdrawMethod] = useState<'playstore' | 'upi'>('playstore');
  const [withdrawTarget, setWithdrawTarget] = useState('');

  const totalBalance = Number((userData?.depositBalance || userData?.addBalance || 0) + (userData?.winningBalance || 0));
  const winBalance = Number(userData?.winningBalance || 0);
  const joinBalance = Number(userData?.depositBalance || userData?.addBalance || 0);

  // Auto Pay Deposit Handler (Instant, No Admin Approval)
  const handleProceedAutoDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(depositAmount);
    if (isNaN(val) || val < 10) {
      alert('Minimum deposit amount is ₹10.');
      return;
    }
    onDepositSubmit(depositAmount);
    setSubModal('none');
  };

  const handleProceedWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(withdrawAmount);
    if (isNaN(val) || val < 50) {
      alert('Minimum withdrawal amount is ₹50.');
      return;
    }
    if (val > 2000) {
      alert('Maximum withdrawal amount is ₹2,000. (Limit: ₹50 to ₹2,000)');
      return;
    }
    if (val > winBalance) {
      alert(`Insufficient win money balance! Available: ₹${winBalance.toFixed(2)}`);
      return;
    }
    if (!withdrawTarget.trim()) {
      alert('Please enter recipient email / UPI ID.');
      return;
    }
    onWithdrawSubmit(withdrawAmount, withdrawMethod, withdrawTarget.trim());
    setSubModal('none');
    setWithdrawAmount('50');
    setWithdrawTarget('');
  };

  return (
    <div className="min-h-screen bg-white text-[#1b1530] pb-24 px-4 pt-3 max-w-md mx-auto">
      {/* Header */}
      <h1 className="text-xl font-extrabold text-[#1b1530] mb-4">My Wallet</h1>

      {/* TOTAL BALANCE CARD */}
      <div className="bg-[#f6f4fa] rounded-2xl p-5 border border-[#ebe8f2] shadow-xs mb-4">
        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
          TOTAL BALANCE
        </p>

        {/* Big Lightning Coin Balance */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-xs">
            <span className="text-xl">⚡</span>
          </div>
          <span className="text-3xl font-black text-[#1b1530] tracking-tight">
            {totalBalance.toFixed(2)}
          </span>
        </div>

        {/* Win Money and Join Money row */}
        <div className="flex justify-between items-center text-xs text-gray-600 mb-5">
          <div className="flex items-center space-x-1.5">
            <span>Win money :</span>
            <span className="text-yellow-500">🪙</span>
            <span className="font-bold text-[#1b1530]">{winBalance.toFixed(2)}</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span>Join money :</span>
            <span className="text-yellow-500">🪙</span>
            <span className="font-bold text-[#1b1530]">{joinBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons: ADD & WITHDRAW */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSubModal('add')}
            className="bg-[#e11d2e] hover:bg-red-700 text-white font-extrabold py-3.5 rounded-2xl text-sm shadow-xs transition active:scale-95"
          >
            ADD
          </button>
          <button
            onClick={() => setSubModal('withdraw')}
            className="bg-white hover:bg-gray-50 border border-gray-300 text-[#1b1530] font-extrabold py-3.5 rounded-2xl text-sm transition active:scale-95"
          >
            WITHDRAW
          </button>
        </div>
      </div>

      {/* EARNINGS & PAYOUTS CARDS */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#f6f4fa] rounded-2xl p-4 border border-[#ebe8f2] shadow-xs text-center">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            Earnings
          </p>
          <p className="text-xl font-black text-[#1b1530]">
            {joinBalance.toFixed(2)}
          </p>
        </div>

        <div className="bg-[#f6f4fa] rounded-2xl p-4 border border-[#ebe8f2] shadow-xs text-center">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
            PAYOUTS
          </p>
          <p className="text-xl font-black text-[#1b1530]">
            {winBalance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* WALLET HISTORY */}
      <div className="space-y-3">
        <h2 className="text-sm font-black text-[#1b1530] uppercase tracking-wider mb-2">
          WALLET HISTORY
        </h2>

        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-xs">
            <i className="fas fa-history text-3xl mb-2 text-gray-300"></i>
            <p>No wallet history yet</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const isCredit = tx.amount > 0 || tx.type === 'deposit' || tx.type === 'credit';
            return (
              <div
                key={tx.id}
                className="bg-[#f6f4fa] rounded-2xl p-4 border border-[#ebe8f2] flex items-center justify-between shadow-xs"
              >
                {/* Left Badge: DEBIT / CREDIT */}
                <div className="w-16 flex-shrink-0">
                  <span
                    className={`font-black text-xs tracking-wider ${
                      isCredit ? 'text-green-600' : 'text-[#e11d2e]'
                    }`}
                  >
                    {isCredit ? 'CREDIT' : 'DEBIT'}
                  </span>
                </div>

                {/* Center Title & Date */}
                <div className="flex-1 min-w-0 px-2">
                  <p className="font-bold text-xs text-[#1b1530] truncate">
                    {tx.description || (isCredit ? 'Add Money to Join Wallet' : 'Match Joined')}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {tx.date || '2026-09-21'} {tx.time || ''}
                  </p>
                </div>

                {/* Right Amount & Balance */}
                <div className="text-right flex-shrink-0">
                  <p
                    className={`font-extrabold text-xs flex items-center justify-end gap-1 ${
                      isCredit ? 'text-green-600' : 'text-[#e11d2e]'
                    }`}
                  >
                    <span>{isCredit ? '+' : '-'}</span>
                    <span className="text-yellow-500">🪙</span>
                    <span>{Math.abs(tx.amount).toFixed(2)}</span>
                  </p>
                  <p className="text-[10px] text-gray-500 flex items-center justify-end gap-1 mt-0.5">
                    <span className="text-yellow-500 text-[9px]">🪙</span>
                    <span>{(tx.balanceAfter || totalBalance).toFixed(1)}</span>
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL: ADD MONEY (ONLY AUTO PAY SCANNER, 100% ENGLISH)                     */}
      {/* ========================================================================= */}
      {subModal === 'add' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-gray-200 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-base text-[#1b1530]">Add Money</h3>
                <p className="text-[10px] text-green-600 font-bold">⚡ Instant Auto Scanner Pay</p>
              </div>
              <button onClick={() => setSubModal('none')} className="text-gray-400 text-lg hover:text-black">✕</button>
            </div>

            <form onSubmit={handleProceedAutoDeposit} className="space-y-4">
              <div className="bg-[#f6f4fa] p-3.5 rounded-2xl border border-[#ebe8f2]">
                <span className="text-[10px] text-gray-500 uppercase font-bold block mb-1">
                  Enter Amount (Min ₹10)
                </span>
                <div className="flex items-center text-xl font-black text-[#1b1530]">
                  <span className="mr-1 text-gray-400">₹</span>
                  <input
                    type="number"
                    min="10"
                    value={depositAmount}
                    onChange={e => setDepositAmount(e.target.value)}
                    className="w-full bg-transparent focus:outline-none text-2xl font-black text-[#1b1530]"
                    placeholder="Min 10"
                    required
                  />
                </div>
              </div>

              {/* Quick amount chips */}
              <div className="flex gap-2">
                {['20', '50', '100', '200'].map(chip => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setDepositAmount(chip)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                      depositAmount === chip
                        ? 'bg-[#e11d2e] border-[#e11d2e] text-white shadow-xs'
                        : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    ₹{chip}
                  </button>
                ))}
              </div>

              <div className="bg-green-50 border border-green-200 p-3 rounded-xl text-[11px] text-green-800 flex items-center gap-2">
                <i className="fas fa-bolt text-yellow-500 text-sm"></i>
                <span>Direct Auto Pay: No waiting for manual approval. Instant wallet balance update!</span>
              </div>

              <button
                type="submit"
                className="w-full bg-[#e11d2e] hover:bg-red-700 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md transition active:scale-95"
              >
                PROCEED TO AUTO PAY ₹{depositAmount}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: WITHDRAW MONEY (100% ENGLISH)                                       */}
      {/* ========================================================================= */}
      {subModal === 'withdraw' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-gray-200 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base text-[#1b1530]">Withdraw Money</h3>
              <button onClick={() => setSubModal('none')} className="text-gray-400 text-lg hover:text-black">✕</button>
            </div>

            <div className="bg-[#f6f4fa] p-3 rounded-xl text-center border border-[#ebe8f2]">
              <p className="text-[10px] text-gray-500">Available Win Money</p>
              <p className="text-lg font-black text-green-600">₹{winBalance.toFixed(2)}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">* Limit: ₹50 to ₹2,000</p>
            </div>

            <form onSubmit={handleProceedWithdraw} className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                  Amount (₹50 to ₹2,000)
                </label>
                <input
                  type="number"
                  min="50"
                  max="2000"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="₹50 - ₹2,000"
                  className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-xl px-3 py-2 text-xs font-bold text-[#1b1530] focus:outline-none"
                  required
                />
              </div>

              {/* Quick Select Chips */}
              <div className="flex gap-1.5">
                {['50', '100', '500', '1000', '2000'].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setWithdrawAmount(amt)}
                    className={`flex-1 py-1 rounded-lg text-[10px] font-bold border transition ${
                      withdrawAmount === amt
                        ? 'bg-[#e11d2e] border-[#e11d2e] text-white'
                        : 'border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">
                  {withdrawMethod === 'playstore' ? 'Play Store Email' : 'UPI ID'}
                </label>
                <input
                  type="text"
                  value={withdrawTarget}
                  onChange={e => setWithdrawTarget(e.target.value)}
                  placeholder={withdrawMethod === 'playstore' ? 'user@gmail.com' : 'username@upi'}
                  className="w-full bg-[#f6f4fa] border border-[#ebe8f2] rounded-xl px-3 py-2 text-xs font-bold text-[#1b1530] focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs cursor-pointer text-gray-700">
                  <input
                    type="radio"
                    name="wType"
                    checked={withdrawMethod === 'playstore'}
                    onChange={() => setWithdrawMethod('playstore')}
                  />
                  <span>Play Store Card</span>
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer text-gray-700">
                  <input
                    type="radio"
                    name="wType"
                    checked={withdrawMethod === 'upi'}
                    onChange={() => setWithdrawMethod('upi')}
                  />
                  <span>UPI</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-[#e11d2e] hover:bg-red-700 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md active:scale-95 transition"
              >
                REQUEST WITHDRAWAL
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
