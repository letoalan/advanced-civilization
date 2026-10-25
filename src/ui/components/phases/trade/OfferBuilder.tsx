import { useState } from 'react';
import { commodityById, calamityById } from '../../../../data/index.js';
import { bundleFace, handValue } from '../../../../engine/helpers.js';
import type { TradeBundle } from '../../../../engine/types.js';

export const COMMODITY_ORDER = [
  'ochre', 'hides', 'iron', 'papyrus', 'salt', 'timber', 'grain', 'oil',
  'cloth', 'wine', 'bronze', 'silver', 'resin', 'spices', 'dye', 'gems', 'gold', 'ivory',
];

export const isCal = (c: string) => c.startsWith('calamity:');
export const isGivableCard = (c: string) => !isCal(c) || calamityById.get(c.slice(9))?.tradable === true;
export const byCardValue = (a: string, b: string) =>
  (isCal(a) ? 1000 : commodityById.get(a)?.value ?? 0) - (isCal(b) ? 1000 : commodityById.get(b)?.value ?? 0);

interface OfferBuilderProps {
  me: { hand: Record<string, number> };
  submitLabel: string;
  onSubmit: (give: TradeBundle, wants: string[]) => void;
  wantPicker: boolean;
  receive?: TradeBundle;
}

export function OfferBuilder({ me, submitLabel, onSubmit, wantPicker, receive }: OfferBuilderProps) {
  const [give, setGive] = useState<Record<string, number>>({});
  const [guar, setGuar] = useState<Record<string, number>>({});
  const [claim, setClaim] = useState<Record<string, string>>({});
  const [wants, setWants] = useState<string[]>([]);

  const cName = (c: string) => (isCal(c) ? `⚠ ${c.slice(9)}` : commodityById.get(c)?.name ?? c);
  const total = Object.values(give).reduce((a, b) => a + b, 0);
  const named = Object.values(guar).reduce((a, b) => a + b, 0);
  const declared: Record<string, number> = {};
  const claimed: Record<string, number> = {};

  for (const [c, n] of Object.entries(give)) {
    const g = Math.min(n, guar[c] ?? 0);
    if (g > 0) declared[c] = g;
    const said = claim[c] ?? '';
    if (n - g > 0 && said) claimed[said] = (claimed[said] ?? 0) + (n - g);
  }

  const wantsOk = !wantPicker || (wants.length >= 1 && wants.length <= 5);
  const ok = total >= 3 && named >= 2 && wantsOk;

  const add = (c: string) => {
    if ((give[c] ?? 0) >= (me.hand[c] ?? 0)) return;
    setGive((g) => ({ ...g, [c]: (g[c] ?? 0) + 1 }));
    if (!isCal(c) && named < 2) setGuar((g) => ({ ...g, [c]: (g[c] ?? 0) + 1 }));
  };

  const rm = (c: string) => {
    const n = (give[c] ?? 0) - 1;
    setGive((g) => {
      const o = { ...g };
      if (n <= 0) delete o[c];
      else o[c] = n;
      return o;
    });
    setGuar((g) => {
      const o = { ...g };
      if (n <= 0) delete o[c];
      else if ((o[c] ?? 0) > n) o[c] = n;
      return o;
    });
  };

  const bumpGuar = (c: string, d: number) =>
    setGuar((g) => ({ ...g, [c]: Math.max(0, Math.min(give[c] ?? 0, (g[c] ?? 0) + d)) }));

  const toggleWant = (c: string) =>
    setWants((w) => (w.includes(c) ? w.filter((x) => x !== c) : w.length < 5 ? [...w, c] : w));

  const submit = () => {
    onSubmit({ actual: give, declared, count: total, claimed }, wants);
    setGive({});
    setGuar({});
    setClaim({});
    setWants([]);
  };

  const gain = (() => {
    if (!receive) return null;
    const rf = bundleFace(receive);
    const after = { ...me.hand };
    for (const [c, k] of Object.entries(give)) {
      after[c] = (after[c] ?? 0) - k;
      if (after[c]! <= 0) delete after[c];
    }
    for (const m of [rf.guaranteed, rf.claimed]) {
      for (const [c, k] of Object.entries(m)) after[c] = (after[c] ?? 0) + k;
    }
    return handValue(after) - handValue(me.hand);
  })();

  const hint = total < 3
    ? 'Choisissez au moins 3 cartes à céder (§28.2).'
    : named < 2
    ? 'Nommez au moins 2 cartes (les cartes nommées sont garanties, §28.3).'
    : !wantsOk
    ? 'Indiquez 1 à 5 marchandises souhaitées.'
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, border: '1px solid #7a4a18', borderRadius: 4, padding: 6 }}>
      <span className="civ-lbl">Votre main — cliquez pour ajouter au lot :</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {Object.entries(me.hand)
          .filter(([c, n]) => n > 0 && isGivableCard(c))
          .sort((a, b) => byCardValue(a[0], b[0]))
          .map(([c, n]) => (
            <button key={c} className="civ-btn" disabled={(give[c] ?? 0) >= n} onClick={() => add(c)}>
              {cName(c)} ×{n - (give[c] ?? 0)}
            </button>
          ))}
      </div>
      {total > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <span className="civ-lbl">
            Vous offrez {total} cartes ({named} nommées/garanties) :
          </span>
          {Object.entries(give).map(([c, n]) => {
            const g = Math.min(n, guar[c] ?? 0);
            return (
              <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, flexWrap: 'wrap' }}>
                <span style={{ minWidth: 70 }}>{cName(c)} ×{n}</span>
                <span className="civ-lbl">nommé :</span>
                <button className="civ-btn" style={{ padding: '0 6px' }} disabled={g <= 0} onClick={() => bumpGuar(c, -1)}>−</button>
                <b>{g}</b>
                <button className="civ-btn" style={{ padding: '0 6px' }} disabled={g >= n} onClick={() => bumpGuar(c, 1)}>+</button>
                {n - g > 0 && (
                  <select value={claim[c] ?? ''} onChange={(e) => setClaim((m) => ({ ...m, [c]: e.target.value }))}>
                    <option value="">ne rien dire</option>
                    {!isCal(c) && <option value={c}>annoncer {commodityById.get(c)?.name ?? c} (vrai)</option>}
                    {COMMODITY_ORDER.filter((x) => x !== c).map((x) => (
                      <option key={x} value={x}>annoncer {commodityById.get(x)?.name} (bluff)</option>
                    ))}
                  </select>
                )}
                <button className="civ-btn" style={{ padding: '0 6px' }} onClick={() => rm(c)}>✕</button>
              </div>
            );
          })}
        </div>
      )}
      {wantPicker && (
        <div>
          <span className="civ-lbl">Recherche (1–5) : {wants.map(cName).join(' ou ') || '—'}</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
            {COMMODITY_ORDER.map((c) => (
              <button key={c} className={`civ-btn ${wants.includes(c) ? 'on' : ''}`} style={{ padding: '0 6px', fontSize: 11 }} onClick={() => toggleWant(c)}>
                {commodityById.get(c)?.name}
              </button>
            ))}
          </div>
        </div>
      )}
      {gain !== null && (
        <span className="civ-lbl">
          Gain estimé si les annonces sont réelles : <b style={{ color: gain >= 0 ? '#2e6b3a' : '#8a3b12' }}>{gain >= 0 ? '+' : ''}{gain}</b>
        </span>
      )}
      {hint && <span className="civ-lbl" style={{ color: '#8a3b12' }}>{hint}</span>}
      <button className="civ-btn" disabled={!ok} onClick={submit}>{submitLabel}</button>
    </div>
  );
}
