export function BoardAntiqueDefs() {
  return (
    <defs>
      {/* Antique Sea radial gradient: slightly deeper in oceanic centers */}
      <radialGradient id="atlas-sea-gradient" cx="50%" cy="50%" r="65%" fx="45%" fy="45%">
        <stop offset="0%" stopColor="#153647" />
        <stop offset="60%" stopColor="#112d3b" />
        <stop offset="100%" stopColor="#0b1e28" />
      </radialGradient>

      {/* Warm parchment gradient for land territories */}
      <linearGradient id="atlas-land-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f2e9d7" />
        <stop offset="50%" stopColor="#ebe1cb" />
        <stop offset="100%" stopColor="#dfd3bb" />
      </linearGradient>

      {/* Coastal land gradient with subtle shoreline shadow */}
      <linearGradient id="atlas-coast-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f0e6d2" />
        <stop offset="100%" stopColor="#e3d6bc" />
      </linearGradient>

      {/* Out of play muted hatching pattern */}
      <pattern id="atlas-out-hatch" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="16" stroke="#2c333d" strokeWidth="2.5" />
      </pattern>

      {/* Tactile drop shadow for pieces (citadels, tokens, triremes) */}
      <filter id="atlas-piece-shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0.5" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.55" />
      </filter>

      {/* Fortress Acropolis shadow */}
      <filter id="atlas-city-shadow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="1" dy="2.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.65" />
      </filter>

      {/* Subtle gold glow for active/hovered zones */}
      <filter id="atlas-golden-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#f5c242" floodOpacity="0.8" />
      </filter>

      {/* Token bevel overlay gradient for tactile 3D look */}
      <linearGradient id="atlas-token-bevel" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
        <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="55%" stopColor="#000000" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.38" />
      </linearGradient>
    </defs>
  );
}
