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
        <div className="absolute w-6 h-6 rounded-full bg-purple-500/30 blur-[4px] pointer-events-none" />
        
        {/* Micro 3D Moon Orb */}
        <div
          className={`relative w-5 h-5 rounded-full ${animate ? 'animate-orb-float' : ''}`}
          style={{
            background: 'radial-gradient(circle at 35% 30%, #f3e8ff 0%, #c084fc 30%, #9333ea 65%, #581c87 95%)',
            boxShadow: 'inset -1.5px -1.5px 4px rgba(45, 10, 80, 0.8), inset 1.5px 1.5px 3px rgba(255, 255, 255, 0.9), 0 0 8px rgba(168, 85, 247, 0.5)',
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
        <div className="absolute w-9 h-9 rounded-full bg-purple-500/35 blur-[6px] pointer-events-none" />
        
        {/* 3D Moon Orb */}
        <div
          className={`relative w-7 h-7 sm:w-8 sm:h-8 rounded-full ${animate ? 'animate-orb-float' : ''}`}
          style={{
            background: 'radial-gradient(circle at 35% 30%, #f3e8ff 0%, #c084fc 25%, #9333ea 60%, #581c87 90%)',
            boxShadow: 'inset -2.5px -2.5px 7px rgba(45, 10, 80, 0.8), inset 2px 2px 5px rgba(255, 255, 255, 0.85), 0 0 12px rgba(168, 85, 247, 0.5)',
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
            ? 'w-44 h-44 bg-purple-500/40 blur-2xl scale-125 animate-pulse' 
            : 'w-36 h-36 bg-purple-600/25 blur-2xl animate-pulse-subtle'
        }`}
      />

      {/* Secondary soft lavender backlight */}
      <div className="absolute w-28 h-28 rounded-full bg-violet-400/20 blur-xl" />

      {/* Main 3D Glass Iridescent Moon Sphere */}
      <div
        className={`relative ${sizeClasses} rounded-full ${animate ? 'animate-orb-float' : ''} transition-transform duration-500`}
        style={{
          background: 'radial-gradient(circle at 35% 30%, #f3e8ff 0%, #c084fc 25%, #9333ea 60%, #581c87 90%)',
          boxShadow: `
            inset -8px -8px 24px rgba(45, 10, 80, 0.75),
            inset 6px 6px 14px rgba(255, 255, 255, 0.8),
            0 12px 36px -6px rgba(147, 51, 234, 0.45),
            0 0 50px rgba(192, 132, 252, 0.4)
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
