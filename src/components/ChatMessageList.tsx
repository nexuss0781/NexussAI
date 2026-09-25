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
  Sparkles,
  RefreshCw,
  Square,
  Bookmark,
  BookmarkCheck,
  Pencil,
  GitBranch,
  ChevronLeft,
  ChevronRight,
  Send,
  X
} from 'lucide-react';
import { ChatMessage } from '../types';
import { MarkdownRenderer } from './MarkdownRenderer';
import { NexussFace } from './NexussFace';

interface ChatMessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onRegenerate: () => void;
  onAbort?: () => void;
  reasoningStatus?: 'connecting' | 'working' | string;
  onSavePrompt?: (promptText: string) => void;
  onEditPrompt?: (messageId: string, newContent: string) => void;
  onSwitchVersion?: (messageId: string, targetVersionIndex: number) => void;
  onBranchThread?: (messageId: string) => void;
  isPromptSaved?: (promptText: string) => boolean;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  isLoading,
  onRegenerate,
  onAbort,
  reasoningStatus = 'connecting',
  onSavePrompt,
  onEditPrompt,
  onSwitchVersion,
  onBranchThread,
  isPromptSaved,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  
  // Inline editing state for user prompts
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, reasoningStatus]);

  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.selectionStart = editInputRef.current.value.length;
      editInputRef.current.selectionEnd = editInputRef.current.value.length;
    }
  }, [editingMessageId]);

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

  const startEditing = (msg: ChatMessage) => {
    setEditingMessageId(msg.id);
    setEditContent(msg.content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const submitEdit = (messageId: string) => {
    const trimmed = editContent.trim();
    if (!trimmed || isLoading) return;
    if (onEditPrompt) {
      onEditPrompt(messageId, trimmed);
    }
    setEditingMessageId(null);
    setEditContent('');
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 max-w-3xl mx-auto w-full">
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const isCopied = copiedId === msg.id;
        const isSpeaking = speakingId === msg.id;
        const userFeedback = feedback[msg.id];
        const isEditing = editingMessageId === msg.id;

        // Versioning details
        const versions = msg.versions || [msg.content];
        const currentVersionIdx = msg.versionIndex ?? (versions.length - 1);
        const totalVersions = versions.length;
        const hasMultipleVersions = totalVersions > 1;
        const saved = isPromptSaved ? isPromptSaved(msg.content) : false;

        if (isUser) {
          return (
            <div key={msg.id} className="flex justify-end items-start gap-3 group animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="max-w-[88%] sm:max-w-[80%] space-y-1.5 flex flex-col items-end">
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

                {/* Inline Edit Box or Normal Bubble */}
                {isEditing ? (
                  <div className="w-full min-w-[280px] sm:min-w-[420px] rounded-2xl bg-[#1c1929] border border-violet-500/50 p-3 shadow-lg space-y-2.5">
                    <textarea
                      ref={editInputRef}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          submitEdit(msg.id);
                        } else if (e.key === 'Escape') {
                          cancelEditing();
                        }
                      }}
                      className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-xl p-3 text-zinc-100 text-sm focus:outline-none focus:border-violet-400 resize-none min-h-[90px]"
                      placeholder="Edit your prompt..."
                    />
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="text-[11px] text-zinc-400">
                        Press <kbd className="px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 text-[10px]">Enter</kbd> to save & run
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80 transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => submitEdit(msg.id)}
                          disabled={!editContent.trim() || isLoading}
                          className="flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>Save & Submit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl rounded-tr-sm bg-[#1c1929] border border-violet-500/30 px-4 py-2.5 text-zinc-100 text-sm sm:text-base leading-relaxed shadow-sm">
                    {msg.content}
                  </div>
                )}

                {/* User Message Action Bar & Version Controls (Visible on hover or if multiple versions) */}
                {!isEditing && (
                  <div className="flex items-center gap-1.5 text-zinc-400 opacity-80 group-hover:opacity-100 transition-opacity pt-0.5">
                    {/* Version Switcher: < 1/2 > */}
                    {hasMultipleVersions && onSwitchVersion && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-[11px] text-zinc-300 font-mono shadow-xs mr-1">
                        <button
                          onClick={() => onSwitchVersion(msg.id, Math.max(0, currentVersionIdx - 1))}
                          disabled={currentVersionIdx === 0 || isLoading}
                          className="p-0.5 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-300 cursor-pointer"
                          title="Previous version"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <span>{currentVersionIdx + 1}/{totalVersions}</span>
                        <button
                          onClick={() => onSwitchVersion(msg.id, Math.min(totalVersions - 1, currentVersionIdx + 1))}
                          disabled={currentVersionIdx === totalVersions - 1 || isLoading}
                          className="p-0.5 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-300 cursor-pointer"
                          title="Next version"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Bookmark / Save to Library Icon */}
                    {onSavePrompt && (
                      <button
                        onClick={() => onSavePrompt(msg.content)}
                        className={`p-1.5 rounded-lg hover:bg-zinc-800/80 transition-colors text-xs cursor-pointer ${
                          saved ? 'text-violet-400' : 'hover:text-zinc-200'
                        }`}
                        title={saved ? 'Saved in library' : 'Save prompt to library'}
                      >
                        {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      </button>
                    )}

                    {/* Edit Prompt Icon */}
                    {onEditPrompt && (
                      <button
                        onClick={() => startEditing(msg)}
                        disabled={isLoading}
                        className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-zinc-200 text-xs transition-colors cursor-pointer disabled:opacity-40"
                        title="Edit prompt & branch"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Copy Prompt Icon */}
                    <button
                      onClick={() => handleCopy(msg.id, msg.content)}
                      className="p-1.5 rounded-lg hover:bg-zinc-800/80 hover:text-zinc-200 text-xs transition-colors cursor-pointer"
                      title="Copy prompt"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                )}
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

                {/* Branch to New Chat Icon */}
                {onBranchThread && (
                  <button
                    onClick={() => onBranchThread(msg.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-violet-500/15 hover:text-violet-300 text-xs transition-colors cursor-pointer border border-transparent hover:border-violet-500/30"
                    title="Branch conversation into a new chat from here"
                  >
                    <GitBranch className="w-3.5 h-3.5 text-violet-400" />
                    <span className="hidden sm:inline text-[11px] font-medium">Branch</span>
                  </button>
                )}

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
          <div className="space-y-2 max-w-full">
            <div className="text-xs font-semibold text-violet-300 flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                <span className="text-zinc-200 tracking-wide font-medium">Nexuss AI</span>
              </span>
              {onAbort && (
                <button
                  type="button"
                  onClick={onAbort}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-[10px] text-rose-300 font-medium transition-colors cursor-pointer"
                  title="Stop generation"
                >
                  <Square className="w-2.5 h-2.5 fill-rose-300 stroke-rose-300" />
                  <span>Stop</span>
                </button>
              )}
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl rounded-tl-sm bg-[#131317] border border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.3s]" />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce [animation-delay:-0.15s]" />
                  <div className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                </div>
                <span className="text-xs text-zinc-400 font-mono">
                  {reasoningStatus || 'connecting'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};
