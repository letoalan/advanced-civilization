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
  const hand = state.players[focus]!.hand;
  const mining = miningAvailable(state.players[focus]!);
  const entries = Object.entries(hand).filter(([, n]) => n > 0).sort(([a], [b]) => byCardValue(a, b));
  const commCount = entries.filter(([c]) => !isCal(c)).reduce((a, [, n]) => a + n, 0);

  return (
    <div style={{ padding: 16, color: '#eee' }}>
      <h2 style={{ marginTop: 0 }}>Cartes de Commerce — {civById.get(focus)?.name}</h2>
      <p className="civ-lbl" style={{ marginTop: 0, color: '#cdc4ad' }}>
        {commCount} carte{commCount > 1 ? 's' : ''} de marchandises · valeur totale :{' '}
        <b style={{ color: '#ffd23f' }}>{handValue(hand, { mining })} points</b>
        {' '}— une série de n cartes identiques vaut n² × sa valeur nominale.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
        {entries.length === 0 && <span className="civ-lbl">(aucune carte en main)</span>}
        {entries.map(([c, n]) => {
          if (isCal(c)) {
            const calId = c.slice(9);
            return <CalamityCard key={c} id={calId} width={120} height={180} />;
          }
          return <CommodityCard key={c} id={c} count={n} width={120} height={180} />;
        })}
      </div>
    </div>
  );
}
