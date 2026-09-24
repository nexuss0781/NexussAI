import React from 'react';
import { Clock, Lightbulb, Scale } from 'lucide-react';

interface SuggestionCardsProps {
  onSelectSuggestion: (promptText: string, deepResearch?: boolean) => void;
}

export const SuggestionCards: React.FC<SuggestionCardsProps> = ({ onSelectSuggestion }) => {
  const suggestions = [
    {
      id: 'synthesize',
      icon: Clock,
      title: 'Synthesize Data',
      description: 'Turn my meeting notes into 5 key bullet points for the team',
      prompt: 'Turn my meeting notes into 5 key bullet points for the team with immediate owners and next sprint checkpoints.',
      deepResearch: false,
    },
    {
      id: 'brainstorm',
      icon: Lightbulb,
      title: 'Creative Brainstorm',
      description: 'Generate 3 taglines for a new sustainable fashion brand',
      prompt: 'Generate 3 creative, high-impact taglines for a new sustainable fashion brand, explaining tone, demographic resonance, and brand narrative.',
      deepResearch: false,
    },
    {
      id: 'facts',
      icon: Scale,
      title: 'Check Facts',
      description: 'Compare key differences between GDPR and CCPA',
      prompt: 'Compare key regulatory differences between GDPR and CCPA in a structured table, highlighting territorial scope, consent requirements, and violation penalties.',
      deepResearch: true,
    },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto px-1 sm:px-2 md:px-4 mt-2 sm:mt-3">
      {/* Responsive layout: smooth horizontal scroll on narrow mobile/tablet portrait, 3-column grid on tablet landscape & desktop */}
      <div className="flex md:grid md:grid-cols-3 gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none snap-x snap-mandatory">
        {suggestions.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => onSelectSuggestion(card.prompt, card.deepResearch)}
              className="group flex flex-col items-start p-2 sm:p-2.5 md:p-3 rounded-xl sm:rounded-2xl bg-[#141418] hover:bg-[#18181f] border border-zinc-800/80 hover:border-violet-400/30 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/50 backdrop-blur-md cursor-pointer active:scale-[0.98] shrink-0 w-[170px] sm:w-[200px] md:w-auto snap-start"
            >
              <div className="w-6 h-6 sm:w-6.5 sm:h-6.5 md:w-7 md:h-7 rounded-lg sm:rounded-xl bg-zinc-900 border border-zinc-800 group-hover:border-violet-500/40 group-hover:bg-violet-950/20 text-violet-300 flex items-center justify-center mb-1 sm:mb-1.5 md:mb-2 transition-all shrink-0">
                <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <div className="w-full min-w-0">
                <div className="text-[11.5px] sm:text-xs font-medium tracking-tight text-zinc-100 group-hover:text-white transition-colors truncate">
                  {card.title}
                </div>
                <div className="text-[10px] sm:text-[11px] md:text-[11.5px] text-zinc-300 mt-0.5 line-clamp-2 leading-relaxed font-normal">
                  {card.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
