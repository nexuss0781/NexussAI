import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  MoreHorizontal, 
  Share2, 
  Download, 
  Zap, 
  Moon, 
  Sun, 
  Trash2,
  Cpu,
  Sparkles,
  PanelLeftOpen
} from 'lucide-react';
import { NexussFace } from './NexussFace';

interface TopNavProps {
  currentModel: string;
  onSelectModel: (model: string) => void;
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
  currentModel,
  onSelectModel,
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
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const models = [
    { 
      id: 'auto', 
      label: 'OmniRoute Auto', 
      desc: 'Intelligent multi-model dynamic router across top frontier providers',
      badge: 'Smart',
      icon: Sparkles
    },
    { 
      id: 'gemini-3.8-flash', 
      label: 'Nexuss 3.8 Flash', 
      desc: 'Ultra-fast low-latency responses & deep context reasoning',
      badge: 'Fast',
      icon: Cpu
    },
    { 
      id: 'deep-research', 
      label: 'Deep Research Agent', 
      desc: 'Extended chain-of-thought analysis with multi-angle synthesis',
      badge: 'Reasoning',
      icon: Zap
    },
    { 
      id: 'gemini-3.1-pro', 
      label: 'Nexuss 3.1 Pro', 
      desc: 'Maximized cognitive reasoning for complex system design & code',
      badge: 'Pro',
      icon: Cpu
    },
    { 
      id: 'claude-3-5-sonnet', 
      label: 'Claude 3.5 Sonnet', 
      desc: 'Anthropic state-of-the-art coding and nuanced analytical writing',
      badge: 'Anthropic',
      icon: Sparkles
    },
    { 
      id: 'deepseek-chat', 
      label: 'DeepSeek V3', 
      desc: 'High throughput MoE architecture for coding & technical tasks',
      badge: 'DeepSeek',
      icon: Zap
    },
    { 
      id: 'gpt-4o', 
      label: 'GPT-4o Omnimodal', 
      desc: 'OpenAI flagship multi-modal reasoning through OmniRoute Gateway',
      badge: 'OpenAI',
      icon: Sparkles
    }
  ];

  const activeModelObj = models.find(m => m.id === currentModel) || models[0];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-14 border-b border-zinc-800/80 px-3 sm:px-6 flex items-center justify-between select-none z-30 shrink-0 transition-all duration-300 backdrop-blur-md bg-[#0c0c0e]/95 shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
      {/* LEFT: Mobile Sidebar Trigger + Model Selector Dropdown */}
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

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-zinc-800/60 transition-colors cursor-pointer group"
          >
            <span className="font-medium text-xs sm:text-sm text-zinc-200 group-hover:text-white transition-colors">
              {activeModelObj.label}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${modelDropdownOpen ? 'rotate-180 text-zinc-300' : ''}`} />
          </button>

          {modelDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-[#141418] border border-zinc-800 shadow-2xl p-1.5 z-50 text-left animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-1.5 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Select Intelligence Model
              </div>
              {models.map((m) => {
                const Icon = m.icon;
                const isSelected = m.id === currentModel;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      onSelectModel(m.id);
                      setModelDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                      isSelected ? 'bg-zinc-800/90 border border-violet-500/40' : 'hover:bg-zinc-800/50'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 ${isSelected ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-xs text-zinc-200">{m.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          isSelected ? 'bg-violet-500/20 text-violet-300' : 'bg-zinc-800 text-zinc-400'
                        }`}>
                          {m.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{m.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
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
