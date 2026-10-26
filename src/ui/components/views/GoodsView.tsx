import { useState } from 'react';
import { civById, commodityById } from '../../../data/index.js';
import { miningAvailable, handValue } from '../../../engine/helpers.js';
import { CommodityCard, CalamityCard } from '../../cards/index.js';
import type { GameState, PlayerId } from '../../../engine/types.js';

const isCal = (id: string) => id.startsWith('calamity:');

function byCardValue(a: string, b: string): number {
  if (isCal(a) !== isCal(b)) return isCal(a) ? 1 : -1;
  const va = commodityById.get(a)?.value ?? 0;
  const vb = commodityById.get(b)?.value ?? 0;
  return va - vb;
}

export function GoodsView({ state, focus }: { state: GameState; focus: PlayerId }) {
  const [filter, setFilter] = useState<'all' | 'commodities' | 'calamities'>('all');
  const hand = state.players[focus]!.hand;
  const civ = civById.get(focus);
  const mining = miningAvailable(state.players[focus]!);
  const entries = Object.entries(hand).filter(([, n]) => n > 0).sort(([a], [b]) => byCardValue(a, b));
  const commCards = entries.filter(([c]) => !isCal(c));
  const calCards = entries.filter(([c]) => isCal(c));
  const commTotal = commCards.reduce((a, [, n]) => a + n, 0);
  const totalPoints = handValue(hand, { mining });

  const filteredEntries = filter === 'commodities' ? commCards : filter === 'calamities' ? calCards : entries;

  return (
    <div style={{ color: 'var(--civ-marble)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid var(--civ-gold-border)', paddingBottom: 10, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--civ-font-display)', letterSpacing: 1.2, color: 'var(--civ-gold-light)', fontSize: 17, textTransform: 'uppercase' }}>
          🏺 Trésors & Marchandises — {civ?.name}
        </h2>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--civ-gold-light)' }}>{totalPoints}</span>
          <span style={{ fontSize: 12, color: 'var(--civ-stone-muted)' }}>points de valeur marchande (§27.5)</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            onClick={() => setFilter('all')}
            className={`glass-btn ${filter === 'all' ? 'glass-btn--primary' : ''}`}
            style={{ padding: '4px 10px', fontSize: 11 }}
          >
            Toutes les cartes ({entries.length})
          </button>
          <button
            onClick={() => setFilter('commodities')}
            className={`glass-btn ${filter === 'commodities' ? 'glass-btn--primary' : ''}`}
            style={{ padding: '4px 10px', fontSize: 11 }}
          >
            Marchandises ({commTotal})
          </button>
          {calCards.length > 0 && (
            <button
              onClick={() => setFilter('calamities')}
              className={`glass-btn ${filter === 'calamities' ? 'glass-btn--danger' : ''}`}
              style={{ padding: '4px 10px', fontSize: 11 }}
            >
              ⚠ Calamités en main ({calCards.length})
            </button>
          )}
        </div>

        <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>
          Formule de série : <b style={{ color: 'var(--civ-gold-base)' }}>n² × valeur faciale</b>
          {mining && <span style={{ color: '#86efac', marginLeft: 6 }}>· Bonus Mines actif (+1 carte Or)</span>}
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--civ-stone-muted)', fontStyle: 'italic', background: 'rgba(20, 26, 36, 0.4)', borderRadius: 8, border: '1px dashed var(--civ-gold-border-subtle)' }}>
          Aucune carte dans cette catégorie.
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {filteredEntries.map(([c, n]) => {
            if (isCal(c)) {
              const calId = c.slice(9);
              return <CalamityCard key={c} id={calId} width={136} height={204} />;
            }
            return <CommodityCard key={c} id={c} count={n} width={136} height={204} />;
          })}
        </div>
      )}
    </div>
  );
}
