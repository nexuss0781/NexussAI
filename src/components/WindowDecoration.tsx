import React from 'react';

export const WindowDecoration: React.FC = () => {
  // Deep, vibrant futuristic violet/purple palette matching Nexuss design exactly
  const colors = {
    primary: '#a855f7',      // Bright futuristic violet
    secondary: '#d8b4fe',    // Soft glowing light lavender/purple
    glow: 'rgba(168, 85, 247, 0.4)',
    accentBg: '#1e1136'      // Deep tech-purple background accent
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden select-none">
      
      {/* ==========================================
          1. TOP-LEFT CORNER BRACKET (Clasps the screen corner)
         ========================================== */}
      <div className="absolute top-0 left-0 w-44 sm:w-80 h-10 sm:h-16 transition-all duration-300">
        <svg
          viewBox="0 0 320 64"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main outer techno border */}
          <path
            d="M 8 16 L 45 16 L 60 30 L 165 30 L 180 16 L 245 16"
            stroke={colors.primary}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.95"
          />
          
          {/* Slanted stripe vent cluster (//////) */}
          <g stroke={colors.secondary} strokeWidth="2.5" opacity="0.9">
            <line x1="75" y1="21" x2="80" y2="26" strokeLinecap="round" />
            <line x1="83" y1="21" x2="88" y2="26" strokeLinecap="round" />
            <line x1="91" y1="21" x2="96" y2="26" strokeLinecap="round" />
            <line x1="99" y1="21" x2="104" y2="26" strokeLinecap="round" />
            <line x1="107" y1="21" x2="112" y2="26" strokeLinecap="round" />
            <line x1="115" y1="21" x2="120" y2="26" strokeLinecap="round" />
            <line x1="123" y1="21" x2="128" y2="26" strokeLinecap="round" />
            <line x1="131" y1="21" x2="136" y2="26" strokeLinecap="round" />
          </g>

          {/* Underlay tracking lines with terminal circular node */}
          <path
            d="M 8 8 L 260 8 L 275 22 L 305 22"
            stroke={colors.primary}
            strokeWidth="1"
            opacity="0.6"
          />
          <circle cx="305" cy="22" r="2.5" fill={colors.secondary} />

          {/* Glowing dot panel indicator */}
          <circle cx="28" cy="16" r="2" fill="#ffffff" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="28" cy="16" r="2" fill={colors.secondary} />
          
          {/* Futuristic geometric notch */}
          <polygon
            points="145,21 160,21 155,26 140,26"
            fill={colors.primary}
            opacity="0.4"
          />
        </svg>
      </div>

      {/* ==========================================
          2. TOP-RIGHT CORNER BRACKET (Symmetrical design counterpart)
         ========================================== */}
      <div className="absolute top-0 right-0 w-44 sm:w-80 h-10 sm:h-16 scale-x-[-1] transition-all duration-300">
        <svg
          viewBox="0 0 320 64"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(168,85,247,0.45)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Main outer border */}
          <path
            d="M 8 16 L 45 16 L 60 30 L 165 30 L 180 16 L 245 16"
            stroke={colors.primary}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.95"
          />
          
          {/* Vents */}
          <g stroke={colors.secondary} strokeWidth="2.5" opacity="0.9">
            <line x1="75" y1="21" x2="80" y2="26" strokeLinecap="round" />
            <line x1="83" y1="21" x2="88" y2="26" strokeLinecap="round" />
            <line x1="91" y1="21" x2="96" y2="26" strokeLinecap="round" />
            <line x1="99" y1="21" x2="104" y2="26" strokeLinecap="round" />
            <line x1="107" y1="21" x2="112" y2="26" strokeLinecap="round" />
            <line x1="115" y1="21" x2="120" y2="26" strokeLinecap="round" />
            <line x1="123" y1="21" x2="128" y2="26" strokeLinecap="round" />
            <line x1="131" y1="21" x2="136" y2="26" strokeLinecap="round" />
          </g>

          <path
            d="M 8 8 L 260 8 L 275 22 L 305 22"
            stroke={colors.primary}
            strokeWidth="1"
            opacity="0.6"
          />
          <circle cx="305" cy="22" r="2.5" fill={colors.secondary} />

          <circle cx="28" cy="16" r="2" fill="#ffffff" className="animate-ping" style={{ animationDuration: '4s' }} />
          <circle cx="28" cy="16" r="2" fill={colors.secondary} />
          
          <polygon
            points="145,21 160,21 155,26 140,26"
            fill={colors.primary}
            opacity="0.4"
          />
        </svg>
      </div>

      {/* ==========================================
          3. RIGHT VERTICAL EDGE ORNAMENT (Inspired by Canva rightmost element)
         ========================================== */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-8 h-96 hidden md:block transition-all duration-300">
        <svg
          viewBox="0 0 32 384"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Thin outer vertical rail line */}
          <path
            d="M 8 10 L 8 135 L 18 145 L 18 245 L 8 255 L 8 370"
            stroke={colors.primary}
            strokeWidth="1"
            opacity="0.5"
          />

          {/* Slanted hash-vent cluster at the top */}
          <g stroke={colors.primary} strokeWidth="2" opacity="0.9">
            <line x1="14" y1="20" x2="22" y2="12" />
            <line x1="14" y1="28" x2="22" y2="20" />
            <line x1="14" y1="36" x2="22" y2="28" />
            <line x1="14" y1="44" x2="22" y2="36" />
            <line x1="14" y1="52" x2="22" y2="44" />
            <line x1="14" y1="60" x2="22" y2="52" />
          </g>

          {/* Solid futuristic polygon track center bar */}
          <polygon
            points="10,147 22,147 22,243 10,243"
            fill={colors.primary}
            opacity="0.8"
          />
          {/* Hollow inner cut out */}
          <polygon
            points="12,152 20,152 20,238 12,238"
            fill="#000000"
          />

          {/* Subtle neon glowing accent inside the center bar */}
          <rect
            x="14"
            y="160"
            width="4"
            height="70"
            rx="1"
            fill={colors.secondary}
            className="animate-pulse"
            style={{ animationDuration: '2.5s' }}
          />

          {/* Lower vertical trace and terminal node with glowing effect */}
          <line x1="18" y1="250" x2="18" y2="360" stroke={colors.primary} strokeWidth="1" opacity="0.6" />
          <circle cx="18" cy="360" r="3" fill={colors.secondary} className="animate-pulse" />
        </svg>
      </div>

      {/* ==========================================
          4. LEFT VERTICAL EDGE ORNAMENT (Symmetrical design counterpart)
         ========================================== */}
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-8 h-96 hidden md:block scale-x-[-1] transition-all duration-300">
        <svg
          viewBox="0 0 32 384"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 8 10 L 8 135 L 18 145 L 18 245 L 8 255 L 8 370"
            stroke={colors.primary}
            strokeWidth="1"
            opacity="0.5"
          />

          <g stroke={colors.primary} strokeWidth="2" opacity="0.9">
            <line x1="14" y1="20" x2="22" y2="12" />
            <line x1="14" y1="28" x2="22" y2="20" />
            <line x1="14" y1="36" x2="22" y2="28" />
            <line x1="14" y1="44" x2="22" y2="36" />
            <line x1="14" y1="52" x2="22" y2="44" />
            <line x1="14" y1="60" x2="22" y2="52" />
          </g>

          <polygon
            points="10,147 22,147 22,243 10,243"
            fill={colors.primary}
            opacity="0.8"
          />
          <polygon
            points="12,152 20,152 20,238 12,238"
            fill="#000000"
          />

          <rect
            x="14"
            y="160"
            width="4"
            height="70"
            rx="1"
            fill={colors.secondary}
            className="animate-pulse"
            style={{ animationDuration: '3s' }}
          />

          <line x1="18" y1="250" x2="18" y2="360" stroke={colors.primary} strokeWidth="1" opacity="0.6" />
          <circle cx="18" cy="360" r="3" fill={colors.secondary} className="animate-pulse" />
        </svg>
      </div>

      {/* ==========================================
          5. BOTTOM EDGE STATUS RAIL (Futuristic tracking bar with circle metrics)
         ========================================== */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-72 sm:w-96 h-10 sm:h-12 transition-all duration-300">
        <svg
          viewBox="0 0 384 48"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(168,85,247,0.35)]"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Dual track line structure */}
          <path
            d="M 12 32 L 130 32 L 140 20 L 244 20 L 254 32 L 372 32"
            stroke={colors.primary}
            strokeWidth="1.5"
            opacity="0.85"
          />
          <path
            d="M 24 40 L 126 40 L 134 28 L 250 28 L 258 40 L 360 40"
            stroke={colors.secondary}
            strokeWidth="1"
            opacity="0.5"
          />

          {/* 8-dot Status Node Circle Group (○○○○○○○○) */}
          <g stroke={colors.primary} strokeWidth="1.2" fill="none" opacity="0.9">
            <circle cx="140" cy="28" r="3" />
            <circle cx="152" cy="28" r="3" />
            <circle cx="164" cy="28" r="3" />
            <circle cx="176" cy="28" r="3" />
            <circle cx="188" cy="28" r="3" fill={colors.secondary} className="animate-pulse" /> {/* Glowing active node */}
            <circle cx="200" cy="28" r="3" />
            <circle cx="212" cy="28" r="3" />
            <circle cx="224" cy="28" r="3" />
            <circle cx="236" cy="28" r="3" />
            <circle cx="248" cy="28" r="3" />
          </g>

          {/* Slanted lines clusters at bottom ends */}
          <g stroke={colors.secondary} strokeWidth="2" opacity="0.8">
            {/* Left group */}
            <line x1="45" y1="35" x2="50" y2="38" />
            <line x1="53" y1="35" x2="58" y2="38" />
            <line x1="61" y1="35" x2="66" y2="38" />
            <line x1="69" y1="35" x2="74" y2="38" />

            {/* Right group */}
            <line x1="310" y1="35" x2="315" y2="38" />
            <line x1="318" y1="35" x2="323" y2="38" />
            <line x1="326" y1="35" x2="331" y2="38" />
            <line x1="334" y1="35" x2="339" y2="38" />
          </g>
        </svg>
      </div>

    </div>
  );
};
