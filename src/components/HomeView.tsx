import React from 'react';
import { SettingsData, SliderItem, GameCategory } from '../types';

interface HomeViewProps {
  settings: SettingsData;
  sliderImages: SliderItem[];
  categories: Record<string, GameCategory>;
  gameMode: 'tournament' | 'solo';
  onGameModeChange: (mode: 'tournament' | 'solo') => void;
  totalBalance: number;
  onOpenWallet: () => void;
  onOpenSupport: () => void;
  onSelectCategory: (title: string, tab?: 'ongoing' | 'upcoming' | 'results') => void;
  onNoticeClick: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  settings,
  sliderImages,
  categories,
  gameMode,
  onGameModeChange,
  totalBalance,
  onOpenWallet,
  onOpenSupport,
  onSelectCategory,
  onNoticeClick
}) => {
  const activeBanners = sliderImages.filter(b => b.imageUrl);
  const categoriesList = Object.entries(categories);

  return (
    <div className="pb-24 bg-white text-[#1b1530] min-h-screen">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER (Matching Screenshot Exactly)                               */}
      {/* ========================================================================= */}
      <header className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 border-b border-[#ebe8f2] shadow-xs">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-black/10 flex-shrink-0 bg-gray-100 shadow-xs">
            <img
              src={settings.logo || 'https://plain-apac-prod-public.komododecks.com/202610/07/6yV4gzF8Htu4nBx2lHM7/image.png'}
              alt="Logo"
              className="w-full h-full object-cover"
              onError={(e: any) => {
                e.target.src = 'https://plain-apac-prod-public.komododecks.com/202610/07/6yV4gzF8Htu4nBx2lHM7/image.png';
              }}
            />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-normal leading-tight">Welcome Back,</p>
            <p className="text-[#e11d2e] font-extrabold text-base leading-tight truncate">
              {settings.appName || 'ROYAL 11'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          {/* Notification Bell */}
          <button
            onClick={onNoticeClick}
            className="relative w-8 h-8 rounded-full flex items-center justify-center text-[#1b1530] hover:bg-gray-100"
            aria-label="Notifications"
          >
            <i className="fas fa-bell text-lg"></i>
            <span className="absolute top-0 right-0 bg-[#e11d2e] text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </button>

          {/* Customer Support Headset */}
          <button
            onClick={onOpenSupport}
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-700 hover:bg-gray-100"
            aria-label="Customer Support"
          >
            <i className="fas fa-headset text-base"></i>
          </button>

          {/* Red Pill Coin Button (Matching Screenshot) */}
          <button
            onClick={onOpenWallet}
            className="flex items-center bg-[#e11d2e] hover:bg-red-700 rounded-full px-3 py-1 gap-1.5 text-white font-extrabold text-xs shadow-sm transition active:scale-95"
          >
            <span className="text-yellow-300 text-sm">⚡</span>
            <span>{Math.floor(totalBalance)}</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. NOTICE BAR (Matching Screenshot Exactly)                               */}
      {/* ========================================================================= */}
      <div className="px-4 mt-3">
        <div
          onClick={onNoticeClick}
          className="w-full flex items-stretch bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:border-gray-300 transition"
        >
          <div className="bg-[#e11d2e] px-4 flex items-center justify-center">
            <i className="fas fa-bullhorn text-white text-base"></i>
          </div>
          <div className="flex-1 py-3 px-3 text-center text-xs font-bold text-[#1b1530] tracking-wide truncate">
            {settings.rulesText || '[ ROYAL 11 RULES — CLICK HERE ]'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. HOME BANNER CAROUSEL                                                   */}
      {/* ========================================================================= */}
      {activeBanners.length > 0 && (
        <div className="px-4 mt-4">
          <div className="overflow-x-auto flex gap-3 snap-x snap-mandatory no-scrollbar">
            {activeBanners.map((banner, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (banner.link && /^https?:\/\//i.test(banner.link)) {
                    window.open(banner.link, '_blank');
                  }
                }}
                className="flex-shrink-0 w-full aspect-[2.1/1] rounded-2xl overflow-hidden bg-gray-100 border border-[#ebe8f2] shadow-sm snap-center cursor-pointer"
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title || 'Banner'}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MY MATCHES (Matching Screenshot Exactly)                               */}
      {/* ========================================================================= */}
      <div className="px-4 mt-5">
        <h2 className="text-center text-base font-extrabold text-[#1b1530] mb-3 tracking-wide">
          My Matches
        </h2>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Ongoing */}
          <button
            onClick={() => onSelectCategory('All Games', 'ongoing')}
            className="bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition shadow-xs hover:border-gray-300"
          >
            <span className="w-11 h-11 rounded-2xl bg-[#e11d2e] flex items-center justify-center shadow-xs">
              <i className="fas fa-sync-alt text-white text-base"></i>
            </span>
            <span className="text-[#1b1530] text-xs font-bold">Ongoing</span>
          </button>

          {/* Upcoming */}
          <button
            onClick={() => onSelectCategory('All Games', 'upcoming')}
            className="bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition shadow-xs hover:border-gray-300"
          >
            <span className="w-11 h-11 rounded-2xl bg-[#e11d2e] flex items-center justify-center shadow-xs">
              <i className="fas fa-calendar-alt text-white text-base"></i>
            </span>
            <span className="text-[#1b1530] text-xs font-bold">Upcoming</span>
          </button>

          {/* Completed */}
          <button
            onClick={() => onSelectCategory('All Games', 'results')}
            className="bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl py-4 flex flex-col items-center gap-2 active:scale-95 transition shadow-xs hover:border-gray-300"
          >
            <span className="w-11 h-11 rounded-2xl bg-[#e11d2e] flex items-center justify-center shadow-xs">
              <i className="fas fa-check text-white text-base"></i>
            </span>
            <span className="text-[#1b1530] text-xs font-bold">Completed</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. ESPORTS GAMES (Matching Screenshot Exactly)                            */}
      {/* ========================================================================= */}
      <div className="px-4 mt-6">
        <h2 className="text-center text-base font-extrabold text-[#1b1530] mb-3 tracking-wide">
          Esports Games
        </h2>

        {/* Segmented Switcher: TOURNAMENT / SOLO */}
        <div className="grid grid-cols-2 bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl p-1 mb-4">
          <button
            onClick={() => onGameModeChange('tournament')}
            className={`py-2 text-xs font-extrabold rounded-xl transition ${
              gameMode === 'tournament'
                ? 'bg-[#e11d2e] text-white shadow-xs'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            TOURNAMENT
          </button>
          <button
            onClick={() => onGameModeChange('solo')}
            className={`py-2 text-xs font-extrabold rounded-xl transition ${
              gameMode === 'solo'
                ? 'bg-[#e11d2e] text-white shadow-xs'
                : 'text-gray-500 hover:text-black'
            }`}
          >
            SOLO
          </button>
        </div>

        {/* 3-Column Games Grid or Empty Placeholder */}
        {categoriesList.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm font-semibold">
            No games available
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2.5">
            {categoriesList
              .filter(([_, g]) => {
                const isSolo = (g.type || g.mode || '').toLowerCase() === 'solo' || /solo/i.test(g.title);
                return gameMode === 'solo' ? isSolo : !isSolo;
              })
              .map(([key, game]) => (
                <div
                  key={key}
                  onClick={() => onSelectCategory(game.title)}
                  className="bg-[#f6f4fa] border border-[#ebe8f2] rounded-2xl overflow-hidden cursor-pointer shadow-xs hover:border-gray-300 transition active:scale-95 flex flex-col"
                >
                  <div className="w-full h-[95px] overflow-hidden bg-gray-200">
                    <img
                      src={game.imageUrl}
                      alt={game.title}
                      className="w-full h-full object-cover"
                      onError={(e: any) => {
                        e.target.src = 'https://plain-apac-prod-public.komododecks.com/202610/07/6yV4gzF8Htu4nBx2lHM7/image.png';
                      }}
                    />
                  </div>
                  <div className="text-[#1b1530] text-center font-extrabold text-xs py-2 px-1 truncate">
                    {game.title}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};
