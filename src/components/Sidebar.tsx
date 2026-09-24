import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  PanelLeftClose, 
  PanelLeftOpen,
  Trash2,
  MessageSquare,
  Sparkles,
  Settings,
  ShieldCheck,
  Check,
  X,
  Clock
} from 'lucide-react';
import { ChatThread } from '../types';
import { NexussFace } from './NexussFace';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string, e: React.MouseEvent) => void;
  onOpenUpgrade?: () => void;
  showDecorations: boolean;
  onToggleDecorations: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onDeleteThread,
  onOpenUpgrade,
  showDecorations,
  onToggleDecorations,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [accountMenuOpen]);

  const filteredThreads = threads.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const todayThreads = filteredThreads.filter(t => t.dateGroup === 'Today');
  const yesterdayThreads = filteredThreads.filter(t => t.dateGroup === 'Yesterday');
  const weekThreads = filteredThreads.filter(t => t.dateGroup === '7 days');

  // ==========================================
  // ==========================================
  // COLLAPSED SIDEBAR (DESKTOP / TABLET FIXED)
  // ==========================================
  if (!isOpen) {
    return (
      <div className="hidden md:flex flex-col items-center py-3.5 px-2 bg-[#0c0c0e] border-r border-zinc-800/80 w-16 h-full justify-between select-none shrink-0 z-20 overflow-hidden">
        {/* Top Controls */}
        <div className="flex flex-col items-center gap-3.5 w-full">
          {/* Nexuss AI Icon / Expand Toggle */}
          <button 
            onClick={onToggle}
            className="group relative w-10 h-10 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-violet-500/30 flex items-center justify-center transition-all cursor-pointer shadow-xs"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            {/* Normal: Nexuss Face */}
            <div className="transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 flex items-center justify-center">
              <NexussFace size="xs" animated={false} />
            </div>
            {/* Hover: Expand Icon */}
            <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 text-violet-300">
              <PanelLeftOpen className="w-5 h-5" />
            </div>
          </button>
          
          {/* Quick New Chat Button */}
          <button
            onClick={onNewChat}
            className="w-10 h-10 rounded-xl bg-zinc-900 hover:bg-violet-600 text-zinc-300 hover:text-white border border-zinc-800 hover:border-violet-400/40 flex items-center justify-center transition-all shadow-sm cursor-pointer group"
            title="New Chat"
            aria-label="New Chat"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>

        {/* Pinned Bottom Avatar in Collapsed Mode */}
        <div className="relative group cursor-pointer pt-2">
          <div className="relative w-9 h-9 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-xs font-semibold text-white shadow-md ring-2 ring-violet-500/30 group-hover:ring-violet-400/50 transition-all">
            ES
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0c0c0e]" />
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // EXPANDED SIDEBAR (FIXED SHELL, SCROLLABLE HISTORY)
  // ==========================================
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        onClick={onToggle}
        className="absolute inset-0 bg-black/70 backdrop-blur-xs z-40 md:hidden transition-opacity"
        aria-hidden="true"
      />

      {/* 
        FIXED SIDEBAR CONTAINER:
        - Strict h-full, max-h-full, overflow-hidden
        - The sidebar frame itself NEVER scrolls.
        - Only the inner History Feed container scrolls.
      */}
      <aside className="absolute inset-y-0 left-0 z-50 md:relative md:inset-auto md:z-20 w-72 sm:w-76 bg-[#0c0c0e] border-r border-zinc-800/80 flex flex-col h-full max-h-full shrink-0 select-none shadow-2xl md:shadow-none overflow-hidden">
        
        {/* 1. PINNED HEADER (Shrink-0) */}
        <div className="px-3.5 pt-3.5 pb-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onToggle}
              className="group relative w-8 h-8 rounded-lg hover:bg-zinc-800 flex items-center justify-center transition-all cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              {/* Normal: Nexuss Face */}
              <div className="transition-all duration-200 group-hover:opacity-0 group-hover:scale-75 flex items-center justify-center">
                <NexussFace size="xs" animated={false} />
              </div>
              {/* Hover: Collapse Icon */}
              <div className="absolute inset-0 flex items-center justify-center transition-all duration-200 opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 text-violet-300">
                <PanelLeftClose className="w-4 h-4" />
              </div>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm sm:text-base text-zinc-100 tracking-tight font-display">
                Nexuss AI
              </span>
              <span className="px-1.5 py-0.2 rounded-md bg-violet-500/15 border border-violet-400/30 text-[9px] font-semibold text-violet-300 uppercase tracking-wider">
                Pro
              </span>
            </div>
          </div>

          <button
            onClick={onToggle}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title="Collapse sidebar"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* 2. PINNED NEW CHAT BUTTON (Shrink-0) */}
        <div className="px-3 pt-1 pb-2 shrink-0">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 1024) onToggle();
            }}
            className="w-full relative flex items-center justify-between py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-violet-500/40 text-zinc-100 font-medium text-xs sm:text-sm transition-all shadow-xs group cursor-pointer active:scale-[0.99]"
          >
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-lg bg-violet-500/15 border border-violet-400/30 flex items-center justify-center text-violet-300 group-hover:text-violet-200 group-hover:bg-violet-500/25 transition-colors">
                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform duration-200" />
              </div>
              <span className="tracking-tight">New chat</span>
            </div>
            <span className="text-[10px] text-zinc-500 group-hover:text-violet-300 font-mono transition-colors">
              ⌘N
            </span>
          </button>
        </div>

        {/* 3. PINNED SEARCH BAR (Shrink-0) */}
        <div className="px-3 pb-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700/80 rounded-xl pl-8 pr-7 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:bg-zinc-900 transition-all"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-zinc-500 hover:text-zinc-300 p-0.5"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            ) : (
              <span className="absolute right-2 text-[9px] text-zinc-500 font-mono bg-zinc-800/60 px-1 py-0.5 rounded border border-zinc-700/40">
                ⌘K
              </span>
            )}
          </div>
        </div>

        {/* Sub-header Divider */}
        <div className="px-3 shrink-0">
          <div className="h-px bg-zinc-800/60" />
        </div>

        {/* 
          4. STYLIZED SCROLLABLE HISTORY LIST (Flex-1 overflow-y-auto)
          This is the ONLY area that scrolls inside the sidebar.
        */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-4 min-h-0 text-xs">
          {filteredThreads.length === 0 ? (
            <div className="px-3 py-10 text-center text-zinc-500">
              <div className="w-10 h-10 mx-auto mb-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-violet-400/60">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-zinc-300 font-display">
                {searchQuery ? 'No matching conversations' : 'No chat history yet'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] mx-auto leading-relaxed">
                {searchQuery ? 'Try searching with another keyword' : 'Start your first prompt to generate and save threads'}
              </p>
            </div>
          ) : (
            <>
              {/* TODAY SECTION */}
              {todayThreads.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold text-zinc-400 uppercase tracking-wider font-display">
                    <span className="flex items-center gap-1 text-violet-400/90">
                      <Clock className="w-3 h-3 text-violet-400" />
                      Today
                    </span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-800/80 text-zinc-400">
                      {todayThreads.length}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {todayThreads.map((thread) => {
                      const isActive = activeThreadId === thread.id;
                      return (
                        <div
                          key={thread.id}
                          onClick={() => {
                            onSelectThread(thread.id);
                            if (window.innerWidth < 1024) onToggle();
                          }}
                          className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-zinc-800/90 border-violet-500/40 text-zinc-100 font-medium shadow-xs shadow-black/40'
                              : 'bg-transparent border-transparent hover:border-zinc-800 hover:bg-zinc-850/60 text-zinc-300 hover:text-zinc-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isActive ? 'bg-violet-400 shadow-xs shadow-violet-400' : 'bg-zinc-600 group-hover:bg-violet-400/60'
                            }`} />
                            <span className="truncate text-xs tracking-tight">
                              {thread.title}
                            </span>
                          </div>

                          <button
                            onClick={(e) => onDeleteThread(thread.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 p-1 rounded-md transition-all cursor-pointer shrink-0"
                            title="Delete thread"
                            aria-label="Delete thread"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* YESTERDAY SECTION */}
              {yesterdayThreads.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-display">
                    <span>Yesterday</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-800/80 text-zinc-400">
                      {yesterdayThreads.length}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {yesterdayThreads.map((thread) => {
                      const isActive = activeThreadId === thread.id;
                      return (
                        <div
                          key={thread.id}
                          onClick={() => {
                            onSelectThread(thread.id);
                            if (window.innerWidth < 1024) onToggle();
                          }}
                          className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-zinc-800/90 border-violet-500/40 text-zinc-100 font-medium shadow-xs shadow-black/40'
                              : 'bg-transparent border-transparent hover:border-zinc-800 hover:bg-zinc-850/60 text-zinc-400 hover:text-zinc-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isActive ? 'bg-violet-400' : 'bg-zinc-700 group-hover:bg-violet-400/60'
                            }`} />
                            <span className="truncate text-xs tracking-tight">
                              {thread.title}
                            </span>
                          </div>

                          <button
                            onClick={(e) => onDeleteThread(thread.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 p-1 rounded-md transition-all cursor-pointer shrink-0"
                            title="Delete thread"
                            aria-label="Delete thread"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PREVIOUS 7 DAYS SECTION */}
              {weekThreads.length > 0 && (
                <div>
                  <div className="px-2 pb-1.5 flex items-center justify-between text-[10px] font-semibold text-zinc-500 uppercase tracking-wider font-display">
                    <span>Previous 7 days</span>
                    <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-zinc-800/80 text-zinc-400">
                      {weekThreads.length}
                    </span>
                  </div>
                  
                  <div className="space-y-1">
                    {weekThreads.map((thread) => {
                      const isActive = activeThreadId === thread.id;
                      return (
                        <div
                          key={thread.id}
                          onClick={() => {
                            onSelectThread(thread.id);
                            if (window.innerWidth < 1024) onToggle();
                          }}
                          className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-left cursor-pointer transition-all border ${
                            isActive
                              ? 'bg-zinc-800/90 border-violet-500/40 text-zinc-100 font-medium shadow-xs shadow-black/40'
                              : 'bg-transparent border-transparent hover:border-zinc-800 hover:bg-zinc-850/60 text-zinc-400 hover:text-zinc-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              isActive ? 'bg-violet-400' : 'bg-zinc-700 group-hover:bg-violet-400/60'
                            }`} />
                            <span className="truncate text-xs tracking-tight">
                              {thread.title}
                            </span>
                          </div>

                          <button
                            onClick={(e) => onDeleteThread(thread.id, e)}
                            className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 p-1 rounded-md transition-all cursor-pointer shrink-0"
                            title="Delete thread"
                            aria-label="Delete thread"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 
          5. ELEVATED PINNED BOTTOM ACCOUNT CARD (Shrink-0, mt-auto)
          Anchored securely at the base with elevated styling.
        */}
        <div className="p-2.5 border-t border-zinc-800/80 bg-[#0c0c0e]/95 backdrop-blur-md shrink-0 mt-auto relative" ref={accountMenuRef}>
          {/* Account Card Trigger */}
          <div 
            onClick={() => setAccountMenuOpen(!accountMenuOpen)}
            className="flex items-center justify-between p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer group shadow-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Dual-ring Glowing Avatar */}
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 via-indigo-600 to-purple-500 flex items-center justify-center text-white text-xs font-semibold shrink-0 ring-2 ring-violet-400/30 group-hover:ring-violet-400/50 shadow-sm transition-all">
                ES
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0c0c0e]" />
              </div>
              
              <div className="min-w-0 truncate">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-zinc-100 group-hover:text-white transition-colors truncate font-display">
                    Emerson Sterling
                  </span>
                  <span className="px-1 py-0.2 rounded bg-gradient-to-r from-violet-600 to-indigo-600 text-[8px] font-bold text-white tracking-wider">
                    PRO
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 truncate">
                  sterlingr@gmail.com
                </div>
              </div>
            </div>

            <div className="p-1 rounded-lg text-zinc-400 group-hover:text-violet-300 transition-colors">
              <Settings className="w-3.5 h-3.5 group-hover:rotate-45 transition-transform duration-200" />
            </div>
          </div>

          {/* Elevated Account Settings Popover */}
          {accountMenuOpen && (
            <div className="absolute bottom-full left-2.5 right-2.5 mb-2 p-2 rounded-2xl bg-[#141418] border border-zinc-800 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
              <div className="px-2.5 py-2 border-b border-zinc-800/80 mb-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-100">Nexuss Account</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1">
                    <Check className="w-2.5 h-2.5" /> Active
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-0.5">Workspace Cloud Sync Enabled</p>
              </div>

              <div className="space-y-1.5 text-xs">
                {onOpenUpgrade && (
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onOpenUpgrade();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-zinc-800 text-violet-300 hover:text-violet-200 transition-colors text-left cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span>Manage Pro Subscription</span>
                  </button>
                )}

                {/* HUD Decoration Toggle */}
                <div className="flex items-center justify-between px-2.5 py-2 rounded-xl border border-zinc-800/60 bg-zinc-900/60">
                  <div className="flex flex-col text-left">
                    <span className="text-[11px] font-medium text-zinc-300">HUD Window Border</span>
                    <span className="text-[9px] text-zinc-500">Futuristic framing lines</span>
                  </div>
                  <button
                    type="button"
                    onClick={onToggleDecorations}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      showDecorations ? 'bg-violet-600 border-violet-500' : 'bg-zinc-800 border-zinc-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        showDecorations ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl text-zinc-400 text-[11px]">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Data Privacy</span>
                  </span>
                  <span className="text-[10px] text-zinc-500">Encrypted</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </aside>
    </>
  );
};
