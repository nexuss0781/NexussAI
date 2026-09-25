import React, { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, 
  Languages, 
  Check,
  Bookmark
} from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { NexussFace } from './components/NexussFace';
import { PromptBox } from './components/PromptBox';
import { SuggestionCards } from './components/SuggestionCards';
import { ChatMessageList } from './components/ChatMessageList';
import { SavedPromptsModal, UpgradeModal, BranchConfirmModal } from './components/Modals';
import { WindowDecoration } from './components/WindowDecoration';
import { ChatThread, ChatMessage, SavedPrompt } from './types';

const STORAGE_KEY = 'nexuss_ai_threads_v1';
const SAVED_PROMPTS_KEY = 'nexuss_saved_prompts_v1';

const DEFAULT_SAVED_PROMPTS: SavedPrompt[] = [
  {
    id: 'sp-1',
    category: 'Productivity',
    title: '7-Day Sprint Planner',
    prompt: 'Create a detailed 7-day sprint plan for a cross-functional engineering team, including daily focus, deliverables, and risk mitigation strategies.',
    iconName: 'Zap',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sp-2',
    category: 'Productivity',
    title: 'Concise Stakeholder Brief',
    prompt: 'Draft a concise executive email to key stakeholders summarizing this week’s technical milestones, throughput improvements, and upcoming roadmap dependencies.',
    iconName: 'Mail',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sp-3',
    category: 'Strategy',
    title: 'Eisenhower Prioritization Matrix',
    prompt: 'Analyze a list of incoming initiatives using the Eisenhower Matrix. Group into Do First, Schedule, Delegate, and Eliminate with concise rationale.',
    iconName: 'Layers',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sp-4',
    category: 'Strategy',
    title: 'GDPR vs CCPA Audit',
    prompt: 'Compare key differences between GDPR and CCPA regarding data collection consent, erasure timelines, territorial scope, and non-compliance fines in a structured table.',
    iconName: 'Shield',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sp-5',
    category: 'Creative',
    title: 'Brand Positioning & Taglines',
    prompt: 'Generate 5 high-impact, distinctive taglines for an eco-conscious sustainable luxury brand, complete with demographic hooks and messaging rationale.',
    iconName: 'Sparkles',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sp-6',
    category: 'Technical',
    title: 'Architectural Code Review',
    prompt: 'Review this architecture pattern for potential bottlenecks, race conditions, memory leaks, and horizontal scaling constraints.',
    iconName: 'Code',
    createdAt: new Date().toISOString(),
  },
];

// Explicit requested retry schedule:
const RETRY_SCHEDULE_MS = [
  1000,    // 1s
  1000,    // 1s
  2000,    // 2s
  3000,    // 3s
  5000,    // 5s
  10000,   // 10s
  15000,   // 15s
  30000,   // 30s
  60000,   // 1m
  60000,   // 1m
  120000,  // 2m
  180000,  // 3m
  300000,  // 5m
  600000,  // 10m
  900000,  // 15m
  1800000, // 30m
];

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Real functional threads
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

  // Real saved prompts library persisted in localStorage
  const [savedPrompts, setSavedPrompts] = useState<SavedPrompt[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_PROMPTS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }
    return DEFAULT_SAVED_PROMPTS;
  });

  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [showDecorations, setShowDecorations] = useState(() => {
    try {
      return localStorage.getItem('nexuss_show_hud_decor') === 'true';
    } catch {
      return false;
    }
  });
  const [userName, setUserName] = useState('Jackson');

  // Branching State
  const [branchModalOpen, setBranchModalOpen] = useState(false);
  const [branchTargetMessageId, setBranchTargetMessageId] = useState<string | null>(null);

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
  const [reasoningStatus, setReasoningStatus] = useState<'connecting' | 'working'>('connecting');

  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
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

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  // Persist real threads to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
    } catch {
      // ignore
    }
  }, [threads]);

  // Persist real saved prompts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_PROMPTS_KEY, JSON.stringify(savedPrompts));
    } catch {
      // ignore
    }
  }, [savedPrompts]);

  const activeThread = threads.find(t => t.id === activeThreadId);
  const messages = activeThread ? activeThread.messages : [];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Saved Prompts Handlers
  const handleSavePrompt = (promptText: string) => {
    const trimmed = promptText.trim();
    if (!trimmed) return;

    // Check if already in saved prompts
    const exists = savedPrompts.some(p => p.prompt.trim() === trimmed);
    if (exists) {
      // Remove from saved prompts
      setSavedPrompts(prev => prev.filter(p => p.prompt.trim() !== trimmed));
      showToast('Removed from saved prompts');
      return;
    }

    const titleWords = trimmed.split(/\s+/).slice(0, 5).join(' ');
    const title = titleWords.length > 32 ? titleWords.slice(0, 32) + '...' : titleWords;
    const newPrompt: SavedPrompt = {
      id: `sp-${Date.now()}`,
      title: title || 'Custom Prompt',
      prompt: trimmed,
      category: 'Custom',
      isCustom: true,
      createdAt: new Date().toISOString(),
    };

    setSavedPrompts(prev => [newPrompt, ...prev]);
    showToast('Saved prompt to library');
  };

  const handleDeleteSavedPrompt = (id: string) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
    showToast('Prompt removed from library');
  };

  const handleAddCustomPrompt = (title: string, promptText: string, category: string) => {
    const newPrompt: SavedPrompt = {
      id: `sp-${Date.now()}`,
      title: title.trim(),
      prompt: promptText.trim(),
      category: category || 'Custom',
      isCustom: true,
      createdAt: new Date().toISOString(),
    };
    setSavedPrompts(prev => [newPrompt, ...prev]);
    showToast('Custom prompt added to library');
  };

  const isPromptSaved = (promptText: string) => {
    return savedPrompts.some(p => p.prompt.trim() === promptText.trim());
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setReasoningStatus('connecting');
    setIsLoading(false);
    showToast('Generation stopped');
  };

  const handleNewChat = () => {
    if (isLoading) handleAbort();
    setActiveThreadId(null);
    setCurrentInputText('');
  };

  const handleSelectThread = (threadId: string) => {
    if (isLoading) handleAbort();
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

  const sleepDelay = (ms: number, signal: AbortSignal): Promise<boolean> => {
    return new Promise((resolve) => {
      setReasoningStatus('connecting');
      const timer = setTimeout(() => {
        resolve(!signal.aborted);
      }, ms);

      if (signal.aborted) {
        clearTimeout(timer);
        resolve(false);
      } else {
        signal.addEventListener('abort', () => {
          clearTimeout(timer);
          resolve(false);
        }, { once: true });
      }
    });
  };

  // Edit & Versioning handler: edits a user message, records versions (1/2, 2/2), and branches
  const handleEditPrompt = async (messageId: string, newContent: string) => {
    if (!activeThread) return;
    const msgIndex = activeThread.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const oldMsg = activeThread.messages[msgIndex];
    const existingVersions = oldMsg.versions || [oldMsg.content];
    const newVersions = [...existingVersions, newContent];
    const newVersionIndex = newVersions.length - 1;

    // Save current downstream messages into old branch cache
    const currentDownstream = activeThread.messages.slice(msgIndex + 1);
    const updatedBranches = {
      ...(oldMsg.versionBranches || {}),
      [oldMsg.versionIndex ?? (existingVersions.length - 1)]: currentDownstream,
    };

    const updatedUserMsg: ChatMessage = {
      ...oldMsg,
      content: newContent,
      versions: newVersions,
      versionIndex: newVersionIndex,
      versionBranches: updatedBranches,
    };

    // Truncate downstream messages
    const slicedMessages = [...activeThread.messages.slice(0, msgIndex), updatedUserMsg];
    
    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          messages: slicedMessages,
        };
      }
      return t;
    }));

    // Generate assistant response for this updated branch
    await executeGeneration(newContent, {
      deepResearch: Boolean(oldMsg.isDeepResearch),
      webSearch: Boolean(oldMsg.isWebSearch),
      thinking: false,
      attachments: oldMsg.attachments || [],
      existingHistory: slicedMessages.slice(0, msgIndex),
      targetThreadId: activeThread.id,
    });
  };

  // Switch version handler: toggles < 1/2 >
  const handleSwitchVersion = (messageId: string, targetIndex: number) => {
    if (!activeThread) return;
    const msgIndex = activeThread.messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;

    const msg = activeThread.messages[msgIndex];
    const versions = msg.versions || [msg.content];
    if (targetIndex < 0 || targetIndex >= versions.length) return;

    const currentIdx = msg.versionIndex ?? (versions.length - 1);
    const currentDownstream = activeThread.messages.slice(msgIndex + 1);

    const updatedBranches = {
      ...(msg.versionBranches || {}),
      [currentIdx]: currentDownstream,
    };

    const switchedContent = versions[targetIndex];
    const targetDownstream = updatedBranches[targetIndex] || [];

    const updatedUserMsg: ChatMessage = {
      ...msg,
      content: switchedContent,
      versionIndex: targetIndex,
      versionBranches: updatedBranches,
    };

    const newMessagesList = [
      ...activeThread.messages.slice(0, msgIndex),
      updatedUserMsg,
      ...targetDownstream,
    ];

    setThreads(prev => prev.map(t => {
      if (t.id === activeThread.id) {
        return {
          ...t,
          messages: newMessagesList,
        };
      }
      return t;
    }));

    showToast(`Switched to version ${targetIndex + 1}/${versions.length}`);
  };

  // Branch conversation handler: Opens confirmation modal to fork conversation
  const handleBranchClick = (messageId: string) => {
    setBranchTargetMessageId(messageId);
    setBranchModalOpen(true);
  };

  const handleConfirmBranch = () => {
    if (!activeThread || !branchTargetMessageId) return;
    const msgIndex = activeThread.messages.findIndex(m => m.id === branchTargetMessageId);
    if (msgIndex === -1) return;

    const slicedHistory = activeThread.messages.slice(0, msgIndex + 1);
    const newThreadId = `thread-branch-${Date.now()}`;
    const cleanTitle = activeThread.title.replace(/^\[Branch\]\s*/, '');
    const newBranchThread: ChatThread = {
      id: newThreadId,
      title: `[Branch] ${cleanTitle}`,
      dateGroup: 'Today',
      createdAt: new Date().toISOString(),
      messages: slicedHistory,
      model: activeThread.model || 'nexuss-ai',
    };

    setThreads(prev => [newBranchThread, ...prev]);
    setActiveThreadId(newBranchThread.id);
    showToast('Branched into new conversation');
    setBranchModalOpen(false);
    setBranchTargetMessageId(null);
  };

  // Main generation pipeline
  const executeGeneration = async (
    promptText: string,
    params: {
      deepResearch: boolean;
      webSearch: boolean;
      thinking: boolean;
      attachments: any[];
      existingHistory: ChatMessage[];
      targetThreadId: string;
    }
  ) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    const signal = abortController.signal;

    setIsLoading(true);
    setReasoningStatus('connecting');

    let finalResponseText: string | null = null;
    let systemInstruction = "You are Nexuss AI, a thoughtful, precise, and state-of-the-art intelligent assistant. Provide concise, clear, and well-structured answers using clean markdown.";

    if (params.deepResearch) {
      systemInstruction += " You are operating in Deep Research mode. Structure your output methodically with executive summary, detailed multi-angle analysis, strategic considerations, and key takeaways.";
    }

    for (let attempt = 0; attempt <= RETRY_SCHEDULE_MS.length; attempt += 1) {
      if (signal.aborted) break;

      try {
        setReasoningStatus('connecting');
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            prompt: promptText,
            systemInstruction,
            webSearch: params.webSearch,
            deepResearch: params.deepResearch,
            history: params.existingHistory.map(m => ({
              role: m.role,
              content: m.content
            }))
          })
        });

        if (response.ok) {
          setReasoningStatus('working');
          const data = await response.json();
          if (data && (data.text || data.content)) {
            finalResponseText = data.text || data.content;
            break;
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || signal.aborted) {
          break;
        }
      }

      if (attempt < RETRY_SCHEDULE_MS.length) {
        const delay = RETRY_SCHEDULE_MS[attempt];
        const shouldContinue = await sleepDelay(delay, signal);
        if (!shouldContinue || signal.aborted) {
          break;
        }
      }
    }

    setIsLoading(false);
    setReasoningStatus('connecting');

    if (signal.aborted || !finalResponseText) {
      return;
    }

    const aiMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: finalResponseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDeepResearch: params.deepResearch,
      isWebSearch: params.webSearch,
    };

    setThreads(prev => prev.map(t => {
      if (t.id === params.targetThreadId) {
        return {
          ...t,
          messages: [...t.messages, aiMsg],
        };
      }
      return t;
    }));
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
      versions: [text],
      versionIndex: 0,
      versionBranches: {},
      isDeepResearch: options.deepResearch,
      isWebSearch: options.webSearch,
    };

    let targetThreadId = activeThreadId;

    if (!targetThreadId) {
      const newThread: ChatThread = {
        id: `thread-${Date.now()}`,
        title: text.slice(0, 36) || 'New Conversation',
        dateGroup: 'Today',
        createdAt: new Date().toISOString(),
        messages: [userMsg],
        model: 'nexuss-ai',
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

    await executeGeneration(text, {
      deepResearch: options.deepResearch,
      webSearch: options.webSearch,
      thinking: options.thinking,
      attachments: options.attachments,
      existingHistory: activeThread?.messages || [],
      targetThreadId,
    });
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

  const branchTargetMessage = messages.find(m => m.id === branchTargetMessageId);

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
                          onAbort={handleAbort}
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
                    {/* Saved Prompts quick button */}
                    <button
                      onClick={() => setSavedPromptsOpen(true)}
                      className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                      title="Open Saved Prompts"
                    >
                      <Bookmark className="w-3.5 h-3.5 text-violet-400" />
                      <span>Saved ({savedPrompts.length})</span>
                    </button>

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
                      onClick={() => alert("Nexuss AI v3.8\n\n• Hover over any prompt to bookmark, edit, copy, or browse versions (1/2, 2/2)\n• Click Branch on any assistant response to fork a new chat\n• Press Enter to send | Shift+Enter for new line")}
                      className="hover:text-zinc-200 transition-colors p-1 cursor-pointer"
                      title="Help & Shortcuts"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // Active Conversation Mode
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <ChatMessageList
                    messages={messages}
                    isLoading={isLoading}
                    onAbort={handleAbort}
                    reasoningStatus={reasoningStatus}
                    onSavePrompt={handleSavePrompt}
                    onEditPrompt={handleEditPrompt}
                    onSwitchVersion={handleSwitchVersion}
                    onBranchThread={handleBranchClick}
                    isPromptSaved={isPromptSaved}
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

                {/* Docked bottom prompt box */}
                <div className="shrink-0 p-2 sm:p-3 sm:pb-4 sm:pt-2 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/95 to-transparent border-t border-zinc-800/50">
                  <PromptBox
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                    onAbort={handleAbort}
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
        savedPrompts={savedPrompts}
        onSelectPrompt={(prompt) => {
          setCurrentInputText(prompt);
          showToast('Prompt populated into input');
        }}
        onDeletePrompt={handleDeleteSavedPrompt}
        onAddPrompt={handleAddCustomPrompt}
      />

      <BranchConfirmModal
        isOpen={branchModalOpen}
        onClose={() => setBranchModalOpen(false)}
        onConfirm={handleConfirmBranch}
        messageSnippet={branchTargetMessage?.content}
        sourceThreadTitle={activeThread?.title}
      />

      <UpgradeModal
        isOpen={upgradeOpen}
        onClose={() => setUpgradeOpen(false)}
      />
    </div>
  );
}

