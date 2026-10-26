export function BoardAntiqueDefs() {
  return (
    <defs>
      {/* Antique Sea deep bathymetric gradient: imperial slate blue to dark antique turquoise */}
      <radialGradient id="atlas-sea-gradient" cx="50%" cy="48%" r="68%" fx="46%" fy="44%">
        <stop offset="0%" stopColor="#1a4254" />
        <stop offset="45%" stopColor="#122f3e" />
        <stop offset="80%" stopColor="#102a3a" />
        <stop offset="100%" stopColor="#081620" />
      </radialGradient>

      {/* Deluxe warm grain parchment gradient for land territories */}
      <linearGradient id="atlas-land-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ebd9b4" />
        <stop offset="50%" stopColor="#e2cd9f" />
        <stop offset="100%" stopColor="#dfc698" />
      </linearGradient>

      {/* Coastal land gradient with delicate sun-baked shoreline edge */}
      <linearGradient id="atlas-coast-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#eee0c0" />
        <stop offset="100%" stopColor="#dfc698" />
      </linearGradient>

      {/* Out of play muted antique diagonal engraving hatching */}
      <pattern id="atlas-out-hatch" width="16" height="16" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
        <line x1="0" y1="0" x2="0" y2="16" stroke="#242c36" strokeWidth="2.2" />
      </pattern>

      {/* Tactile drop shadow for circular tokens, citadels, triremes */}
      <filter id="atlas-piece-shadow" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0.6" dy="1.6" stdDeviation="1.6" floodColor="#000000" floodOpacity="0.6" />
      </filter>

      {/* Monumental acropolis & city shadow */}
      <filter id="atlas-city-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="1.2" dy="2.8" stdDeviation="2.4" floodColor="#000000" floodOpacity="0.7" />
      </filter>

      {/* Subtle gold glow for active/hovered zones */}
      <filter id="atlas-golden-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="4.5" floodColor="#f5c242" floodOpacity="0.85" />
      </filter>

      {/* Circular token chamfer/bevel radial gradient for lacquered antique finish */}
      <radialGradient id="atlas-token-circular-bevel" cx="35%" cy="32%" r="65%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="40%" stopColor="#ffffff" stopOpacity="0.12" />
        <stop offset="70%" stopColor="#000000" stopOpacity="0.0" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
      </radialGradient>

      {/* Rectangular token bevel fallback */}
      <linearGradient id="atlas-token-bevel" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
        <stop offset="45%" stopColor="#ffffff" stopOpacity="0.08" />
        <stop offset="55%" stopColor="#000000" stopOpacity="0.08" />
        <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
      </linearGradient>

      {/* Double-walled citadel monumental stone foundation gradient */}
      <linearGradient id="atlas-citadel-base" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#8c7853" />
        <stop offset="100%" stopColor="#4a3e2b" />
      </linearGradient>
    </defs>
  );
}
