import { useState } from 'react';
import { advances as ALL_ADVANCES, advanceById, civById, ADVANCE_EFFECTS } from '../../../data/index.js';
import { advancesFaceValue } from '../../../engine/helpers.js';
import type { GameState, PlayerId } from '../../../engine/types.js';

export const GROUP_COLOR: Record<string, string> = {
  Crafts: '#d98a3a', Arts: '#c0504d', Civics: '#8064a2', Sciences: '#4f9a52', Religion: '#3a8fc7',
};

function creditSummary(id: string): string {
  const a = advanceById.get(id);
  if (!a) return '';
  const parts: string[] = [];
  for (const [g, v] of Object.entries(a.credits.byGroup)) parts.push(`+${v} aux autres ${g}`);
  for (const [c, v] of Object.entries(a.credits.byCard)) parts.push(`+${v} à ${advanceById.get(c)?.name ?? c}`);
  return parts.join(', ');
}

export function AdvanceTip({ id }: { id: string }) {
  const a = advanceById.get(id)!;
  const credits = creditSummary(id);
  return (
    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 3, zIndex: 60, width: 270, background: '#1a160f', border: '1px solid #c79a3a', borderRadius: 6, padding: 10, boxShadow: '0 6px 24px #000', color: '#eee', fontSize: 12, lineHeight: 1.5, textAlign: 'left', whiteSpace: 'normal' }}>
      <div style={{ fontWeight: 800, color: '#ffd98a' }}>{a.name}</div>
      <div style={{ color: '#9a8d6a' }}>{a.groups.join(' / ')} · coût {a.cost}{a.prerequisites?.length ? ` · requis: ${a.prerequisites.map((p) => advanceById.get(p)?.name ?? p).join(', ')}` : ''}</div>
      <div style={{ margin: '6px 0', color: '#ece4d2' }}>{ADVANCE_EFFECTS[id] ?? ''}</div>
      {credits && <div style={{ color: '#9ab8c8' }}>Réductions : {credits}</div>}
    </div>
  );
}

function AdvanceChip({ id, owned }: { id: string; owned: boolean }) {
  const a = advanceById.get(id)!;
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ position: 'relative', zIndex: hover ? 10 : undefined, padding: 6, borderRadius: 4, border: '1px solid #555', borderLeft: `5px solid ${GROUP_COLOR[a.groups[0]!] ?? '#999'}`, background: owned ? '#2e6b3a' : '#222', cursor: 'help' }}
    >
      <div style={{ opacity: owned ? 1 : 0.6 }}>
        <b>{a.name}</b><br />
        <small>{a.groups.join('/')} · {a.cost}</small>
      </div>
      {hover && <AdvanceTip id={id} />}
    </div>
  );
}

export function ToolsView({ state, focus }: { state: GameState; focus: PlayerId }) {
  const owned = new Set(state.players[focus]!.advances);
  const groupNames = Object.keys(GROUP_COLOR);
  const ownedByGroup = (g: string) => ALL_ADVANCES.filter((a) => owned.has(a.id) && (a.groups as string[]).includes(g)).length;
  const represented = groupNames.filter((g) => ownedByGroup(g) > 0).length;
  const totalValue = advancesFaceValue(state.players[focus]!.advances);

  return (
    <div style={{ padding: 16, color: '#eee' }}>
      <h2 style={{ marginTop: 0 }}>Progrès de Civilisation — {civById.get(focus)?.name}</h2>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 8 }}>
        <span style={{ fontSize: 22, fontWeight: 800, color: '#ffd98a' }}>{totalValue}</span>
        <span className="civ-lbl" style={{ color: '#cdc4ad' }}>valeur totale en points (§33.25)</span>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
        {groupNames.map((g) => (
          <span key={g} style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, border: `1px solid ${GROUP_COLOR[g]}`, background: ownedByGroup(g) > 0 ? GROUP_COLOR[g] : 'transparent', color: ownedByGroup(g) > 0 ? '#1a1a1a' : '#cdc4ad', fontWeight: 700 }}>
            {g} · {ownedByGroup(g)}
          </span>
        ))}
        <span className="civ-lbl" style={{ color: represented >= 5 ? '#7fd17f' : '#ffd23f', fontWeight: 700 }}>
          {represented}/5 groupes (l’Âge du Fer exige les 5, §33.24)
        </span>
      </div>
      <div className="civ-lbl" style={{ color: '#b9ad8e', marginBottom: 8 }}>Survolez un progrès pour voir ses effets et réductions.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 6, maxWidth: 780 }}>
        {ALL_ADVANCES.map((a) => <AdvanceChip key={a.id} id={a.id} owned={owned.has(a.id)} />)}
      </div>
    </div>
  );
}
