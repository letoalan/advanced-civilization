import { useState } from 'react';
import { commodityById } from '../../../data/index.js';
import type { Action, GameState } from '../../../engine/types.js';
import { CommodityCard } from '../../cards/index.js';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(25, 18, 12, 0.85)', padding: 10, borderRadius: 6, border: '1px solid #785a28' }}>
      <span className="civ-lbl" style={{ color: '#ffd23f', fontSize: 12 }}>
        Vous détenez <b>{cards.length}</b> marchandises — au-delà de la limite de 8 (§31.71). Choisissez <b>{d.count}</b> cartes à défausser :
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, overflowX: 'auto', padding: '4px 0' }}>
        {cards.map((c, i) => {
          const isSelected = sel.includes(String(i));
          return (
            <div
              key={i}
              onClick={() => toggle(i)}
              style={{
                cursor: 'pointer',
                position: 'relative',
                transform: isSelected ? 'translateY(-4px)' : 'none',
                filter: isSelected ? 'drop-shadow(0 0 8px #ef4444)' : undefined,
                transition: 'all 0.15s ease',
              }}
            >
              <CommodityCard id={c} width={76} height={114} isSelected={isSelected} />
              {isSelected && (
                <div
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: 20,
                    height: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: 12,
                    zIndex: 5,
                    boxShadow: '0 2px 4px #000',
                  }}
                >
                  ✕
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="civ-lbl" style={{ color: ok ? '#86efac' : '#ffd23f', fontWeight: 700 }}>
          {sel.length} / {d.count} carte{d.count > 1 ? 's' : ''} sélectionnée{d.count > 1 ? 's' : ''} à défausser
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="civ-btn" style={{ fontSize: 11 }} onClick={() => setSel(cards.map((_, i) => String(i)).slice(0, d.count))}>
            Défausser les moins chères
          </button>
          <button className="civ-btn" disabled={!ok} onClick={submit} style={{ fontWeight: 800 }}>
            Confirmer la défausse
          </button>
        </div>
      </div>
    </div>
  );
}

