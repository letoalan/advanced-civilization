import { useState } from 'react';
import { advances as ALL_ADVANCES, civById } from '../../../data/index.js';
import { advancesFaceValue, creditTowards } from '../../../engine/helpers.js';
import type { GameState, PlayerId } from '../../../engine/types.js';
import { AdvanceCard } from '../../cards/AdvanceCard.js';
import { AdvanceDetailModal } from './AdvanceDetailModal.js';

export const GROUP_COLOR: Record<string, string> = {
  Crafts: '#d98a3a',
  Sciences: '#4f9a52',
  Arts: '#c0504d',
  Civics: '#8064a2',
  Religion: '#3a8fc7',
};

const GROUP_LABEL_FR: Record<string, string> = {
  Crafts: 'Métiers',
  Sciences: 'Sciences',
  Arts: 'Arts',
  Civics: 'Civisme',
  Religion: 'Religion',
};

export function ToolsView({ state, focus }: { state: GameState; focus: PlayerId }) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const p = state.players[focus]!;
  const owned = new Set(p.advances);
  const groupNames = Object.keys(GROUP_COLOR);
  const ownedByGroup = (g: string) => ALL_ADVANCES.filter((a) => owned.has(a.id) && (a.groups as string[]).includes(g)).length;
  const represented = groupNames.filter((g) => ownedByGroup(g) > 0).length;
  const totalValue = advancesFaceValue(p.advances);

  const filteredAdvances = selectedGroup
    ? ALL_ADVANCES.filter((a) => (a.groups as string[]).includes(selectedGroup))
    : ALL_ADVANCES;

  const creditFor = (id: string) => creditTowards(p.advances, id);

  return (
    <div style={{ color: 'var(--civ-marble)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header with Title and Civilization Points */}
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid var(--civ-gold-border)', paddingBottom: 8 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: 'var(--civ-font-display)', letterSpacing: 1.2, color: 'var(--civ-gold-light)', fontSize: 16, textTransform: 'uppercase' }}>
            🏛️ Galerie des Progrès — {civById.get(focus)?.name}
          </h2>
          <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>
            {owned.size} progrès acquis sur {ALL_ADVANCES.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--civ-gold-light)', textShadow: '0 0 12px var(--civ-gold-glow)' }}>
            {totalValue}
          </span>
          <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>points A.S.T. (§33.25)</span>
        </div>
      </div>

      {/* Group Filter Tabs and Iron Age Requirement Meter */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={() => setSelectedGroup(null)}
          className={`glass-btn ${selectedGroup === null ? 'glass-btn--primary' : ''}`}
          style={{ padding: '3px 9px', fontSize: 11 }}
        >
          Tous ({ALL_ADVANCES.length})
        </button>

        {groupNames.map((g) => {
          const isAct = selectedGroup === g;
          const count = ownedByGroup(g);
          return (
            <button
              key={g}
              onClick={() => setSelectedGroup(isAct ? null : g)}
              className="glass-btn"
              style={{
                fontSize: 11,
                padding: '3px 9px',
                borderColor: isAct ? 'var(--civ-gold-base)' : undefined,
                color: isAct ? 'var(--civ-gold-light)' : count > 0 ? 'var(--civ-marble)' : 'var(--civ-stone-muted)',
                background: isAct ? 'rgba(40, 52, 70, 0.95)' : undefined,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: GROUP_COLOR[g] }} />
              <span>{GROUP_LABEL_FR[g] ?? g}</span>
              <span style={{ opacity: 0.8, fontSize: 10 }}>({count})</span>
            </button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <span style={{ color: 'var(--civ-stone-muted)' }}>Âge du Fer :</span>
          <b style={{ color: represented >= 5 ? '#86efac' : 'var(--civ-gold-base)' }}>
            {represented}/5 domaines
          </b>
        </div>
      </div>

      {/* Visual Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 12,
          maxHeight: 'min(64vh, 560px)',
          overflowY: 'auto',
          padding: '6px 4px 12px 2px',
        }}
        className="civ-custom-scrollbar"
      >
        {filteredAdvances.map((a) => {
          const isOwned = owned.has(a.id);
          const disc = creditFor(a.id);
          const effCost = Math.max(0, a.cost - disc);

          return (
            <div
              key={a.id}
              onClick={() => setDetailId(a.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.16s ease',
              }}
              className="hover:scale-105"
            >
              <AdvanceCard
                id={a.id}
                owned={isOwned}
                effectiveCost={effCost}
                width={120}
                height={175}
              />
            </div>
          );
        })}
      </div>

      {/* Modal for detailed inspection */}
      {detailId && (
        <AdvanceDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
          owned={owned.has(detailId)}
          creditDiscount={creditFor(detailId)}
        />
      )}
    </div>
  );
}
