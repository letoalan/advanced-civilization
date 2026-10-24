import { epochs, astTrackFor, civById } from '../../../data/index.js';
import type { GameState } from '../../../engine/types.js';

export const EPOCH_COLOR: Record<string, string> = {
  stone: '#8a5bb0',
  earlyBronze: '#3aa0d8',
  lateBronze: '#46b35a',
  earlyIron: '#e8c84a',
  lateIron: '#e07a3a',
};

function epochRequirement(r: { cities?: number; cards?: number; cardGroups?: number; perSpaceCardValue?: boolean }): string {
  const parts: string[] = [];
  if (r.cities) parts.push(`${r.cities} cité${r.cities > 1 ? 's' : ''}`);
  if (r.cards) parts.push(`${r.cards} cartes de progrès`);
  if (r.cardGroups) parts.push(r.cardGroups >= 5 ? '5 groupes représentés' : `${r.cardGroups} groupes représentés`);
  if (r.perSpaceCardValue) parts.push('valeur de cartes indiquée sur la case');
  return parts.length ? parts.join(' · ') : 'aucun prérequis';
}

export function AstView({ state }: { state: GameState }) {
  return (
    <div style={{ padding: 16, color: '#eee' }}>
      <h2 style={{ marginTop: 0 }}>Frise Chronologique A.S.T. (Table de Succession Archéologique)</h2>
      <div className="civ-lbl" style={{ color: '#ffd23f', fontWeight: 800, marginBottom: 4 }}>
        Conditions d’entrée dans chaque époque (§33) :
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {epochs.map((e) => (
          <div key={e.id} style={{ borderLeft: `5px solid ${EPOCH_COLOR[e.id]}`, background: 'rgba(0,0,0,0.22)', borderRadius: 4, padding: '5px 9px', minWidth: 120 }}>
            <div style={{ fontWeight: 800, fontSize: 12 }}>{e.name}</div>
            <div style={{ fontSize: 11, color: '#cdc4ad' }}>{epochRequirement(e.requirements)}</div>
          </div>
        ))}
      </div>
      <table style={{ borderCollapse: 'collapse', fontSize: 11 }}>
        <tbody>
          {state.seating.map((id) => {
            const track = astTrackFor(id);
            const p = state.players[id]!;
            const liaStart = track.epochStart['lateIron'] ?? track.finishSpace;
            return (
              <tr key={id}>
                <td style={{ padding: '2px 8px', fontWeight: 800, color: civById.get(id)?.color }}>
                  {civById.get(id)?.name}
                </td>
                {Array.from({ length: track.finishSpace }, (_, i) => i + 1).map((space) => {
                  const epoch = [...epochs].reverse().find((e) => space >= (track.epochStart[e.id] ?? 1))!;
                  const here = p.astSpace === space;
                  const liaVal = track.lateIronThresholds?.[space - liaStart];
                  return (
                    <td
                      key={space}
                      style={{
                        width: 30,
                        height: 26,
                        textAlign: 'center',
                        background: EPOCH_COLOR[epoch.id],
                        border: '1px solid #333',
                        color: '#1a1a1a',
                        position: 'relative',
                      }}
                    >
                      {liaVal ?? ''}
                      {here && (
                        <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ width: 14, height: 14, borderRadius: '50%', background: civById.get(id)?.color, border: '2px solid #fff' }} />
                        </span>
                      )}
                    </td>
                  );
                })}
                <td style={{ padding: '2px 6px' }}>🏁</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="civ-lbl" style={{ color: '#ccc', marginTop: 8 }}>
        Les nombres à l'Âge du Fer Récent indiquent les points de valeur de cartes requis pour avancer (§33.25).
      </p>
    </div>
  );
}
