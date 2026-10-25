import { useState } from 'react';
import { commodityById } from '../../../data/index.js';
import type { Action, GameState } from '../../../engine/types.js';

interface DiscardControlsProps {
  state: GameState;
  onApply: (a: Action) => void;
}

export function DiscardControls({ state, onApply }: DiscardControlsProps) {
  const d = state.pendingDiscard!;
  const hand = state.players[d.holder]!.hand;
  const cards = Object.entries(hand)
    .filter(([c, n]) => !c.startsWith('calamity:') && n > 0)
    .flatMap(([c, n]) => Array<string>(n).fill(c))
    .sort((a, b) => (commodityById.get(a)?.value ?? 0) - (commodityById.get(b)?.value ?? 0));

  const [sel, setSel] = useState<string[]>([]);
  const toggle = (i: number) =>
    setSel((s) => {
      const next = [...s];
      const at = next.indexOf(String(i));
      if (at >= 0) next.splice(at, 1);
      else if (next.length < d.count) next.push(String(i));
      return next;
    });

  const ok = sel.length === d.count;
  const submit = () => onApply({ type: 'chooseDiscard', cards: sel.map((i) => cards[Number(i)]!) });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="civ-lbl">
        Vous détenez {cards.length} marchandises — au-delà de la limite de 8 (§31.71). Choisissez <b>{d.count}</b> cartes à défausser :
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {cards.map((c, i) => (
          <button
            key={i}
            className={`civ-btn ${sel.includes(String(i)) ? 'on' : ''}`}
            style={{ fontSize: 11 }}
            onClick={() => toggle(i)}
          >
            {sel.includes(String(i)) ? '✗ ' : ''}
            {commodityById.get(c)?.name ?? c} ({commodityById.get(c)?.value ?? '?'})
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="civ-lbl" style={{ color: ok ? '#7caa6a' : '#caa05a' }}>
          {sel.length} / {d.count} à défausser
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="civ-btn" style={{ fontSize: 11 }} onClick={() => setSel(cards.map((_, i) => String(i)).slice(0, d.count))}>
            Moins chères
          </button>
          <button className="civ-btn" disabled={!ok} onClick={submit}>
            Confirmer la défausse
          </button>
        </div>
      </div>
    </div>
  );
}
