import React, { useState, useRef, useEffect } from 'react';
import { 
  MoreHorizontal, 
  Share2, 
  Download, 
  Zap, 
  Moon, 
  Sun, 
  Trash2,
  PanelLeftOpen
} from 'lucide-react';
import { NexussFace } from './NexussFace';

interface TopNavProps {
  onExport: () => void;
  onShare: () => void;
  onUpgrade: () => void;
  onClearChat: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  hasMessages: boolean;
  onToggleSidebar?: () => void;
  showDecorations: boolean;
  onToggleDecorations: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onExport,
  onShare,
  onUpgrade,
  onClearChat,
  isDarkMode,
  onToggleDarkMode,
  hasMessages,
  onToggleSidebar,
  showDecorations,
  onToggleDecorations,
}) => {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="relative h-14 border-b border-zinc-800/80 px-3 sm:px-6 flex items-center justify-between select-none z-30 shrink-0 transition-all duration-300 backdrop-blur-md bg-[#0c0c0e]/95 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* LEFT: Mobile Sidebar Trigger */}
      <div className="flex items-center gap-2">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="md:hidden group relative w-9 h-9 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/30 flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
            title="Open chats & history"
          >
            {/* Normal: Nexuss Face Logo */}
            <div className="transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 flex items-center justify-center">
              <NexussFace size="xs" animated={false} />
            </div>
            {/* Hover: Window / Expand Icon */}
            <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 text-violet-300">
              <PanelLeftOpen className="w-4 h-4" />
            </div>
          </button>
        )}
      </div>

      {/* CENTER: Brand Nexuss AI */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2.5 pointer-events-none select-none">
        <div className="w-5 h-5 flex items-center justify-center">
          <NexussFace size="xs" animated={false} />
        </div>
        <span className="font-semibold text-sm sm:text-base tracking-tight text-white/95">
          Nexuss AI
        </span>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
      </div>

      {/* RIGHT: Actions Menu */}
      <div className="relative" ref={moreRef}>
        <button
          onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          className="text-zinc-400 hover:text-zinc-200 p-2 rounded-xl hover:bg-zinc-800/60 transition-colors cursor-pointer"
          title="More actions"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {moreMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#141418] border border-zinc-800 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
            {/* Actions Group */}
            <div className="px-2.5 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              Actions
            </div>

            <button
              onClick={() => {
                onExport();
                setMoreMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors cursor-pointer text-left"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export chat</span>
            </button>

            <button
              onClick={() => {
                onShare();
                setMoreMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors cursor-pointer text-left"
            >
              <Share2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Share link</span>
            </button>

            <button
              onClick={() => {
                onUpgrade();
                setMoreMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-violet-300 hover:bg-zinc-800 hover:text-violet-200 transition-colors cursor-pointer text-left"
            >
              <Zap className="w-3.5 h-3.5 text-violet-400" />
              <span>Upgrade to Pro</span>
            </button>

            <div className="h-px bg-zinc-800 my-1" />

            {/* Appearance & Workspace */}
            <button
              onClick={() => {
                onToggleDarkMode();
                setMoreMenuOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors cursor-pointer text-left"
            >
              {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-violet-400" />}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* HUD border toggle */}
            <button
              onClick={() => {
                onToggleDecorations();
                setMoreMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-zinc-300 hover:bg-zinc-800/60 hover:text-white transition-colors cursor-pointer text-left"
            >
              <span className="flex items-center gap-2.5">
                <span className="w-3.5 h-3.5 rounded-md bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-[8px] font-bold text-violet-300">H</span>
                <span>HUD Border Frame</span>
              </span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold transition-all duration-300 ${
                showDecorations ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {showDecorations ? 'ON' : 'OFF'}
              </span>
            </button>

            {hasMessages && (
              <button
                onClick={() => {
                  onClearChat();
                  setMoreMenuOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear conversation</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
