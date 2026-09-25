import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles,
  Bookmark,
  Image, 
  Lightbulb, 
  Globe, 
  Mic, 
  ArrowUp, 
  Paperclip, 
  X,
  FileText,
  Square,
  RefreshCw
} from 'lucide-react';

interface PromptBoxProps {
  onSendMessage: (text: string, options: { deepResearch: boolean; webSearch: boolean; thinking: boolean; attachments: any[] }) => void;
  isLoading: boolean;
  onAbort?: () => void;
  onOpenSavedPrompts: () => void;
  initialPrompt?: string;
  compactDocked?: boolean;
}

export const PromptBox: React.FC<PromptBoxProps> = ({
  onSendMessage,
  isLoading,
  onAbort,
  onOpenSavedPrompts,
  initialPrompt = '',
  compactDocked = false,
}) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [deepResearch, setDeepResearch] = useState(false);
  const [webSearch, setWebSearch] = useState(false);
  const [thinkingMode, setThinkingMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; size: string; type: string }[]>([]);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [initialPrompt]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!prompt.trim() && attachments.length === 0) || isLoading) return;

    onSendMessage(prompt.trim(), {
      deepResearch,
      webSearch,
      thinking: thinkingMode,
      attachments,
    });

    setPrompt('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      const newAttachments = files.map(file => ({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || 'document',
      }));
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const toggleSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-1 sm:px-4">
      {/* Outer Card with neutral near-black and soft violet focus state */}
      <div className="relative rounded-xl sm:rounded-[22px] bg-[#141418] border border-zinc-800 shadow-xl shadow-black/40 backdrop-blur-md transition-all focus-within:border-violet-500/40 focus-within:ring-1 focus-within:ring-violet-500/20">
        
        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div className="px-3 sm:px-4 pt-2 sm:pt-3 flex flex-wrap gap-1.5 sm:gap-2">
            {attachments.map((file, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-[11px] sm:text-xs text-zinc-300"
              >
                <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400 shrink-0" />
                <span className="max-w-[90px] sm:max-w-[140px] truncate">{file.name}</span>
                <span className="text-[9px] sm:text-[10px] text-zinc-500">({file.size})</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="ml-1 text-zinc-400 hover:text-zinc-200 cursor-pointer p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Text Area */}
        <div className="p-2 sm:p-3.5 pb-0 sm:pb-1">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            disabled={isLoading}
            className="w-full resize-none bg-transparent text-[13.5px] sm:text-base text-zinc-100 placeholder-zinc-400 focus:outline-none leading-relaxed max-h-36 sm:max-h-48 min-h-[28px] sm:min-h-[38px]"
          />
        </div>

        {/* Action Controls Row */}
        <div className="px-2 sm:px-3 pb-1.5 sm:pb-2 pt-1 flex items-center justify-between gap-1 sm:gap-2 border-t border-zinc-800/40">
          {/* Left tools */}
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
            {/* Deeper Research Pill */}
            <button
              type="button"
              onClick={() => setDeepResearch(!deepResearch)}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-full text-[10.5px] sm:text-xs font-medium transition-all cursor-pointer shrink-0 ${
                deepResearch
                  ? 'bg-violet-600/20 border border-violet-500/40 text-violet-200 shadow-xs'
                  : 'bg-zinc-800/50 border border-zinc-700/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
              }`}
            >
              <Sparkles className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${deepResearch ? 'text-violet-300' : 'text-zinc-400'}`} />
              <span className="whitespace-nowrap">Deep Research</span>
            </button>

            {/* Quick tool icons */}
            <div className="flex items-center gap-0.5 text-zinc-400">
              <button
                type="button"
                onClick={() => {
                  if (fileInputRef.current) fileInputRef.current.click();
                }}
                className="p-1 sm:p-1.5 rounded-lg hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
                title="Add image"
              >
                <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                type="button"
                onClick={() => setThinkingMode(!thinkingMode)}
                className={`p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer ${
                  thinkingMode ? 'text-amber-400 bg-amber-400/10' : 'hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title="Toggle Deep Thinking"
              >
                <Lightbulb className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                type="button"
                onClick={() => setWebSearch(!webSearch)}
                className={`p-1 sm:p-1.5 rounded-lg transition-colors cursor-pointer ${
                  webSearch ? 'text-blue-400 bg-blue-400/10' : 'hover:text-zinc-200 hover:bg-zinc-800/60'
                }`}
                title="Toggle Web Grounding"
              >
                <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>

          {/* Right Action Button (Stop, Send Arrow, or Mic) */}
          <div className="flex items-center shrink-0">
            {isLoading ? (
              <button
                type="button"
                onClick={onAbort}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 flex items-center justify-center shadow-md transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                title="Stop / Abort Generation"
              >
                <Square className="w-3 h-3 fill-rose-300 stroke-rose-300" />
              </button>
            ) : prompt.trim().length > 0 || attachments.length > 0 ? (
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-md shadow-violet-900/30 transition-all cursor-pointer transform hover:scale-105 active:scale-95"
                title="Send message (Enter)"
              >
                <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleSpeechRecognition}
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-violet-600/15 text-violet-300 hover:bg-violet-600/25 hover:text-violet-100 border border-violet-500/35 shadow-xs shadow-violet-950/40'
                }`}
                title={isListening ? 'Stop voice input' : 'Voice input'}
              >
                <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Under-bar: Saved prompts & Attach file buttons */}
      <div className="mt-1 sm:mt-2 px-1 sm:px-2 flex items-center justify-between text-[11px] sm:text-xs text-zinc-300">
        <button
          type="button"
          onClick={onOpenSavedPrompts}
          className="flex items-center gap-1 sm:gap-1.5 hover:text-violet-300 transition-colors cursor-pointer py-0.5"
        >
          <Bookmark className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400" />
          <span>Saved prompts</span>
        </button>

        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-lg border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800/80 hover:text-zinc-100 text-zinc-300 transition-all cursor-pointer"
          >
            <Paperclip className="w-3 h-3 text-zinc-400" />
            <span>Attach file</span>
          </button>
        </div>
      </div>
    </div>
  );
};
