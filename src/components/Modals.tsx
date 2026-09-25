import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Check, 
  Bookmark, 
  Compass, 
  ArrowRight,
  Folder,
  FileText,
  Trash2,
  Plus,
  Copy,
  Search,
  GitBranch,
  Sparkles
} from 'lucide-react';
import { SavedPrompt } from '../types';
import { NexussFace } from './NexussFace';

interface ModalWrapperProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const ModalWrapper: React.FC<ModalWrapperProps> = ({ title, isOpen, onClose, children, icon }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-[#141418] border border-zinc-800 shadow-2xl p-6 overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            {icon ? (
              <div className="w-8 h-8 rounded-xl bg-violet-600/15 text-violet-400 flex items-center justify-center border border-violet-500/30">
                {icon}
              </div>
            ) : (
              <NexussFace size="xs" />
            )}
            <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {children}
        </div>
      </div>
    </div>
  );
};

// 1. Real Dynamic Saved Prompts Modal
export const SavedPromptsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  savedPrompts: SavedPrompt[];
  onSelectPrompt: (prompt: string) => void;
  onDeletePrompt: (id: string) => void;
  onAddPrompt: (title: string, promptText: string, category: string) => void;
}> = ({ isOpen, onClose, savedPrompts, onSelectPrompt, onDeletePrompt, onAddPrompt }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPromptText, setNewPromptText] = useState('');
  const [newCategory, setNewCategory] = useState('Productivity');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Productivity', 'Strategy', 'Technical', 'Creative', 'Custom'];

  const handleCopy = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromptText.trim()) return;
    const title = newTitle.trim() || newPromptText.slice(0, 30) + '...';
    onAddPrompt(title, newPromptText.trim(), newCategory);
    setNewTitle('');
    setNewPromptText('');
    setIsAdding(false);
  };

  const filtered = savedPrompts.filter(p => {
    const matchesCat = selectedCategory === 'All' || p.category === selectedCategory || (selectedCategory === 'Custom' && p.isCustom);
    const matchesSearch = !searchQuery.trim() || 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <ModalWrapper title="Saved Prompts Library" isOpen={isOpen} onClose={onClose} icon={<Bookmark className="w-4 h-4" />}>
      {/* Search & Add New Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search saved prompts..."
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500"
            />
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/40 text-violet-300 text-xs font-medium transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAdding ? 'Cancel' : 'New Prompt'}</span>
          </button>
        </div>

        {/* Add New Custom Prompt Form */}
        {isAdding && (
          <form onSubmit={handleCreate} className="p-3.5 rounded-xl bg-zinc-900/90 border border-violet-500/40 space-y-2.5 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-violet-300">Create Saved Prompt</span>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-zinc-300 text-[11px] rounded-lg px-2 py-0.5 focus:outline-none"
              >
                <option value="Productivity">Productivity</option>
                <option value="Strategy">Strategy</option>
                <option value="Technical">Technical</option>
                <option value="Creative">Creative</option>
              </select>
            </div>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Prompt Title (optional)"
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-400"
            />
            <textarea
              value={newPromptText}
              onChange={(e) => setNewPromptText(e.target.value)}
              placeholder="Enter your prompt content..."
              className="w-full bg-zinc-800/80 border border-zinc-700 rounded-lg p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-violet-400 min-h-[70px] resize-none"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newPromptText.trim()}
                className="px-3 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
              >
                Save Prompt
              </button>
            </div>
          </form>
        )}

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-zinc-800">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Prompts List */}
      <div className="space-y-2.5 pt-1">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No saved prompts found in this category. Click "New Prompt" or bookmark any message in chat to save.
          </div>
        ) : (
          filtered.map(p => {
            const isCopied = copiedId === p.id;
            return (
              <div
                key={p.id}
                onClick={() => {
                  onSelectPrompt(p.prompt);
                  onClose();
                }}
                className="p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 hover:border-violet-500/40 transition-all cursor-pointer group text-left relative"
              >
                <div className="flex items-center justify-between mb-1 pr-16">
                  <span className="text-xs font-semibold text-zinc-100 group-hover:text-violet-200 transition-colors truncate">
                    {p.title}
                  </span>
                  <span className="text-[10px] text-violet-400/80 uppercase tracking-wider font-mono shrink-0 ml-2">
                    {p.category}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                  {p.prompt}
                </p>

                {/* Actions overlay on item */}
                <div className="absolute right-3 top-3 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleCopy(p.id, p.prompt, e)}
                    className="p-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors cursor-pointer"
                    title="Copy prompt text"
                  >
                    {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePrompt(p.id);
                    }}
                    className="p-1 rounded-md bg-zinc-800 hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 text-xs transition-colors cursor-pointer"
                    title="Delete saved prompt"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </ModalWrapper>
  );
};

// 2. Branch Confirmation Modal
export const BranchConfirmModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  messageSnippet?: string;
  sourceThreadTitle?: string;
}> = ({ isOpen, onClose, onConfirm, messageSnippet, sourceThreadTitle }) => {
  if (!isOpen) return null;

  return (
    <ModalWrapper title="Branch into New Chat" isOpen={isOpen} onClose={onClose} icon={<GitBranch className="w-4 h-4" />}>
      <div className="space-y-4 py-1">
        <p className="text-xs text-zinc-300 leading-relaxed">
          Create an independent conversation thread containing the entire message history up to this response. You can explore new ideas without changing the current chat.
        </p>

        {sourceThreadTitle && (
          <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs space-y-1">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">Source Thread</span>
            <div className="text-zinc-200 font-medium truncate">{sourceThreadTitle}</div>
          </div>
        )}

        {messageSnippet && (
          <div className="p-3 rounded-xl bg-[#1c1929] border border-violet-500/30 text-xs space-y-1">
            <span className="text-[10px] text-violet-400 uppercase tracking-wider font-mono">Branch Point Message</span>
            <p className="text-zinc-300 line-clamp-3 italic">
              "{messageSnippet}"
            </p>
          </div>
        )}

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-800/80">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-medium transition-all shadow-md shadow-violet-600/20 cursor-pointer"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Confirm & Create Branch</span>
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
};

// 2. Upgrade / Pro Modal
export const UpgradeModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  return (
    <ModalWrapper title="Upgrade to Nexuss Pro" isOpen={isOpen} onClose={onClose} icon={<Zap className="w-4 h-4" />}>
      <div className="text-center py-2 space-y-2">
        <div className="inline-flex justify-center mb-2">
          <NexussFace size="sm" />
        </div>
        <h3 className="text-lg font-bold text-white">Unlock Full Nexuss Intelligence</h3>
        <p className="text-xs text-zinc-400 max-w-sm mx-auto">
          Elevate your analytical workflows with unbounded reasoning depth and real-time agentic research.
        </p>
      </div>

      <div className="space-y-3 py-2">
        {[
          'Priority access to Nexuss AI Ultra & Reasoning Engine',
          'Unlimited Deeper Research multi-step synthesis',
          'Live Web Grounding with citation verification',
          '100MB+ document and multi-modal file attachments',
          'Custom prompt engineering workspaces & exports',
          '24/7 priority compute lane with zero throttling'
        ].map((feature, i) => (
          <div key={i} className="flex items-center gap-3 text-xs text-zinc-300">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </div>
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-zinc-800">
        <button
          onClick={() => {
            alert('Nexuss Pro has been activated for this workspace!');
            onClose();
          }}
          className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs tracking-wide shadow-md shadow-violet-900/30 transition-all cursor-pointer"
        >
          Activate Pro Trial (Free for 14 Days)
        </button>
      </div>
    </ModalWrapper>
  );
};

// 3. Explore Modal
export const ExploreModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectWorkflow: (prompt: string) => void;
}> = ({ isOpen, onClose, onSelectWorkflow }) => {
  const workflows = [
    { title: 'Executive Sprint Blueprint', desc: 'Auto-construct agile sprint roadmaps with risk assessment.', prompt: 'Build a comprehensive 2-week agile sprint plan for a payment gateway overhaul.' },
    { title: 'Regulatory Compliance Matrix', desc: 'Synthesize global legal frameworks and privacy obligations.', prompt: 'Compare AI Act compliance guidelines with NIST AI Risk Management Framework.' },
    { title: 'Fullstack Architectural Spike', desc: 'Design resilient distributed microservice architectures.', prompt: 'Draft a system architecture diagram and specification for a high-concurrency real-time websocket server.' },
    { title: 'Persuasive Copy Engine', desc: 'Craft high-converting taglines and brand positioning narratives.', prompt: 'Generate 5 persuasive landing page headlines for an autonomous AI developer tool.' },
  ];

  return (
    <ModalWrapper title="Explore Nexuss Workflows" isOpen={isOpen} onClose={onClose} icon={<Compass className="w-4 h-4" />}>
      <p className="text-xs text-zinc-400">
        Discover curated agentic workflows tuned for executive reasoning and rapid engineering iteration.
      </p>
      <div className="space-y-3 pt-2">
        {workflows.map((wf, idx) => (
          <div
            key={idx}
            onClick={() => {
              onSelectWorkflow(wf.prompt);
              onClose();
            }}
            className="p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 text-left cursor-pointer transition-all hover:border-violet-500/40 group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 group-hover:text-violet-300">{wf.title}</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-500 group-hover:text-violet-400 transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="text-[11px] text-zinc-400 mt-1">{wf.desc}</p>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};

// 4. Files Modal
export const FilesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const sampleFiles = [
    { name: 'Sprint_Planning_Q3.pdf', size: '1.2 MB', date: 'Today, 09:42 AM' },
    { name: 'GDPR_Compliance_Brief.docx', size: '480 KB', date: 'Yesterday, 04:15 PM' },
    { name: 'Architecture_Schema.sql', size: '24 KB', date: 'Sep 18, 2026' },
  ];

  return (
    <ModalWrapper title="Files & Workspace Assets" isOpen={isOpen} onClose={onClose} icon={<Folder className="w-4 h-4" />}>
      <p className="text-xs text-zinc-400">
        Review indexed documents, uploaded code snippets, and parsed assets.
      </p>
      <div className="space-y-2 pt-2">
        {sampleFiles.map((file, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-xs">
            <div className="flex items-center gap-2.5">
              <FileText className="w-4 h-4 text-violet-400" />
              <div>
                <div className="font-medium text-zinc-200">{file.name}</div>
                <div className="text-[10px] text-zinc-500">{file.date}</div>
              </div>
            </div>
            <span className="text-[11px] text-zinc-400 font-mono">{file.size}</span>
          </div>
        ))}
      </div>
    </ModalWrapper>
  );
};
