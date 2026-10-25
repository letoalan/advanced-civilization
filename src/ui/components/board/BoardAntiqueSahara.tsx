import { ATLAS_THEME } from './boardTheme.js';

export const SAHARA_INTERIEUR_POINTS =
  '0,1157.5 213.7,1157.1 403.5,1157.5 529.3,1157.5 624.3,1157.1 676.8,1158 675,1256 677,1405 0,1405';

// Mountain peak glyph for antique cartography: small shaded pyramid/triangle
function MountainPeak({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  const w = 10 * s;
  const h = 13 * s;
  return (
    <g opacity={0.65}>
      {/* Lit western face */}
      <polygon
        points={`${x},${y - h} ${x - w},${y} ${x},${y}`}
        fill="#c8ad88"
        stroke="#5a432d"
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
      {/* Shaded eastern face */}
      <polygon
        points={`${x},${y - h} ${x},${y} ${x + w},${y}`}
        fill="#8a6948"
        stroke="#5a432d"
        strokeWidth={0.7}
        strokeLinejoin="round"
      />
    </g>
  );
}

export function BoardAntiqueSahara({ isOut }: { isOut?: boolean }) {
  if (isOut) {
    return (
      <g id="atlas-sahara-interieur-out" pointerEvents="none">
        <polygon points={SAHARA_INTERIEUR_POINTS} strokeLinejoin="round" strokeWidth={1.2} fill="#1d2127" stroke="#363f4b" />
        <polygon points={SAHARA_INTERIEUR_POINTS} strokeLinejoin="round" fill="url(#atlas-out-hatch)" opacity={0.35} />
      </g>
    );
  }

  const cx = 330;
  const cy = 1290;

  return (
    <g id="atlas-sahara-interieur" pointerEvents="none">
      {/* Plausible continental landmass polygon hugging adjacent provinces */}
      <polygon
        points={SAHARA_INTERIEUR_POINTS}
        fill="url(#atlas-land-gradient)"
        stroke="#7c6346"
        strokeWidth={1.1}
        strokeDasharray="4 2.5"
        strokeLinejoin="round"
      />

      {/* Atlas Mountain range barrier along the northern boundary (Haut Atlas / Atlas Saharien) */}
      <g id="atlas-sahara-mountains">
        <MountainPeak x={60} y={1164} s={1.1} />
        <MountainPeak x={95} y={1166} s={0.9} />
        <MountainPeak x={135} y={1163} s={1.2} />
        <MountainPeak x={175} y={1165} s={0.85} />
        <MountainPeak x={255} y={1163} s={1.15} />
        <MountainPeak x={290} y={1165} s={0.95} />
        <MountainPeak x={335} y={1162} s={1.2} />
        <MountainPeak x={370} y={1165} s={0.85} />
        <MountainPeak x={440} y={1163} s={1.1} />
        <MountainPeak x={480} y={1166} s={0.9} />
        <MountainPeak x={565} y={1164} s={1.15} />
        <MountainPeak x={595} y={1166} s={0.85} />
        {/* Hoggar / Ahaggar massif in the deep southern interior */}
        <MountainPeak x={580} y={1370} s={1.3} />
        <MountainPeak x={615} y={1375} s={1.0} />
        <MountainPeak x={645} y={1380} s={1.1} />
        <MountainPeak x={550} y={1382} s={0.8} />
      </g>

      {/* Sand dunes and ripples of the Grand Erg */}
      <g id="atlas-sahara-dunes" stroke="#b69567" fill="none" strokeWidth={1.1} opacity={0.55}>
        <path d="M 90 1230 Q 120 1222 150 1230 Q 180 1238 210 1230" />
        <path d="M 170 1260 Q 200 1252 230 1260 Q 260 1268 290 1260" />
        <path d="M 80 1320 Q 110 1312 140 1320 Q 170 1328 200 1320" />
        <path d="M 160 1360 Q 190 1352 220 1360 Q 250 1368 280 1360" />
        <path d="M 370 1225 Q 400 1217 430 1225 Q 460 1233 490 1225" />
        <path d="M 440 1255 Q 470 1247 500 1255 Q 530 1263 560 1255" />
        <path d="M 390 1345 Q 420 1337 450 1345 Q 480 1353 510 1345" />
      </g>

      {/* Ancient Trans-Saharan caravan track */}
      <path
        d="M 540 1175 Q 460 1230 380 1285 T 180 1380"
        stroke="#967752"
        strokeWidth={1}
        strokeDasharray="2.5 3.5"
        fill="none"
        opacity={0.45}
      />
      <text
        x={270}
        y={1348}
        transform="rotate(24 270 1348)"
        fill="#826442"
        opacity={0.45}
        fontSize={8}
        fontFamily={ATLAS_THEME.fontSerif}
        fontStyle="italic"
        letterSpacing={1.5}
      >
        Piste des caravanes
      </text>

      {/* Capacity Badge: ≤0 (0 population, 0 city) */}
      <g filter="url(#atlas-piece-shadow)">
        <rect
          x={cx - 15}
          y={cy - 50}
          width={30}
          height={16}
          rx={8}
          fill="#231c12"
          stroke="#caa765"
          strokeWidth={1}
        />
        <text
          x={cx}
          y={cy - 38}
          textAnchor="middle"
          fontSize={10}
          fontWeight="800"
          fill="#f7f1e1"
        >
          ≤0
        </text>
      </g>

      {/* Main territory label: SAHARA INTÉRIEUR */}
      <text
        x={cx}
        y={cy - 14}
        textAnchor="middle"
        fontFamily={ATLAS_THEME.fontSerif}
        fontSize={14.5}
        fontWeight="bold"
        letterSpacing={3.5}
        fill="#3d2e1f"
        stroke="rgba(255, 252, 243, 0.95)"
        strokeWidth={2.6}
        strokeLinejoin="round"
        paintOrder="stroke fill"
      >
        SAHARA INTÉRIEUR
      </text>

      {/* Sub-label explicitly stating 0 population, 0 city */}
      <text
        x={cx}
        y={cy + 3}
        textAnchor="middle"
        fontFamily={ATLAS_THEME.fontSerif}
        fontSize={9.5}
        fontStyle="italic"
        letterSpacing={1.2}
        fill="#5a422b"
        stroke="rgba(255, 252, 243, 0.9)"
        strokeWidth={2}
        strokeLinejoin="round"
        paintOrder="stroke fill"
      >
        (0 population · 0 cité)
      </text>
    </g>
  );
}
