import { civById } from '../../../data/index.js';
import { victoryScore } from '../../../engine/index.js';
import type { GameState } from '../../../engine/types.js';
import { useTranslation, translateCiv } from '../../i18n/index.js';

interface GameOverSummaryProps {
  state: GameState;
  result: { winners: string[] };
}

export function GameOverSummary({ state, result }: GameOverSummaryProps) {
  const { t } = useTranslation();
  const standings = state.seating
    .map((id) => ({ id, score: victoryScore(state, id) }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="glass-panel glass-panel--gold animate-pop" style={{ padding: 18, border: '1px solid var(--civ-gold-border)' }}>
      <div style={{ fontFamily: 'var(--civ-font-display)', fontSize: 16, fontWeight: 800, color: 'var(--civ-gold-light)', textTransform: 'uppercase', letterSpacing: 1 }}>
        {t.views.gameOver.title}{' '}
        <span style={{ color: '#ffffff' }}>{result.winners.map((w) => translateCiv(w, t)).join(', ')}</span>
      </div>
      <table style={{ marginTop: 12, fontSize: 13, borderCollapse: 'collapse', width: '100%' }}>
        <tbody>
          {standings.map((r, i) => (
            <tr key={r.id} style={{ fontWeight: result.winners.includes(r.id) ? 800 : 400, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '4px 8px', textAlign: 'right', color: 'var(--civ-gold-base)' }}>{i + 1}.</td>
              <td style={{ padding: '4px 8px', color: civById.get(r.id)?.color, fontWeight: 700 }}>
                {translateCiv(r.id, t)}
                {result.winners.includes(r.id) ? ' 👑' : ''}
              </td>
              <td style={{ padding: '4px 8px', textAlign: 'right', fontWeight: 800, color: 'var(--civ-marble)' }}>{r.score} pts</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ color: 'var(--civ-stone-muted)', fontSize: 11, fontStyle: 'italic', marginTop: 10 }}>
        {t.views.gameOver.scoreExplanation}
      </div>
    </div>
  );
}
