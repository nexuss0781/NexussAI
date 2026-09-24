import React from 'react';

interface GlowingOrbProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isThinking?: boolean;
  animate?: boolean;
  className?: string;
}

export const GlowingOrb: React.FC<GlowingOrbProps> = ({ 
  size = 'md', 
  isThinking = false,
  animate = true,
  className = '',
}) => {
  if (size === 'xs') {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
        {/* Soft micro glow */}
        <div className="absolute w-6 h-6 rounded-full bg-violet-500/15 blur-[3px] pointer-events-none" />
        
        {/* Micro 3D Moon Orb */}
        <div
          className={`relative w-5 h-5 rounded-full ${animate ? 'animate-orb-float' : ''}`}
          style={{
            background: 'radial-gradient(circle at 35% 30%, #f5f3ff 0%, #ddd6fe 30%, #8b5cf6 65%, #4c1d95 95%)',
            boxShadow: 'inset -1.5px -1.5px 4px rgba(35, 10, 60, 0.6), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.9), 0 0 5px rgba(139, 92, 246, 0.25)',
          }}
        >
          {/* Top highlight */}
          <div 
            className="absolute top-0.5 left-1 w-2.5 h-1.5 rounded-full bg-white/70 opacity-80"
            style={{ transform: 'rotate(-20deg)' }}
          />
        </div>
      </div>
    );
  }

  if (size === 'sm') {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}>
        {/* Ambient glow */}
        <div className="absolute w-8 h-8 rounded-full bg-violet-500/20 blur-[5px] pointer-events-none" />
        
        {/* 3D Moon Orb */}
        <div
          className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full ${animate ? 'animate-orb-float' : ''}`}
          style={{
            background: 'radial-gradient(circle at 35% 30%, #f5f3ff 0%, #ddd6fe 25%, #8b5cf6 60%, #4c1d95 90%)',
            boxShadow: 'inset -2px -2px 6px rgba(35, 10, 60, 0.6), inset 2px 2px 4px rgba(255, 255, 255, 0.85), 0 0 7px rgba(139, 92, 246, 0.25)',
          }}
        >
          {/* Specular sheen */}
          <div 
            className="absolute top-1 left-1.5 w-4 h-2 rounded-full bg-white/75 opacity-80"
            style={{ transform: 'rotate(-20deg)' }}
          />
          {/* Rim overlay */}
          <div className="absolute inset-0 rounded-full border border-white/20" />
        </div>
      </div>
    );
  }

  const sizeClasses = {
    md: 'w-24 h-24 sm:w-28 sm:h-28',
    lg: 'w-36 h-36',
  }[size];

  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none my-2 ${className}`}>
      {/* Outer ambient blur glow */}
      <div 
        className={`absolute rounded-full transition-all duration-700 ${
          isThinking 
            ? 'w-44 h-44 bg-violet-500/20 blur-xl scale-115 animate-pulse' 
            : 'w-36 h-36 bg-violet-500/12 blur-xl animate-pulse-subtle'
        }`}
      />

      {/* Secondary soft lavender backlight */}
      <div className="absolute w-28 h-28 rounded-full bg-violet-400/10 blur-lg" />

      {/* Main 3D Glass Iridescent Moon Sphere */}
      <div
        className={`relative ${sizeClasses} rounded-full ${animate ? 'animate-orb-float' : ''} transition-transform duration-500`}
        style={{
          background: 'radial-gradient(circle at 35% 30%, #f5f3ff 0%, #ddd6fe 25%, #8b5cf6 60%, #4c1d95 90%)',
          boxShadow: `
            inset -6px -6px 18px rgba(35, 10, 60, 0.6),
            inset 5px 5px 12px rgba(255, 255, 255, 0.8),
            0 8px 24px -4px rgba(139, 92, 246, 0.25),
            0 0 25px rgba(196, 181, 253, 0.2)
          `,
        }}
      >
        {/* Top specular glossy reflection crescent */}
        <div 
          className="absolute top-2 left-3 w-3/4 h-1/2 rounded-full opacity-70 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 40% 25%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.1) 60%, transparent 80%)',
            transform: 'rotate(-20deg)',
          }}
        />

        {/* Inner chromatic rim refraction */}
        <div 
          className="absolute inset-0 rounded-full border border-white/30 mix-blend-overlay"
        />

        {/* Internal ethereal swirling aura (animated) */}
        <div 
          className="absolute inset-1 rounded-full opacity-40 animate-orb-rotate"
          style={{
            background: 'conic-gradient(from 180deg at 50% 50%, rgba(255,255,255,0.4) 0deg, transparent 90deg, rgba(216,180,254,0.6) 180deg, transparent 270deg, rgba(255,255,255,0.4) 360deg)',
            mixBlendMode: 'screen',
          }}
        />
        
        {/* Subtle center shine */}
        <div 
          className="absolute bottom-2 right-3 w-6 h-6 rounded-full blur-[2px] opacity-40"
          style={{
            background: 'radial-gradient(circle, rgba(216, 180, 254, 0.8) 0%, transparent 70%)',
          }}
        />
      </div>
    </div>
  );
};
