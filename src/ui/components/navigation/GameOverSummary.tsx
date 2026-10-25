import { civById } from '../../../data/index.js';
import { victoryScore } from '../../../engine/index.js';
import type { GameState } from '../../../engine/types.js';

interface GameOverSummaryProps {
  state: GameState;
  result: { winners: string[] };
}

export function GameOverSummary({ state, result }: GameOverSummaryProps) {
  const standings = state.seating
    .map((id) => ({ id, score: victoryScore(state, id) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="civ-msg" style={{ padding: 10 }}>
      <div>
        Partie terminée — Vainqueur :{' '}
        <b>{result.winners.map((w) => civById.get(w)?.name ?? w).join(', ')}</b>
      </div>
      <table style={{ marginTop: 8, fontSize: 13, borderCollapse: 'collapse' }}>
        <tbody>
          {standings.map((r, i) => (
            <tr key={r.id} style={{ fontWeight: result.winners.includes(r.id) ? 800 : 400 }}>
              <td style={{ padding: '1px 8px', textAlign: 'right', color: '#9a8d6a' }}>{i + 1}.</td>
              <td style={{ padding: '1px 8px', color: civById.get(r.id)?.color }}>
                {civById.get(r.id)?.name}
                {result.winners.includes(r.id) ? ' 👑' : ''}
              </td>
              <td style={{ padding: '1px 8px', textAlign: 'right', fontWeight: 700 }}>{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <small style={{ color: '#9a8d6a' }}>
        Score = progrès + séries de marchandises + trésor + case A.S.T. + cités (§35).
      </small>
    </div>
  );
}
