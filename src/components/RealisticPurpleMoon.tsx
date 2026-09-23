import React from 'react';

interface RealisticPurpleMoonProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
  animated?: boolean;
  isThinking?: boolean;
  className?: string;
}

export const RealisticPurpleMoon: React.FC<RealisticPurpleMoonProps> = ({
  size = 'md',
  animated = false,
  isThinking = false,
  className = '',
}) => {
  // Determine pixel dimension
  let dim = 24;
  if (typeof size === 'number') {
    dim = size;
  } else {
    switch (size) {
      case 'xs': dim = 20; break;
      case 'sm': dim = 26; break;
      case 'md': dim = 110; break;
      case 'lg': dim = 140; break;
    }
  }

  const isBig = dim >= 80;

  // Static Small Moon (for "Nexuss AI" logo)
  if (!animated || !isBig) {
    return (
      <div 
        className={`relative inline-flex items-center justify-center shrink-0 select-none ${className}`}
        style={{ width: dim, height: dim }}
      >
        {/* Subtle purple ambient glow */}
        <div 
          className="absolute rounded-full bg-purple-600/30 blur-[4px] pointer-events-none"
          style={{ width: dim * 1.25, height: dim * 1.25 }}
        />

        {/* Realistic Moon SVG */}
        <svg
          viewBox="0 0 100 100"
          width={dim}
          height={dim}
          className="relative drop-shadow-[0_2px_8px_rgba(168,85,247,0.4)]"
        >
          <defs>
            {/* 3D Sphere gradient */}
            <radialGradient id="moonSurface" cx="35%" cy="32%" r="65%">
              <stop offset="0%" stopColor="#f5e8ff" />
              <stop offset="25%" stopColor="#d8b4fe" />
              <stop offset="55%" stopColor="#9333ea" />
              <stop offset="85%" stopColor="#581c87" />
              <stop offset="100%" stopColor="#2e1065" />
            </radialGradient>

            {/* Mare / Dark Basin gradient */}
            <radialGradient id="mareGrad" cx="40%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#4c1d95" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#2e1065" stopOpacity="0.9" />
            </radialGradient>

            {/* Crater inner shadow */}
            <radialGradient id="craterShadow" cx="65%" cy="65%" r="60%">
              <stop offset="0%" stopColor="#1e053a" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#581c87" stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            <clipPath id="moonClipSmall">
              <circle cx="50" cy="50" r="48" />
            </clipPath>
          </defs>

          {/* Base Moon Sphere */}
          <circle cx="50" cy="50" r="48" fill="url(#moonSurface)" />

          {/* Surface Details (Clipped to sphere) */}
          <g clipPath="url(#moonClipSmall)">
            {/* Lunar Maria (Dark Basaltic Plains) */}
            {/* Mare Tranquillitatis / Serenitatis */}
            <path
              d="M 28,34 Q 38,24 50,30 Q 62,36 58,48 Q 50,56 36,52 Q 24,46 28,34 Z"
              fill="url(#mareGrad)"
              opacity="0.65"
              filter="blur(1.5px)"
            />
            {/* Oceanus Procellarum */}
            <path
              d="M 16,48 Q 25,42 32,54 Q 34,70 24,76 Q 14,75 16,48 Z"
              fill="url(#mareGrad)"
              opacity="0.6"
              filter="blur(1.5px)"
            />
            {/* Mare Imbrium */}
            <path
              d="M 38,20 Q 52,18 56,26 Q 52,36 40,34 Q 32,28 38,20 Z"
              fill="url(#mareGrad)"
              opacity="0.55"
              filter="blur(1.2px)"
            />
            {/* Mare Crisium (right isolated patch) */}
            <ellipse cx="74" cy="40" rx="9" ry="7" fill="url(#mareGrad)" opacity="0.65" filter="blur(1px)" />

            {/* Impact Craters with bright rims & dark centers */}
            {/* Tycho Crater (bottom right with rays) */}
            <circle cx="60" cy="74" r="7" fill="url(#craterShadow)" />
            <circle cx="59" cy="73" r="7" fill="none" stroke="#f3e8ff" strokeWidth="1.2" opacity="0.8" />
            <circle cx="60.5" cy="74.5" r="1.5" fill="#faf5ff" opacity="0.9" />

            {/* Copernicus Crater */}
            <circle cx="42" cy="44" r="5.5" fill="url(#craterShadow)" />
            <circle cx="41.2" cy="43.2" r="5.5" fill="none" stroke="#e9d5ff" strokeWidth="1" opacity="0.75" />
            <circle cx="42" cy="44" r="1" fill="#fff" opacity="0.8" />

            {/* Kepler Crater */}
            <circle cx="28" cy="48" r="4" fill="url(#craterShadow)" />
            <circle cx="27.5" cy="47.5" r="4" fill="none" stroke="#e9d5ff" strokeWidth="0.8" opacity="0.7" />

            {/* Aristarchus (bright glowing spot) */}
            <circle cx="25" cy="36" r="3.2" fill="#faf5ff" opacity="0.85" filter="blur(0.5px)" />
            <circle cx="25.5" cy="36.5" r="2" fill="url(#craterShadow)" />

            {/* Small crater cluster */}
            <circle cx="68" cy="56" r="3" fill="url(#craterShadow)" />
            <circle cx="67.5" cy="55.5" r="3" fill="none" stroke="#d8b4fe" strokeWidth="0.6" opacity="0.6" />

            <circle cx="52" cy="62" r="3.5" fill="url(#craterShadow)" />
            <circle cx="51.5" cy="61.5" r="3.5" fill="none" stroke="#d8b4fe" strokeWidth="0.6" opacity="0.6" />

            {/* Terminator shadow on right limb */}
            <path
              d="M 50,2 A 48,48 0 0,1 98,50 A 48,48 0 0,1 50,98 A 46,48 0 0,0 50,2 Z"
              fill="#120324"
              opacity="0.35"
              filter="blur(3px)"
            />

            {/* Specular high-altitude limb sheen */}
            <path
              d="M 6,50 A 44,44 0 0,1 50,6 A 48,48 0 0,0 12,38 Z"
              fill="#ffffff"
              opacity="0.55"
              filter="blur(1px)"
            />
          </g>

          {/* Thin outer atmospheric glass rim */}
          <circle cx="50" cy="50" r="47.5" fill="none" stroke="#e9d5ff" strokeWidth="0.8" opacity="0.4" />
        </svg>
      </div>
    );
  }

  // Big Animated Circulating Moon (Empty State Hero)
  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none my-3 ${className}`}>
      {/* Outer ambient blur glow */}
      <div 
        className={`absolute rounded-full transition-all duration-700 ${
          isThinking 
            ? 'w-52 h-52 bg-purple-500/40 blur-3xl scale-125 animate-pulse' 
            : 'w-44 h-44 bg-purple-600/30 blur-3xl animate-pulse-subtle'
        }`}
      />

      {/* Secondary soft lavender halo */}
      <div className="absolute w-36 h-36 rounded-full bg-violet-400/20 blur-2xl" />

      {/* Main 3D Circulating Moon Container */}
      <div
        className="relative rounded-full animate-orb-float transition-transform duration-500"
        style={{
          width: dim,
          height: dim,
          filter: 'drop-shadow(0 12px 36px rgba(147, 51, 234, 0.45))',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          width={dim}
          height={dim}
          className="w-full h-full"
        >
          <defs>
            {/* 3D Sphere Radial Gradient */}
            <radialGradient id="bigMoonBase" cx="34%" cy="30%" r="68%">
              <stop offset="0%" stopColor="#fdf4ff" />
              <stop offset="20%" stopColor="#e9d5ff" />
              <stop offset="45%" stopColor="#c084fc" />
              <stop offset="70%" stopColor="#7e22ce" />
              <stop offset="90%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#1e053a" />
            </radialGradient>

            {/* Mare basalt gradient */}
            <radialGradient id="bigMare" cx="40%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#3b0764" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#1e053a" stopOpacity="0.95" />
            </radialGradient>

            <clipPath id="bigMoonClip">
              <circle cx="50" cy="50" r="48" />
            </clipPath>
          </defs>

          {/* Base sphere */}
          <circle cx="50" cy="50" r="48" fill="url(#bigMoonBase)" />

          {/* Circulating / Rotating Lunar Surface Layer */}
          <g clipPath="url(#bigMoonClip)">
            {/* Animated Rotating Details Group */}
            <g className="animate-orb-rotate" style={{ transformOrigin: '50px 50px' }}>
              {/* Mare Tranquillitatis & Serenitatis */}
              <path
                d="M 28,34 Q 38,22 52,28 Q 64,34 60,48 Q 50,58 35,53 Q 22,46 28,34 Z"
                fill="url(#bigMare)"
                opacity="0.65"
                filter="blur(2px)"
              />
              {/* Oceanus Procellarum */}
              <path
                d="M 14,48 Q 24,40 32,54 Q 35,72 22,78 Q 12,74 14,48 Z"
                fill="url(#bigMare)"
                opacity="0.6"
                filter="blur(2px)"
              />
              {/* Mare Imbrium */}
              <path
                d="M 38,18 Q 54,16 58,25 Q 53,36 40,34 Q 30,26 38,18 Z"
                fill="url(#bigMare)"
                opacity="0.55"
                filter="blur(1.5px)"
              />
              {/* Mare Crisium */}
              <ellipse cx="76" cy="40" rx="9" ry="7" fill="url(#bigMare)" opacity="0.65" filter="blur(1.5px)" />
              {/* Mare Nubium */}
              <ellipse cx="38" cy="66" rx="10" ry="7" fill="url(#bigMare)" opacity="0.55" filter="blur(2px)" />

              {/* Major Realistic Craters */}
              {/* Tycho (with radial ejecta rays) */}
              <g transform="translate(62, 74)">
                <line x1="-15" y1="-8" x2="18" y2="10" stroke="#f3e8ff" strokeWidth="0.5" opacity="0.4" />
                <line x1="-12" y1="12" x2="14" y2="-14" stroke="#f3e8ff" strokeWidth="0.5" opacity="0.4" />
                <circle cx="0" cy="0" r="7.5" fill="#1e053a" opacity="0.8" />
                <circle cx="-0.8" cy="-0.8" r="7.5" fill="none" stroke="#fdf4ff" strokeWidth="1.4" opacity="0.85" />
                <circle cx="0.5" cy="0.5" r="1.8" fill="#ffffff" opacity="0.95" />
              </g>

              {/* Copernicus */}
              <g transform="translate(42, 44)">
                <circle cx="0" cy="0" r="6" fill="#1e053a" opacity="0.8" />
                <circle cx="-0.7" cy="-0.7" r="6" fill="none" stroke="#e9d5ff" strokeWidth="1.2" opacity="0.8" />
                <circle cx="0.3" cy="0.3" r="1.2" fill="#fff" opacity="0.9" />
              </g>

              {/* Kepler */}
              <g transform="translate(26, 48)">
                <circle cx="0" cy="0" r="4.2" fill="#1e053a" opacity="0.75" />
                <circle cx="-0.5" cy="-0.5" r="4.2" fill="none" stroke="#e9d5ff" strokeWidth="0.9" opacity="0.75" />
              </g>

              {/* Aristarchus */}
              <circle cx="24" cy="35" r="3.5" fill="#ffffff" opacity="0.85" filter="blur(0.8px)" />
              <circle cx="24.5" cy="35.5" r="2.2" fill="#1e053a" opacity="0.8" />

              {/* Additional Impact Pocks */}
              <circle cx="70" cy="58" r="3.2" fill="#1e053a" opacity="0.7" />
              <circle cx="69.5" cy="57.5" r="3.2" fill="none" stroke="#d8b4fe" strokeWidth="0.7" opacity="0.6" />

              <circle cx="54" cy="64" r="3.8" fill="#1e053a" opacity="0.7" />
              <circle cx="53.5" cy="63.5" r="3.8" fill="none" stroke="#d8b4fe" strokeWidth="0.7" opacity="0.6" />
            </g>

            {/* Static 3D Atmospheric Sheen on Top (Stationary while craters rotate) */}
            {/* Specular gloss crescent */}
            <path
              d="M 12,36 A 46,46 0 0,1 60,8 Q 32,22 18,48 Z"
              fill="radial-gradient(ellipse, #ffffff 0%, transparent 80%)"
              fillOpacity="0.7"
              filter="blur(1.5px)"
            />

            {/* Deep Terminator Shadow along lower-right hemisphere */}
            <path
              d="M 50,2 A 48,48 0 0,1 98,50 A 48,48 0 0,1 50,98 A 44,48 0 0,0 50,2 Z"
              fill="#0f021c"
              opacity="0.5"
              filter="blur(4px)"
            />

            {/* Limb rim highlight */}
            <circle cx="50" cy="50" r="47.5" fill="none" stroke="#f3e8ff" strokeWidth="1" opacity="0.45" />
          </g>
        </svg>
      </div>
    </div>
  );
};
