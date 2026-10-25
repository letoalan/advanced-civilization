import { areaById } from '../../../data/index.js';
import { areaLimitFor } from '../../../engine/index.js';
import type { Action, GameState, PlayerId } from '../../../engine/types.js';
import { useAreaPeek } from '../board/AreaPeekContext.js';

interface CityConstructionControlsProps {
  state: GameState;
  legal: Action[];
  actor: PlayerId;
  onApply: (a: Action) => void;
}

export function CityConstructionControls({ state, legal, actor, onApply }: CityConstructionControlsProps) {
  const peek = useAreaPeek();
  const builds = legal.filter((a) => a.type === 'buildCity') as Extract<Action, { type: 'buildCity' }>[];
  const cities = Object.values(state.areas).filter((a) => a.city === actor).length;
  const p = state.players[actor]!;
  const archReady = p.advances.includes('architecture') && !p.builtWithTreasuryThisTurn;
  const pass = legal.find((a) => a.type === 'pass');

  const supportAfter = (buildArea: string) =>
    Object.entries(state.areas)
      .filter(([aid]) => aid !== buildArea)
      .reduce((sum, [aid, a]) => sum + Math.min(a.tokens[actor] ?? 0, a.city ? 0 : areaLimitFor(state, aid, actor)), 0);

  const anyUnsupported = builds.some((b) => supportAfter(b.area) < 2 * (cities + 1));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {builds.length === 0 && (
        <span className="civ-lbl">
          Aucune cité constructible (6 pions sur un site de cité requis{archReady ? ', ou 3 avec Architecture + 3 trésors' : ''}).
        </span>
      )}
      {builds.length > 0 && !anyUnsupported ? (
        <span className="civ-lbl">✓ Soutien démographique suffisant pour ces cités (§26.31 : 2 pions par cité).</span>
      ) : (
        <span className="civ-lbl">
          Chaque cité exige <b>2 pions de soutien ailleurs</b> sur le plateau (§26.31).
          {anyUnsupported ? ' Les constructions marquées ⚠ manquent de soutien.' : ''}
        </span>
      )}
      {archReady && (
        <span className="civ-lbl">
          Architecture : une cité peut être financée jusqu'à moitié par le trésor ({p.treasury} en réserve).
        </span>
      )}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {builds.map((b, i) => {
          const unsupported = supportAfter(b.area) < 2 * (cities + 1);
          const fromTreasury = b.useTreasury ?? 0;
          return (
            <button
              className="civ-btn"
              key={i}
              style={unsupported ? { borderColor: '#c0392b' } : undefined}
              {...peek(b.area)}
              onClick={() => {
                if (
                  !unsupported ||
                  confirm(`Soutien insuffisant : la cité en ${areaById.get(b.area)?.name} sera immédiatement réduite (§26.31). Construire quand même ?`)
                ) {
                  onApply(b);
                }
              }}
            >
              Fonder cité à {areaById.get(b.area)?.name}
              {fromTreasury > 0 ? ` (Architecture : ${fromTreasury} trésors)` : ''}
              {unsupported ? ' ⚠' : ''}
            </button>
          );
        })}
      </div>
      {pass && (
        <button className="civ-btn" onClick={() => onApply(pass)}>
          Terminer la construction (passer)
        </button>
      )}
    </div>
  );
}
