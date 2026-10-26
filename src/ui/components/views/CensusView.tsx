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
    <div style={{ color: 'var(--civ-marble)' }}>
      <h2 style={{ marginTop: 0, fontFamily: 'var(--civ-font-display)', letterSpacing: 1.2, color: 'var(--civ-gold-light)', fontSize: 17, textTransform: 'uppercase' }}>
        🏛️ Recensement des Empires — Tabula Censoria
      </h2>
      <div className="civ-lbl" style={{ color: 'var(--civ-stone-muted)', marginBottom: 14, maxWidth: 640 }}>
        Informations publiques pour chaque nation. Seul le contenu des cartes de commerce reste secret (§27.4).
      </div>
      <table style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%', maxWidth: 700 }}>
        <thead>
          <tr style={{ textAlign: 'right', borderBottom: '1px solid var(--civ-gold-border)' }}>
            <th style={{ ...head, textAlign: 'left', color: 'var(--civ-gold-base)' }}>#</th>
            <th style={{ ...head, textAlign: 'left', color: 'var(--civ-gold-base)' }}>Nation</th>
            <th style={{ ...head, color: 'var(--civ-gold-base)' }}>Pop</th>
            <th style={{ ...head, color: 'var(--civ-gold-base)' }}>Cités</th>
            <th style={{ ...head, color: 'var(--civ-gold-base)' }}>Cartes</th>
            <th style={{ ...head, color: 'var(--civ-gold-base)' }}>Progrès</th>
            <th style={{ ...head, color: 'var(--civ-gold-base)' }}>Stock</th>
            <th style={{ ...head, color: 'var(--civ-gold-base)' }}>Trésor</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <td style={{ ...cell, textAlign: 'left', color: 'var(--civ-stone-muted)' }}>{i + 1}</td>
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
      <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ color: 'var(--civ-gold-light)', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Progrès enregistrés au cadastre
        </div>
        {rows.map((r) => (
          <div key={r.id} style={{ lineHeight: 1.9 }}>
            <span style={{ color: civById.get(r.id)?.color, fontWeight: 700, marginRight: 8 }}>
              {civById.get(r.id)?.name} :
            </span>
            {r.advances.length === 0 ? (
              <span className="civ-lbl" style={{ color: 'var(--civ-stone-muted)', fontStyle: 'italic' }}>aucun</span>
            ) : (
              [...r.advances].sort().map((aid) => (
                <span
                  key={aid}
                  style={{
                    display: 'inline-block',
                    fontSize: 11,
                    padding: '2px 8px',
                    margin: '0 4px 3px 0',
                    borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(25, 32, 44, 0.85)',
                    color: 'var(--civ-marble)',
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
