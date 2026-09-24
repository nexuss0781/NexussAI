import React, { useId } from 'react';

interface NexussFaceProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | number;
  isThinking?: boolean;
  animated?: boolean;
  className?: string;
}

export const NexussFace: React.FC<NexussFaceProps> = ({
  size = 'md',
  isThinking = false,
  animated = true,
  className = '',
}) => {
  const reactId = useId();
  // Safe CSS identifier without special characters
  const cleanId = reactId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const phosphorId = `nexusPhosphor_${cleanId}`;
  const shimmerId = `shimmerGradient_${cleanId}`;
  const chamferId = `squircleChamfer_${cleanId}`;
  const glowId = `heroGlow_${cleanId}`;

  // Responsive sizing classes or numeric style
  let sizeClasses = '';
  let inlineStyle: React.CSSProperties | undefined = undefined;

  if (typeof size === 'number') {
    inlineStyle = { width: size, height: size };
  } else {
    switch (size) {
      case 'xs':
        sizeClasses = 'w-6 h-6';
        break;
      case 'sm':
        sizeClasses = 'w-7 h-7 sm:w-8 sm:h-8';
        break;
      case 'md':
        // Fluid balanced sizing across mobile, tablet, and desktop
        sizeClasses = 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-18 lg:h-18';
        break;
      case 'lg':
        sizeClasses = 'w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20';
        break;
    }
  }

  const isBig = size === 'md' || size === 'lg' || (typeof size === 'number' && size >= 50);

  return (
    <div 
      className={`relative inline-flex items-center justify-center shrink-0 select-none aspect-square ${sizeClasses} ${className} transition-transform duration-300 active:scale-95`}
      style={inlineStyle}
    >
      {/* Ambient ethereal violet aura glow: fully responsive on mobile and desktop */}
      <div 
        className={`absolute inset-0 rounded-[28%] pointer-events-none transition-all duration-700 ${
          isThinking 
            ? 'bg-purple-500/35 blur-lg sm:blur-xl scale-125 animate-pulse' 
            : isBig 
              ? 'bg-purple-600/20 blur-md sm:blur-xl scale-110' 
              : 'bg-purple-500/15 blur-xs scale-100'
        }`}
      />

      {/* 
        NEXUSS FORMAL EXECUTIVE MARK:
        - Squircle tile with high-contrast rim.
        - Two capsule eyes with independent blinking & winking.
        - Fluid cross-platform SVG rendering on iOS Safari, Android Chrome, and Desktop.
        - Formal poised mouth with subtle lift for confident intelligence.
      */}
      <div 
        className="relative w-full h-full flex items-center justify-center transition-all duration-300"
        style={{
          borderRadius: '26%',
          background: isBig
            ? 'radial-gradient(120% 120% at 30% 20%, #E8E5DD 0%, #DCD9D0 55%, #D0CDBF 100%)'
            : '#E8E5DD',
          boxShadow: isBig
            ? 'inset 0 1.5px 2px rgba(255, 255, 255, 1), inset 0 -2px 6px rgba(0, 0, 0, 0.05), 0 8px 24px -4px rgba(0, 0, 0, 0.1), 0 0 20px -2px rgba(168, 85, 247, 0.1)'
            : 'inset 0 1px 1.5px rgba(255, 255, 255, 1), inset 0 -1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.05)',
          border: isBig 
            ? '1.25px solid rgba(200, 200, 200, 0.3)' 
            : '1.25px solid rgba(200, 200, 200, 0.5)',
        }}
      >
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Phosphor Gradient for eyes & mouth */}
            <linearGradient id={phosphorId} gradientUnits="userSpaceOnUse" x1="50" y1="20" x2="50" y2="72">
              <stop offset="0%" stopColor="#201738" />
              <stop offset="100%" stopColor="#201738" />
            </linearGradient>

            {/* Shimmer for thinking animation */}
            <linearGradient id={shimmerId} gradientUnits="userSpaceOnUse" x1="30" y1="60" x2="70" y2="70">
              <stop offset="0%" stopColor="#201738" />
              <stop offset="50%" stopColor="#4c1d95" />
              <stop offset="100%" stopColor="#201738" />
            </linearGradient>

            {/* Squircle Chamfer Border (Hero) */}
            <linearGradient id={chamferId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="100">
              <stop offset="0%" stopColor="#d8b4fe" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#c084fc" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#7e22ce" stopOpacity="0.1" />
            </linearGradient>

            {/* Glow Filter for Hero Display */}
            {isBig && (
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            )}

            {/* 
              CROSS-DEVICE BLINKING & WINKING:
              Uses transform-box: fill-box and transform-origin: center center.
              Guarantees zero distortion and rock-solid responsiveness on Desktop, Tablet, and Mobile Safari/Chrome!
            */}
            {animated && (
              <style>{`
                @keyframes leftBlink_${cleanId} {
                  0%, 35%, 41%, 86%, 92%, 100% {
                    transform: scaleY(1);
                  }
                  38% {
                    transform: scaleY(0.1);
                  }
                  89% {
                    transform: scaleY(0.1);
                  }
                }

                @keyframes rightBlink_${cleanId} {
                  0%, 36%, 42%, 69%, 76%, 100% {
                    transform: scaleY(1);
                  }
                  39% {
                    transform: scaleY(0.1);
                  }
                  72% {
                    transform: scaleY(0.1);
                  }
                }

                @keyframes thinkingPulse_${cleanId} {
                  0%, 100% {
                    transform: scaleY(0.35);
                    opacity: 0.75;
                  }
                  50% {
                    transform: scaleY(0.75);
                    opacity: 1;
                  }
                }

                .anim-l-eye_${cleanId} {
                  transform-box: fill-box;
                  transform-origin: center center;
                  animation: ${isThinking ? `thinkingPulse_${cleanId} 1.4s ease-in-out infinite` : `leftBlink_${cleanId} 6.4s cubic-bezier(0.4, 0, 0.2, 1) infinite`};
                }

                .anim-r-eye_${cleanId} {
                  transform-box: fill-box;
                  transform-origin: center center;
                  animation: ${isThinking ? `thinkingPulse_${cleanId} 1.4s ease-in-out infinite 0.15s` : `rightBlink_${cleanId} 6.4s cubic-bezier(0.4, 0, 0.2, 1) infinite`};
                }
              `}</style>
            )}
          </defs>

          {/* Precision Squircle Accent Rim (Large Hero) */}
          {isBig && (
            <rect
              x="8"
              y="8"
              width="84"
              height="84"
              rx="22"
              stroke={`url(#${chamferId})`}
              strokeWidth="0.8"
              strokeDasharray="2 3"
              opacity="0.45"
            />
          )}

          <g filter={isBig ? `url(#${glowId})` : undefined}>
            {/* 
              1. TWO CAPSULE EYES:
              Left eye centered at (37, 37.5).
              Right eye centered at (63, 37.5).
              Dimensions: width=10, height=21, rx=5.
            */}
            
            {/* Left Capsule Eye */}
            <g className={animated ? `anim-l-eye_${cleanId}` : ''}>
              <rect
                x="32"
                y="27"
                width="10"
                height="21"
                rx="5"
                fill={`url(#${phosphorId})`}
              />
              {/* Sparkle Glint (Hero) */}
              {isBig && (
                <circle cx="35" cy="31.5" r="1.3" fill="#e9d5ff" opacity="0.95" />
              )}
            </g>

            {/* Right Capsule Eye (with distinct WINK) */}
            <g className={animated ? `anim-r-eye_${cleanId}` : ''}>
              <rect
                x="58"
                y="27"
                width="10"
                height="21"
                rx="5"
                fill={`url(#${phosphorId})`}
              />
              {/* Sparkle Glint (Hero) */}
              {isBig && (
                <circle cx="61" cy="31.5" r="1.3" fill="#e9d5ff" opacity="0.95" />
              )}
            </g>

            {/* 
              2. FORMAL POISED MOUTH (QUIET CONFIDENCE):
              - Lifted corners by 2-3 degrees (y=63.2 vs center y=65.0).
              - Dark purple visible across all screens.
              - Stroke width tuned for maximum clarity (3.0px hero / 3.6px small).
            */}
            <path
              d={isThinking
                ? "M 38 64 L 62 64"
                : "M 34 63.2 C 40 65.0, 60 65.0, 66 63.2"
              }
              stroke={isThinking ? `url(#${shimmerId})` : "#201738"}
              strokeWidth={isBig ? "3.0" : "3.6"}
              strokeLinecap="round"
              fill="none"
              opacity="0.98"
            />

            {/* Ultra-subtle lower lip reflection (Hero only) */}
            {isBig && !isThinking && (
              <path
                d="M 43 68.5 Q 50 69.5 57 68.5"
                stroke="#c084fc"
                strokeWidth="1.2"
                strokeLinecap="round"
                fill="none"
                opacity="0.4"
              />
            )}
          </g>
        </svg>
      </div>
    </div>
  );
};
