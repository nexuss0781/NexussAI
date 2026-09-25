import React, { useState } from 'react';
import { 
  X, 
  Zap, 
  Check, 
  Bookmark, 
  Compass, 
  ArrowRight,
  Folder,
  FileText
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

// 1. Saved Prompts Modal
export const SavedPromptsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string) => void;
}> = ({ isOpen, onClose, onSelectPrompt }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Productivity', 'Strategy', 'Technical', 'Creative'];

  const prompts: SavedPrompt[] = [
    {
      id: '1',
      category: 'Productivity',
      title: '7-Day Sprint Planner',
      prompt: 'Create a detailed 7-day sprint plan for a cross-functional engineering team, including daily focus, deliverables, and risk mitigation strategies.',
      iconName: 'Zap',
    },
    {
      id: '2',
      category: 'Productivity',
      title: 'Concise Stakeholder Brief',
      prompt: 'Draft a concise executive email to key stakeholders summarizing this week’s technical milestones, throughput improvements, and upcoming roadmap dependencies.',
      iconName: 'Mail',
    },
    {
      id: '3',
      category: 'Strategy',
      title: 'Eisenhower Prioritization Matrix',
      prompt: 'Analyze a list of 10 incoming initiatives using the Eisenhower Matrix. Group into Do First, Schedule, Delegate, and Eliminate with rationale.',
      iconName: 'Layers',
    },
    {
      id: '4',
      category: 'Strategy',
      title: 'GDPR vs CCPA Audit',
      prompt: 'Compare key differences between GDPR and CCPA regarding data collection consent, erasure timelines, territorial scope, and non-compliance fines in a structured table.',
      iconName: 'Shield',
    },
    {
      id: '5',
      category: 'Creative',
      title: 'Brand Positioning & Taglines',
      prompt: 'Generate 5 high-impact, distinctive taglines for an eco-conscious sustainable luxury brand, complete with demographic hooks and messaging rationale.',
      iconName: 'Sparkles',
    },
    {
      id: '6',
      category: 'Technical',
      title: 'Architectural Code Review',
      prompt: 'Review this architecture pattern for potential bottlenecks, race conditions, memory leaks, and horizontal scaling constraints.',
      iconName: 'Code',
    },
  ];

  const filtered = selectedCategory === 'All' 
    ? prompts 
    : prompts.filter(p => p.category === selectedCategory);

  return (
    <ModalWrapper title="Saved Prompts Library" isOpen={isOpen} onClose={onClose} icon={<Bookmark className="w-4 h-4" />}>
      <div className="flex gap-1.5 overflow-x-auto pb-2 border-b border-zinc-800">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              selectedCategory === cat
                ? 'bg-violet-600 text-white shadow-xs'
                : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="space-y-2.5 pt-2">
        {filtered.map(p => (
          <div
            key={p.id}
            onClick={() => {
              onSelectPrompt(p.prompt);
              onClose();
            }}
            className="p-3.5 rounded-xl bg-zinc-900/60 hover:bg-zinc-850 border border-zinc-800 hover:border-violet-500/40 transition-all cursor-pointer group text-left"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-zinc-100 group-hover:text-violet-200 transition-colors">
                {p.title}
              </span>
              <span className="text-[10px] text-violet-400/80 uppercase tracking-wider font-mono">
                {p.category}
              </span>
            </div>
            <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
              {p.prompt}
            </p>
          </div>
        ))}
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
