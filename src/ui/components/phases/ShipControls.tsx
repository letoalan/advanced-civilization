import { areaById } from '../../../data/index.js';
import type { Action, GameState, PlayerId } from '../../../engine/types.js';

interface ShipControlsProps {
  state: GameState;
  legal: Action[];
  actor: PlayerId;
  onApply: (a: Action) => void;
}

export function ShipControls({ state, legal, actor, onApply }: ShipControlsProps) {
  const builds = legal.filter((a) => a.type === 'buildShips') as Extract<Action, { type: 'buildShips' }>[];
  const scraps = legal.filter((a) => a.type === 'scrapShip') as Extract<Action, { type: 'scrapShip' }>[];
  const levies = legal.filter((a) => a.type === 'maintainShip') as Extract<Action, { type: 'maintainShip' }>[];
  const owed = state.shipMaintOwed?.[actor] ?? 0;
  const pass = legal.find((a) => a.type === 'pass');

  const buildRows = new Map<string, typeof builds>();
  const payLabel = (b: (typeof builds)[number]) => {
    const bd = b.builds[0]!;
    const here = state.areas[bd.area]?.tokens[actor] ?? 0;
    const tr = state.players[actor]!.treasury;
    if (bd.payFrom === 'split') return '1 pop + 1 trésor';
    if (bd.payFrom === 'treasury') return tr >= 2 ? '2 trésor' : '1 trésor + 1 pop';
    return here >= 2 ? '2 pop' : '1 pop + 1 trésor';
  };

  for (const b of builds) {
    const aid = b.builds[0]!.area;
    const row = buildRows.get(aid) ?? [];
    if (!row.some((r) => payLabel(r) === payLabel(b))) buildRows.set(aid, [...row, b]);
  }

  const undo = legal.find((a) => a.type === 'undoShip');
  const steps = state.shipSteps?.[actor] ?? [];
  const built = state.shipsBuiltThisPhase?.[actor] ?? {};

  const fleet = Object.entries(state.areas)
    .filter(([, a]) => (a.ships?.[actor] ?? 0) > 0)
    .map(([aid, a]) => {
      const n = a.ships![actor]!;
      const nb = Math.min(n, built[aid] ?? 0);
      return `${areaById.get(aid)?.name ?? aid}${n > 1 ? ` ×${n}` : ''}${nb ? ` (${nb === n ? '' : `${nb} `}nouveau)` : ''}`;
    });

  const unpaidIn = (aid: string) =>
    Math.max(
      0,
      Math.min(
        (state.areas[aid]?.ships?.[actor] ?? 0) -
          (built[aid] ?? 0) -
          steps.filter((st) => st.kind === 'maintain' && st.area === aid).length,
        owed,
      ),
    );

  const stepText = (st: (typeof steps)[number]) =>
    st.kind === 'build'
      ? `construit un navire à ${areaById.get(st.area)?.name} (${[st.fromArea && `${st.fromArea} pop`, st.fromTreasury && `${st.fromTreasury} trésor`].filter(Boolean).join(' + ')})`
      : st.kind === 'maintain'
      ? `entretenu le navire à ${areaById.get(st.area)?.name} via 1 pion local`
      : `démantelé le navire à ${areaById.get(st.area)?.name}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span className="civ-lbl">⛵ Flotte actuelle : {fleet.length ? fleet.join(', ') : 'aucun navire'}</span>
      {steps.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span className="civ-lbl">Actions : {steps.map(stepText).join(' ; ')}.</span>
          {undo && (
            <button className="civ-btn" style={{ fontSize: 11 }} onClick={() => onApply(undo)}>
              ↶ Annuler dernière action
            </button>
          )}
        </div>
      )}
      {builds.length === 0 && <span className="civ-lbl">Aucun navire constructible (zone côtière + 2 pions requis, max 4 navires).</span>}
      {[...buildRows].map(([aid, row]) => (
        <div key={aid} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4 }}>
          <span className="civ-lbl">⛵ Construire à {areaById.get(aid)?.name} :</span>
          {row.map((b, i) => (
            <button className="civ-btn" key={i} style={{ fontSize: 11 }} onClick={() => onApply(b)}>
              {payLabel(b)}
            </button>
          ))}
        </div>
      ))}
      {(scraps.length > 0 || levies.length > 0) && (
        <>
          <span className="civ-lbl" style={{ color: '#cdc4ad' }}>
            Entretien : 1 pion par navire conservé (§22.3) — {owed} en attente, prélevé sur le trésor en fin de phase :
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {levies.map((m, i) => {
              const left = unpaidIn(m.area);
              return (
                <button className="civ-btn" key={`m${i}`} style={{ fontSize: 11 }} onClick={() => onApply(m)}>
                  ⚓ Entretenir à {areaById.get(m.area)?.name}
                  {left > 1 ? ` (${left} dus ici)` : ''} — 1 pop locale
                </button>
              );
            })}
            {scraps.map((sc, i) => (
              <button className="civ-btn" key={i} style={{ fontSize: 11 }} onClick={() => onApply(sc)}>
                ✗ Démanteler navire à {areaById.get(sc.area)?.name}
              </button>
            ))}
          </div>
        </>
      )}
      {pass && (
        <button className="civ-btn" onClick={() => onApply(pass)}>
          Terminer la phase navale (passer)
        </button>
      )}
    </div>
  );
}
