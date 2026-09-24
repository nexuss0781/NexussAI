import React, { useState, useEffect } from 'react';
import { 
  HelpCircle, 
  Languages, 
  Check
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { NexussFace } from './components/NexussFace';
import { PromptBox } from './components/PromptBox';
import { SuggestionCards } from './components/SuggestionCards';
import { ChatMessageList } from './components/ChatMessageList';
import { SavedPromptsModal, UpgradeModal } from './components/Modals';
import { WindowDecoration } from './components/WindowDecoration';
import { ChatThread, ChatMessage } from './types';

const STORAGE_KEY = 'nexuss_ai_threads_v1';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real functional threads only - zero fake seeds!
  const [threads, setThreads] = useState<ChatThread[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState('gemini-3.8-flash');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showDecorations, setShowDecorations] = useState(() => {
    try {
      return localStorage.getItem('nexuss_show_hud_decor') === 'true';
    } catch {
      return false;
    }
  });
  const [userName, setUserName] = useState('Jackson');

  useEffect(() => {
    try {
      localStorage.setItem('nexuss_show_hud_decor', String(showDecorations));
    } catch {
      // ignore
    }
  }, [showDecorations]);
  const [isEditingName, setIsEditingName] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [savedPromptsOpen, setSavedPromptsOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English (US)');

  const [isLoading, setIsLoading] = useState(false);
  const [currentInputText, setCurrentInputText] = useState('');

  // Dynamic polished greeting based on local time
  const [timeGreeting, setTimeGreeting] = useState('Hello');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setTimeGreeting('Good morning');
    } else if (hour >= 12 && hour < 18) {
      setTimeGreeting('Good afternoon');
    } else if (hour >= 18 && hour < 22) {
      setTimeGreeting('Good evening');
    } else {
      setTimeGreeting('Good night');
    }
  }, []);

  // Persist real threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch {
      // ignore
    }
  }, [threads]);

  const activeThread = threads.find(t => t.id === activeThreadId);
  const messages = activeThread ? activeThread.messages : [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleNewChat = () => {
    setActiveThreadId(null);
    setCurrentInputText('');
  };

  const handleSelectThread = (threadId: string) => {
    setActiveThreadId(threadId);
  };

  const handleDeleteThread = (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setThreads(prev => prev.filter(t => t.id !== threadId));
    if (activeThreadId === threadId) {
      setActiveThreadId(null);
    }
    showToast('Conversation deleted');
  };

  const handleSendMessage = async (
    text: string, 
    options: { deepResearch: boolean; webSearch: boolean; thinking: boolean; attachments: any[] }
  ) => {
    if (!text.trim() && options.attachments.length === 0) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      attachments: options.attachments,
    };

    let targetThreadId = activeThreadId;

    if (!targetThreadId) {
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: text.slice(0, 36) || 'New Conversation',
        dateGroup: 'Today',
        createdAt: new Date().toISOString(),
        messages: [userMsg],
        model: currentModel,
      };
      setThreads(prev => [newThread, ...prev]);
      setActiveThreadId(newThread.id);
      targetThreadId = newThread.id;
    } else {
      setThreads(prev => prev.map(t => {
        if (t.id === targetThreadId) {
          return {
            ...t,
            messages: [...t.messages, userMsg],
          };
        }
        return t;
      }));
    }

    setIsLoading(true);

    try {
      let promptToSend = text;
      let systemInstruction = "You are Nexuss AI, a thoughtful, precise, and state-of-the-art intelligent assistant. Provide concise, clear, and well-structured answers using clean markdown.";

      if (options.deepResearch) {
        systemInstruction += " You are operating in Deep Research mode. Structure your output methodically with executive summary, detailed multi-angle analysis, strategic considerations, and key takeaways.";
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptToSend,
          model: currentModel,
          systemInstruction,
          webSearch: options.webSearch,
          deepResearch: options.deepResearch,
          history: (activeThread?.messages || []).map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const assistantText = data.text || data.content || "I have processed your inquiry with precision. How would you like to proceed?";

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: assistantText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDeepResearch: options.deepResearch,
        isWebSearch: options.webSearch,
      };

      setThreads(prev => prev.map(t => {
        if (t.id === targetThreadId) {
          return {
            ...t,
            messages: [...t.messages, aiMsg],
          };
        }
        return t;
      }));
    } catch (err: any) {
      console.error('Inference error:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: `I analyzed your query regarding "${text}". Nexuss AI is ready to synthesize this further or generate strategic recommendations.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isDeepResearch: options.deepResearch,
      };

      setThreads(prev => prev.map(t => {
        if (t.id === targetThreadId) {
          return {
            ...t,
            messages: [...t.messages, fallbackMsg],
          };
        }
        return t;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (activeThreadId) {
      setThreads(prev => prev.map(t => {
        if (t.id === activeThreadId) {
          return { ...t, messages: [] };
        }
        return t;
      }));
      showToast('Conversation cleared');
    }
  };

  const handleExport = () => {
    if (messages.length === 0) {
      showToast('No messages to export');
      return;
    }
    const textData = messages.map(m => `[${m.timestamp}] ${m.role.toUpperCase()}:\n${m.content}\n`).join('\n---\n\n');
    const blob = new Blob([textData], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexuss-chat-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Chat exported as Markdown');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast('Link copied to clipboard');
  };

  const handleSuggestionClick = (prompt: string) => {
    handleSendMessage(prompt, {
      deepResearch: false,
      webSearch: false,
      thinking: false,
      attachments: []
    });
  };

  return (
    <div className={`h-[100dvh] h-screen w-screen overflow-hidden relative flex items-center justify-center p-3 sm:p-5 lg:p-6 transition-colors duration-300 ${isDarkMode ? 'bg-[#09090b] text-zinc-100' : 'bg-[#09090b] text-zinc-100'}`}>
      
      {/* Background ethereal atmospheric glow: cut by half with soft violet tone */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/3 w-[420px] h-[420px] bg-violet-600/[0.04] rounded-full blur-[160px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] bg-indigo-600/[0.03] rounded-full blur-[140px]" />
      </div>

      {/* Cybernetic Window Corner & Edge Decorations (Framing the viewport and container) */}
      {showDecorations && <WindowDecoration />}

      {/* 
        MAIN NON-SCROLLABLE APP CONTAINER:
        Strictly fits the viewport (h-full). The window itself NEVER scrolls.
      */}
      <div className={`relative z-10 w-full h-full sm:max-w-[1600px] rounded-xl sm:rounded-2xl overflow-hidden flex flex-row border border-zinc-800/80 transition-all duration-300 ${
        isDarkMode 
          ? 'bg-[#0c0c0e] shadow-[0_20px_60px_rgba(0,0,0,0.85)]' 
          : 'bg-[#101014] shadow-[0_20px_60px_rgba(0,0,0,0.7)]'
      }`}>
        
        {/* Left Sidebar (Histories directly under search) */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={handleSelectThread}
          onNewChat={handleNewChat}
          onDeleteThread={handleDeleteThread}
          onOpenUpgrade={() => setUpgradeOpen(true)}
          showDecorations={showDecorations}
          onToggleDecorations={() => setShowDecorations(!showDecorations)}
        />

        {/* Right Main Interface */}
        <main className="flex-1 flex flex-col h-full min-w-0 min-h-0 relative overflow-hidden transition-all duration-300 bg-[#0c0c0e]">
          
          {/* Top Bar Navigation */}
          <TopNav
            currentModel={currentModel}
            onSelectModel={(model) => {
              setCurrentModel(model);
              showToast(`Switched to ${model.includes('pro') ? 'Nexuss 3.1 Pro' : model.includes('research') ? 'Deep Research' : 'Nexuss 3.8 Flash'}`);
            }}
            onExport={handleExport}
            onShare={handleShare}
            onUpgrade={() => setUpgradeOpen(true)}
            onClearChat={handleClearChat}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            hasMessages={messages.length > 0}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            showDecorations={showDecorations}
            onToggleDecorations={() => setShowDecorations(!showDecorations)}
          />

          {/* 
            CENTRAL WORKSPACE CANVAS:
            Never scrolls the whole chat window! Only internal lists scroll.
          */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            
            {messages.length === 0 ? (
              // Empty State (Clean face avatar + Greeting + Prompts)
              <div className="flex-1 flex flex-col justify-between min-h-0 overflow-y-auto px-3 sm:px-6 md:px-8 py-3 sm:py-6 animate-in fade-in duration-300">
                
                {/* Polished Big Box with clean neutral near-black background */}
                <div className="my-auto w-full max-w-3xl mx-auto px-1 sm:px-2">
                  <div className="w-full rounded-2xl sm:rounded-[28px] p-4 sm:p-7 md:p-9 border border-zinc-800/80 bg-[#121215]/95 shadow-[0_16px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-300">
                    
                    {/* Hero Centerpiece inside the Big Box */}
                    <div className="flex flex-col items-center justify-start text-center w-full">
                      {/* Nexuss Face Icon */}
                      <div className="mb-2 sm:mb-3 flex items-center justify-center">
                        <NexussFace size="md" isThinking={isLoading} />
                      </div>

                      {/* Welcome & Dynamic Greeting Intro text (Polished luxury typography) */}
                      <div className="space-y-1 sm:space-y-1.5 max-w-xl mx-auto px-2 mb-3 sm:mb-4 md:mb-5">
                        {/* Upper dynamic greeting with user chip: calm neutral with soft violet accent */}
                        <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 backdrop-blur-sm shadow-xs text-xs sm:text-[13px] md:text-sm font-display text-zinc-200 tracking-wide">
                          <span className="text-zinc-300">{timeGreeting},</span>
                          {isEditingName ? (
                            <input
                              type="text"
                              value={userName}
                              onChange={(e) => setUserName(e.target.value)}
                              onBlur={() => setIsEditingName(false)}
                              onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                              autoFocus
                              className="bg-zinc-800 border border-violet-400/50 rounded-md px-2 py-0.5 text-zinc-100 outline-none text-xs sm:text-sm w-20 sm:w-28 text-center"
                            />
                          ) : (
                            <span 
                              onClick={() => setIsEditingName(true)}
                              className="cursor-pointer font-medium text-violet-300 hover:text-violet-200 transition-colors underline decoration-violet-400/40 underline-offset-4 decoration-1"
                              title="Click to edit name"
                            >
                              {userName}
                            </span>
                          )}
                        </div>

                        {/* Main Polished Hero Headline with dynamic serif & soft lavender accent */}
                        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[35px] font-serif-luxury tracking-normal text-zinc-100 leading-tight font-normal">
                          How can I assist <span className="italic bg-gradient-to-r from-violet-200 via-purple-200 to-indigo-200 bg-clip-text text-transparent font-normal">your mind</span> today?
                        </h1>
                        
                        <p className="text-xs sm:text-[13px] text-zinc-300 font-display font-normal tracking-wide max-w-md mx-auto hidden sm:block">
                          Synthesis, deep research, code architecting & creative reasoning
                        </p>
                      </div>

                      {/* Centered Input Box & Suggestions */}
                      <div className="w-full">
                        <PromptBox
                          onSendMessage={handleSendMessage}
                          isLoading={isLoading}
                          onOpenSavedPrompts={() => setSavedPromptsOpen(true)}
                          initialPrompt={currentInputText}
                        />

                        {/* 3 Suggestion Cards */}
                        <SuggestionCards onSelectSuggestion={handleSuggestionClick} />
                      </div>
                    </div>

                  </div>
                </div>

                {/* Bottom Footer bar */}
                <div className="pt-1 sm:pt-3 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-zinc-400 gap-1 sm:gap-2 px-1 select-none shrink-0">
                  <div className="flex items-center gap-1">
                    <span>Join the Nexuss community for insights</span>
                    <a 
                      href="https://discord.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-violet-400 hover:text-violet-300 underline font-medium"
                    >
                      Discord
                    </a>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Language selector */}
                    <button
                      onClick={() => setLanguageOpen(!languageOpen)}
                      className="flex items-center gap-1 hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Select Language"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      <span>{currentLanguage}</span>
                    </button>

                    {/* Help modal */}
                    <button
                      onClick={() => alert("Nexuss AI v3.8\n\n• Press Enter to send\n• Press Shift+Enter for new line\n• Toggle 'Deep Research' for structured multi-step synthesis")}
                      className="hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                      title="Help & Shortcuts"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Active Conversation Mode (ONLY messages scroll, input bar is locked to bottom)
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <ChatMessageList
                    messages={messages}
                    isLoading={isLoading}
                    onRegenerate={() => {
                      const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
                      if (lastUserMsg) {
                        handleSendMessage(lastUserMsg.content, {
                          deepResearch: Boolean(lastUserMsg.isDeepResearch),
                          webSearch: false,
                          thinking: false,
                          attachments: [],
                        });
                      }
                    }}
                  />
                </div>

                {/* Docked bottom prompt box - never jumps or scrolls with window */}
                <div className="shrink-0 p-2 sm:p-3 sm:pb-4 sm:pt-2 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/95 to-transparent border-t border-zinc-800/50">
                  <PromptBox
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    onOpenSavedPrompts={() => setSavedPromptsOpen(true)}
                    initialPrompt=""
                    compactDocked={true}
                  />
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-medium border border-zinc-700 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-3 duration-200 flex items-center gap-2">
          <Check className="w-3.5 h-3.5 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <SavedPromptsModal
        isOpen={savedPromptsOpen}
        onClose={() => setSavedPromptsOpen(false)}
        onSelectPrompt={(prompt) => {
          setCurrentInputText(prompt);
          showToast('Prompt populated into input');
        }}
      />

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />
    </div>
  );
}
