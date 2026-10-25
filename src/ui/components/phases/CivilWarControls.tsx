import { useState } from 'react';
import { areaById, civById } from '../../../data/index.js';
import { civilWarSelectionOk } from '../../../engine/helpers.js';
import type { Action, GameState } from '../../../engine/types.js';
import { useAreaPeek } from '../board/AreaPeekContext.js';

interface CivilWarControlsProps {
  state: GameState;
  legal: Action[];
  onApply: (a: Action) => void;
}

export function CivilWarControls({ state, legal, onApply }: CivilWarControlsProps) {
  const cw = state.pendingCivilWar!;
  const peek = useAreaPeek();

  const factionDesc = (f: { tokens: Record<string, number>; cities: string[] }) => {
    const toks = Object.values(f.tokens).reduce((t, n) => t + n, 0);
    const parts: string[] = [];
    const where = Object.entries(f.tokens)
      .filter(([, n]) => n > 0)
      .map(([a, n]) => `${areaById.get(a)?.name ?? a} ${n}`)
      .join(', ');
    if (toks) parts.push(`${toks} pion${toks > 1 ? 's' : ''} : ${where}`);
    if (f.cities.length) parts.push(`${f.cities.length} cité${f.cities.length > 1 ? 's' : ''} (${f.cities.map((a) => areaById.get(a)?.name ?? a).join(', ')})`);
    return parts.join(' + ') || 'rien';
  };

  const fpts = (f: { tokens: Record<string, number>; cities: string[] }) =>
    Object.values(f.tokens).reduce((t, n) => t + n, 0) + f.cities.length * 5;

  const factionAreas = (f: { tokens: Record<string, number>; cities: string[] }) => [
    ...Object.keys(f.tokens).filter((a) => (f.tokens[a] ?? 0) > 0),
    ...f.cities,
  ];

  const [tok, setTok] = useState<Record<string, number>>({});
  const [cities, setCities] = useState<string[]>([]);

  if (cw.stage === 'victimKeep') {
    const f1 = fpts(cw.faction1);
    const f2 = fpts(cw.faction2!);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span className="civ-lbl">
          Votre nation s'est scindée en deux (§30.415). Choisissez quelle faction <b>conserver</b> ;{' '}
          <b style={{ color: civById.get(cw.beneficiary)?.color }}>{civById.get(cw.beneficiary)?.name}</b> annexera l'autre :
        </span>
        <button className="civ-btn" {...peek(factionAreas(cw.faction1))} onClick={() => onApply({ type: 'civilWarKeep', faction: 1 })}>
          Garder la 1ère faction — <b>{f1} pts</b> ({factionDesc(cw.faction1)})
        </button>
        <button className="civ-btn" {...peek(factionAreas(cw.faction2!))} onClick={() => onApply({ type: 'civilWarKeep', faction: 2 })}>
          Garder la 2e faction — <b>{f2} pts</b> ({factionDesc(cw.faction2!)})
        </button>
      </div>
    );
  }

  const victimSelect = cw.stage === 'victimSelect';
  const target = victimSelect ? cw.victimPoints : cw.beneficiaryPoints;
  const tokensAvail: Record<string, number> = {};
  const citiesAvail: string[] = [];

  for (const [aid, a] of Object.entries(state.areas)) {
    if ((a.tokens[cw.victim] ?? 0) > 0) tokensAvail[aid] = a.tokens[cw.victim]!;
    if (a.city === cw.victim) citiesAvail.push(aid);
  }

  if (!victimSelect) {
    for (const [aid, n] of Object.entries(cw.faction1.tokens)) {
      tokensAvail[aid] = (tokensAvail[aid] ?? 0) - n;
      if (tokensAvail[aid]! <= 0) delete tokensAvail[aid];
    }
    const taken = new Set(cw.faction1.cities);
    for (let i = citiesAvail.length - 1; i >= 0; i--) if (taken.has(citiesAvail[i]!)) citiesAvail.splice(i, 1);
  }

  const inv = Object.keys(tokensAvail)
    .map((aid) => ({ aid, tokens: tokensAvail[aid]!, city: false }))
    .concat(citiesAvail.map((aid) => ({ aid, tokens: 0, city: true })));

  const total = Object.values(tok).reduce((t, n) => t + n, 0) + cities.length * 5;
  const ok = civilWarSelectionOk(total, target, Object.values(tokensAvail).reduce((t, n) => t + n, 0), citiesAvail.length);
  const setT = (aid: string, max: number, d: number) =>
    setTok((s) => ({ ...s, [aid]: Math.max(0, Math.min(max, (s[aid] ?? 0) + d)) }));
  const sugg = legal.find((x) => x.type === 'civilWarSelect') as Extract<Action, { type: 'civilWarSelect' }> | undefined;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="civ-lbl">
        ⚔ Guerre Civile (§30.41){victimSelect ? '' : ` — vous êtes ${civById.get(cw.beneficiary)?.name}, le bénéficiaire`}
      </span>
      <span className="civ-lbl">
        {victimSelect
          ? `Sélectionnez ${target} points d'unités pour former la première faction (§30.4121).`
          : `Saisissez ${target} points d'unités chez ${civById.get(cw.victim)?.name} pour compléter la faction (§30.4123).`}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, maxHeight: '30vh', overflowY: 'auto' }}>
        {inv.map((x) => (
          <div key={x.aid + (x.city ? ':c' : '')} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 110, color: civById.get(cw.victim)?.color }}>{areaById.get(x.aid)?.name ?? x.aid}</span>
            {!x.city && (
              <>
                <button className="civ-btn" style={{ padding: '0 7px' }} onClick={() => setT(x.aid, x.tokens, -1)}>−</button>
                <b style={{ width: 36, textAlign: 'center' }}>{tok[x.aid] ?? 0}/{x.tokens}</b>
                <button className="civ-btn" style={{ padding: '0 7px' }} onClick={() => setT(x.aid, x.tokens, +1)}>+</button>
                <span className="civ-lbl">pions</span>
              </>
            )}
            {x.city && (
              <button
                className={`civ-btn ${cities.includes(x.aid) ? 'on' : ''}`}
                style={{ fontSize: 11 }}
                onClick={() => setCities((c) => (c.includes(x.aid) ? c.filter((y) => y !== x.aid) : [...c, x.aid]))}
              >
                {cities.includes(x.aid) ? '✓ ' : ''}cité (5)
              </button>
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="civ-lbl" style={{ color: ok ? '#7caa6a' : '#caa05a' }}>
          {total} / {target} points
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {sugg && (
            <button className="civ-btn" style={{ fontSize: 11 }} onClick={() => { setTok({ ...sugg.tokens }); setCities([...(sugg.cities ?? [])]); }}>
              Suggérer
            </button>
          )}
          <button className="civ-btn" disabled={!ok} onClick={() => onApply({ type: 'civilWarSelect', tokens: tok, cities })}>
            Confirmer faction
          </button>
        </div>
      </div>
    </div>
  );
}
