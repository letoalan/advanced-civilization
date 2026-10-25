import { useState } from 'react';
import { areaById, calamityById, civById, CALAMITY_DESC } from '../../../data/index.js';
import type { Action, GameState } from '../../../engine/types.js';
import { useAreaPeek } from '../board/AreaPeekContext.js';

interface UnitLossControlsProps {
  state: GameState;
  legal: Action[];
  onApply: (a: Action) => void;
}

export function UnitLossControls({ state, legal, onApply }: UnitLossControlsProps) {
  const u = state.pendingUnitLoss!;
  const epidemic = u.calamityId === 'epidemic';
  const scope = u.areas ?? Object.keys(state.areas);
  const inv = scope
    .map((aid) => {
      const tokens = state.areas[aid]?.tokens[u.holder] ?? 0;
      const city = state.areas[aid]?.city === u.holder;
      return { aid, tokens, city, removable: epidemic ? Math.max(0, tokens - 1) : tokens };
    })
    .filter((x) => x.removable > 0 || x.city);

  const [tok, setTok] = useState<Record<string, number>>({});
  const [cities, setCities] = useState<string[]>([]);
  const [grain, setGrain] = useState(0);
  const [keep, setKeep] = useState<Record<string, number>>({});
  const keepMin = epidemic ? 1 : 0;
  const keepMax = (aid: string) =>
    Math.max(keepMin, (areaById.get(aid)?.sustains ?? 0) + (state.players[u.holder]!.advances.includes('agriculture') ? 1 : 0));
  const keepOf = (aid: string) => Math.max(keepMin, Math.min(keepMax(aid), keep[aid] ?? keepMin));
  const cityPts = (aid: string) => u.cityWorth - (keepOf(aid) - keepMin);
  const peek = useAreaPeek();

  const holderP = state.players[u.holder]!;
  const grainAvail = (holderP.hand['grain'] ?? 0) - (holderP.grainLockedThisTurn ?? 0);
  const maxGrain = u.calamityId === 'famine' && holderP.advances.includes('pottery') ? Math.min(grainAvail, Math.ceil(u.points / 4)) : 0;
  const g = Math.min(grain, maxGrain);
  const reducedPoints = u.calamityId === 'famine' ? Math.max(0, u.points - 4 * g) : u.points;
  const avail = inv.reduce((t, x) => t + x.removable + (x.city ? u.cityWorth : 0), 0);
  const target = Math.min(reducedPoints, avail);
  const total = Object.values(tok).reduce((t, n) => t + n, 0) + cities.reduce((t, aid) => t + cityPts(aid), 0);
  const remaining = Math.max(0, target - total);
  const ok = total >= target && total - target < u.cityWorth;
  const setT = (aid: string, max: number, d: number) =>
    setTok((s) => ({ ...s, [aid]: Math.max(0, Math.min(max, (s[aid] ?? 0) + d)) }));
  const sugg = legal.find((x) => x.type === 'chooseUnits') as Extract<Action, { type: 'chooseUnits' }> | undefined;
  const calName = calamityById.get(u.calamityId)?.name ?? u.calamityId;
  const banner =
    remaining > 0
      ? `${remaining} point${remaining > 1 ? 's' : ''} de pertes restant${remaining > 1 ? 's' : ''}`
      : total > target
      ? `Sélectionné — ${total} points (${total - target} en surplus)`
      : `Prêt — ${total} points sélectionnés`;
  const bannerColor = remaining > 0 ? '#ffd23f' : '#7fd17f';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ background: 'rgba(0,0,0,0.28)', border: `2px solid ${bannerColor}`, borderRadius: 8, padding: '8px 12px' }}>
        <div style={{ fontWeight: 800, color: '#ffd23f', textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 }}>
          ⚠ {calName} — choix des unités perdues{u.areas ? ' (plaine inondable)' : ''}
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: bannerColor, lineHeight: 1.2 }}>{banner}</div>
        <div style={{ fontSize: 12, color: '#cdc4ad' }}>
          Vous devez céder <b>{target}</b> point{target > 1 ? 's' : ''} (pion = 1, cité = {u.cityWorth}).
        </div>
      </div>
      {maxGrain > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', background: 'rgba(80,140,60,0.18)', border: '1px solid #5a8c4a', borderRadius: 6, padding: '5px 9px' }}>
          <span className="civ-lbl" style={{ color: '#cfe8c0' }}>
            🌾 Poterie : engager du Grain pour atténuer la famine (−4 chacun) :
          </span>
          <button className="civ-btn" style={{ padding: '0 7px' }} onClick={() => setGrain((v) => Math.max(0, v - 1))} disabled={g <= 0}>−</button>
          <b>{g}</b><span className="civ-lbl">/ {maxGrain}</span>
          <button className="civ-btn" style={{ padding: '0 7px' }} onClick={() => setGrain((v) => Math.min(maxGrain, v + 1))} disabled={g >= maxGrain}>+</button>
          <span className="civ-lbl" style={{ color: '#5a3410' }}>perte {u.points} → <b>{reducedPoints}</b></span>
        </div>
      )}
      {CALAMITY_DESC[u.calamityId] && <span className="civ-lbl" style={{ color: '#5a3410' }}>{CALAMITY_DESC[u.calamityId]}</span>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: '30vh', overflowY: 'auto' }}>
        {inv.map((x) => (
          <div key={x.aid} style={{ display: 'flex', alignItems: 'center', gap: 6 }} {...peek(x.aid)}>
            <span style={{ width: 110, color: '#3a2207', fontWeight: 700, borderLeft: `5px solid ${civById.get(u.holder)?.color ?? '#ccc'}`, paddingLeft: 6 }}>
              {areaById.get(x.aid)?.name ?? x.aid}
            </span>
            {x.removable > 0 && (
              <>
                <button className="civ-btn" style={{ padding: '0 7px' }} onClick={() => setT(x.aid, x.removable, -1)}>−</button>
                <b style={{ width: 36, textAlign: 'center' }}>{tok[x.aid] ?? 0}/{x.removable}</b>
                <button className="civ-btn" style={{ padding: '0 7px' }} onClick={() => setT(x.aid, x.removable, +1)}>+</button>
                <span className="civ-lbl" style={{ color: '#5a3410' }}>pions{epidemic ? ' (1 subsiste)' : ''}</span>
              </>
            )}
            {x.city && (
              <button
                className={`civ-btn ${cities.includes(x.aid) ? 'on' : ''}`}
                style={{ fontSize: 11 }}
                onClick={() => setCities((c) => (c.includes(x.aid) ? c.filter((y) => y !== x.aid) : [...c, x.aid]))}
              >
                {cities.includes(x.aid) ? '✗ ' : ''}cité ({cities.includes(x.aid) ? cityPts(x.aid) : u.cityWorth})
              </button>
            )}
            {x.city && cities.includes(x.aid) && keepMax(x.aid) > keepMin && (
              <>
                <span className="civ-lbl" style={{ color: '#5a3410' }}>laisser</span>
                <button className="civ-btn" style={{ padding: '0 7px' }} disabled={keepOf(x.aid) <= keepMin} onClick={() => setKeep((k) => ({ ...k, [x.aid]: keepOf(x.aid) - 1 }))}>−</button>
                <b>{keepOf(x.aid)}</b>
                <button className="civ-btn" style={{ padding: '0 7px' }} disabled={keepOf(x.aid) >= keepMax(x.aid)} onClick={() => setKeep((k) => ({ ...k, [x.aid]: keepOf(x.aid) + 1 }))}>+</button>
              </>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
        {sugg && (
          <button
            className="civ-btn"
            style={{ fontSize: 11 }}
            onClick={() => {
              setTok({ ...sugg.tokens });
              setCities([...(sugg.cities ?? [])]);
              setGrain(sugg.grainCommit ?? 0);
              setKeep({});
            }}
          >
            Suggérer
          </button>
        )}
        <button
          className="civ-btn"
          disabled={!ok}
          onClick={() =>
            onApply({
              type: 'chooseUnits',
              tokens: tok,
              cities,
              cityKeep: Object.fromEntries(cities.map((aid) => [aid, keepOf(aid)])),
              grainCommit: g,
            })
          }
        >
          Valider les pertes
        </button>
      </div>
    </div>
  );
}
