import type { CSSProperties } from 'react';
import { civById } from '../../../data/index.js';
import { astRank } from '../../../engine/helpers.js';
import { GROUP_COLOR } from './ToolsView.js';
import type { GameState } from '../../../engine/types.js';

export function CensusView({ state }: { state: GameState }) {
  const rows = state.seating.map((id) => {
    const p = state.players[id]!;
    let tokens = 0, cities = 0;
    for (const a of Object.values(state.areas)) {
      tokens += a.tokens[id] ?? 0;
      if (a.city === id) cities++;
    }
    const cards = p.handCount ?? Object.values(p.hand).reduce((s, n) => s + n, 0);
    return { id, tokens, cities, cards, advances: p.advances, stock: p.stock, treasury: p.treasury };
  }).sort((a, b) => b.tokens - a.tokens || astRank(a.id) - astRank(b.id));

  const cell: CSSProperties = { padding: '3px 12px 3px 0', textAlign: 'right' };
  const head: CSSProperties = { ...cell, fontWeight: 700, color: '#cdc4ad' };

  return (
    <div style={{ padding: 16, color: '#eee' }}>
      <h2 style={{ marginTop: 0 }}>Recensement &amp; Classement (Census)</h2>
      <div className="civ-lbl" style={{ color: '#b9ad8e', marginBottom: 10, maxWidth: 640 }}>
        Informations publiques pour chaque nation. Seul le contenu des cartes de commerce reste secret (§27.4).
      </div>
      <table style={{ fontSize: 13, borderCollapse: 'collapse' }}>
        <tbody>
          <tr style={{ textAlign: 'right' }}>
            <th style={{ ...head, textAlign: 'left' }}>#</th>
            <th style={{ ...head, textAlign: 'left' }}>Nation</th>
            <th style={head}>Pop</th>
            <th style={head}>Cités</th>
            <th style={head}>Cartes</th>
            <th style={head}>Progrès</th>
            <th style={head}>Stock</th>
            <th style={head}>Trésor</th>
          </tr>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ borderTop: '1px solid #333' }}>
              <td style={{ ...cell, textAlign: 'left' }}>{i + 1}</td>
              <td style={{ ...cell, textAlign: 'left', color: civById.get(r.id)?.color, fontWeight: 700 }}>
                {civById.get(r.id)?.name}
              </td>
              <td style={cell}>{r.tokens}</td>
              <td style={cell}>{r.cities}</td>
              <td style={cell}>{r.cards}</td>
              <td style={cell}>{r.advances.length}</td>
              <td style={cell}>{r.stock}</td>
              <td style={cell}>{r.treasury}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="civ-lbl" style={{ color: '#cdc4ad', fontWeight: 700 }}>Progrès possédés</div>
        {rows.map((r) => (
          <div key={r.id} style={{ lineHeight: 1.9 }}>
            <span style={{ color: civById.get(r.id)?.color, fontWeight: 700, marginRight: 8 }}>
              {civById.get(r.id)?.name}
            </span>
            {r.advances.length === 0 ? (
              <span className="civ-lbl" style={{ color: '#8a8270' }}>aucun</span>
            ) : (
              [...r.advances].sort().map((aid) => (
                <span
                  key={aid}
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    padding: '1px 6px',
                    margin: '0 4px 2px 0',
                    borderRadius: 3,
                    border: '1px solid #555',
                    background: '#222',
                  }}
                >
                  {aid}
                </span>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
