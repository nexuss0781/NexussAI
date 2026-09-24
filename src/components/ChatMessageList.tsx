import React, { useRef, useEffect, useState } from 'react';
import { 
  Copy, 
  Check, 
  Volume2, 
  VolumeX, 
  ThumbsUp, 
  ThumbsDown, 
  RotateCw, 
  FileText,
  Search,
  Sparkles
} from 'lucide-react';
import { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { NexussFace } from './NexussFace';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onRegenerate: () => void;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  onRegenerate,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[#*`_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedback(prev => ({
      ...prev,
      [id]: prev[id] === type ? undefined as any : type,
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-3xl mx-auto w-full">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const isCopied = copiedId === msg.id;
        const isSpeaking = speakingId === msg.id;
        const userFeedback = feedback[msg.id];

        if (isUser) {
          return (
            <div key={msg.id} className="flex justify-end items-start gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                {/* Attachments if any */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-end">
                    {msg.attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-300 border border-zinc-700">
                        <FileText className="w-3 h-3 text-violet-400" />
                        <span className="truncate max-w-[120px]">{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-2xl rounded-tr-sm bg-[#1c1929] border border-violet-500/30 px-4 py-2.5 text-zinc-100 text-sm sm:text-base leading-relaxed shadow-sm">
                  {msg.content}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-zinc-850 border border-zinc-700/80 flex items-center justify-center text-xs font-medium text-zinc-200 shrink-0 mt-0.5 shadow-xs">
                ES
              </div>
            </div>
          );
        }

        return (
          <div key={msg.id} className="flex items-start gap-3 sm:gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Nexuss Face Avatar */}
            <div className="shrink-0 mt-0.5">
              <NexussFace size="sm" />
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              {/* Header meta badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-200">Nexuss AI</span>
                {msg.isDeepResearch && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-violet-500/15 border border-violet-500/30 text-violet-300">
                    <Sparkles className="w-2.5 h-2.5" /> Deeper Research
                  </span>
                )}
                {msg.isWebSearch && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300">
                    <Search className="w-2.5 h-2.5" /> Web Grounded
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div className="rounded-2xl rounded-tl-sm bg-[#131317] border border-zinc-800/80 p-4 sm:p-5 text-zinc-200 shadow-sm backdrop-blur-xs">
                <MarkdownRenderer content={msg.content} />
              </div>

              {/* Footer action bar */}
              <div className="flex items-center gap-1 pt-1 text-zinc-400">
                <button
                  onClick={() => handleCopy(msg.id, msg.content)}
                  className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
                  title="Copy response"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handleSpeak(msg.id, msg.content)}
                  className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 text-xs transition-colors cursor-pointer ${
                    isSpeaking ? 'text-violet-400 bg-violet-500/10' : ''
                  }`}
                  title={isSpeaking ? 'Stop speaking' : 'Read aloud'}
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={onRegenerate}
                  className="p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
                  title="Regenerate response"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <div className="w-px h-3 bg-zinc-800 mx-1" />

                <button
                  onClick={() => handleFeedback(msg.id, 'up')}
                  className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 text-xs transition-colors cursor-pointer ${
                    userFeedback === 'up' ? 'text-violet-400 bg-violet-500/10' : ''
                  }`}
                  title="Helpful response"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => handleFeedback(msg.id, 'down')}
                  className={`p-1.5 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 text-xs transition-colors cursor-pointer ${
                    userFeedback === 'down' ? 'text-rose-400 bg-rose-500/10' : ''
                  }`}
                  title="Not helpful"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-start gap-4 animate-in fade-in duration-300">
          <div className="shrink-0 mt-0.5">
            <NexussFace size="sm" isThinking={true} />
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-violet-300 flex items-center gap-2">
              <span>Nexuss AI is synthesizing response...</span>
            </div>
            <div className="p-4 rounded-2xl rounded-tl-sm bg-[#131317] border border-zinc-800/80 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
              </div>
              <span className="text-xs text-zinc-400 font-mono">analyzing context & structure</span>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
