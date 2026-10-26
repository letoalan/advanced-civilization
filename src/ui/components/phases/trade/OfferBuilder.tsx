import { useState } from 'react';
import { commodityById, calamityById } from '../../../../data/index.js';
import { bundleFace, handValue } from '../../../../engine/helpers.js';
import type { TradeBundle } from '../../../../engine/types.js';
import { CommodityCard, CalamityCard } from '../../../cards/index.js';
import { WantsPicker } from './WantsPicker.js';
import { OfferSelectedSlot } from './OfferSelectedSlot.js';

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
      if (n <= 0) delete o[c]; else o[c] = n;
      return o;
    });
    setGuar((g) => {
      const o = { ...g };
      if (n <= 0) delete o[c]; else if ((o[c] ?? 0) > n) o[c] = n;
      return o;
    });
  };

  const bumpGuar = (c: string, d: number) =>
    setGuar((g) => ({ ...g, [c]: Math.max(0, Math.min(give[c] ?? 0, (g[c] ?? 0) + d)) }));

  const toggleWant = (c: string) =>
    setWants((w) => (w.includes(c) ? w.filter((x) => x !== c) : w.length < 5 ? [...w, c] : w));

  const submit = () => {
    onSubmit({ actual: give, declared, count: total, claimed }, wants);
    setGive({}); setGuar({}); setClaim({}); setWants([]);
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

  const hint = total < 3 ? 'Choisissez au moins 3 cartes (§28.2).' : named < 2 ? 'Nommez au moins 2 cartes (§28.3).' : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Vos cartes disponibles (cliquer pour ajouter) :
          </span>
          <span style={{ fontSize: 10, color: 'var(--civ-gold-light)' }}>
            §28 : 3 cartes min. dont 2 garanties
          </span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 150, overflowY: 'auto', padding: 2 }}>
          {Object.entries(me.hand).filter(([c, n]) => n > 0 && isGivableCard(c)).sort(([a], [b]) => byCardValue(a, b)).map(([c, n]) => {
            const avail = n - (give[c] ?? 0);
            return (
              <div
                key={c}
                onClick={() => avail > 0 && add(c)}
                title={avail > 0 ? `Ajouter ${cName(c)} à l'offre` : 'Toutes les copies sont dans l’offre'}
                style={{
                  position: 'relative',
                  cursor: avail > 0 ? 'pointer' : 'not-allowed',
                  opacity: avail > 0 ? 1 : 0.35,
                  transform: avail > 0 ? 'scale(1)' : 'scale(0.95)',
                  transition: 'transform 0.15s ease',
                }}
              >
                {isCal(c) ? (
                  <CalamityCard id={c.slice(9)} width={60} height={90} disabled={avail <= 0} />
                ) : (
                  <CommodityCard id={c} count={avail} width={60} height={90} disabled={avail <= 0} />
                )}
                {avail > 0 && (
                  <div style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(212, 175, 55, 0.95)', color: '#0a0d12', fontSize: 9, fontWeight: 800, padding: '1px 4px', borderRadius: 3 }}>
                    +{avail}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        data-drop-zone="offer-builder"
        style={{
          padding: 8,
          background: 'rgba(16, 21, 28, 0.85)',
          border: `1px solid ${total >= 3 && named >= 2 ? 'var(--civ-gold-base)' : 'var(--civ-gold-border)'}`,
          borderRadius: 8,
          boxShadow: 'var(--civ-glass-shadow)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--civ-gold-light)', textTransform: 'uppercase' }}>
            Contenu de votre offre ({total} carte{total > 1 ? 's' : ''}, dont {named} garantie{named > 1 ? 's' : ''}) :
          </span>
          {total === 0 && (
            <span style={{ fontSize: 10, color: 'var(--civ-stone-muted)', fontStyle: 'italic' }}>
              Cliquez sur vos cartes ci-dessus pour composer l’offre
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 90 }}>
          {Object.entries(give).map(([c, n]) => (
            <OfferSelectedSlot
              key={c}
              cardId={c}
              count={n}
              guaranteed={guar[c] ?? 0}
              claim={claim[c] ?? ''}
              onBumpGuar={(d) => bumpGuar(c, d)}
              onSetClaim={(val) => setClaim((m) => ({ ...m, [c]: val }))}
              onRemove={() => rm(c)}
            />
          ))}
        </div>
      </div>

      {wantPicker && <WantsPicker wants={wants} onToggleWant={toggleWant} commodityOrder={COMMODITY_ORDER} cName={cName} />}
      {gain !== null && (
        <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>
          Gain estimé : <b style={{ color: gain >= 0 ? '#86efac' : '#f87171' }}>{gain >= 0 ? '+' : ''}{gain} pts</b>
        </span>
      )}
      {hint && <span style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>{hint}</span>}
      <button className="glass-btn glass-btn--primary" disabled={!ok} onClick={submit} style={{ padding: '8px 16px', fontSize: 12 }}>
        {submitLabel}
      </button>
    </div>
  );
}
