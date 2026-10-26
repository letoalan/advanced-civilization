import { commodityById } from '../../../../data/index.js';
import { CommodityCard, CalamityCard } from '../../../cards/index.js';
import { COMMODITY_ORDER, isCal } from './OfferBuilder.js';

interface OfferSelectedSlotProps {
  cardId: string;
  count: number;
  guaranteed: number;
  claim: string;
  onBumpGuar: (delta: number) => void;
  onSetClaim: (claimedId: string) => void;
  onRemove: () => void;
}

export function OfferSelectedSlot({
  cardId,
  count,
  guaranteed,
  claim,
  onBumpGuar,
  onSetClaim,
  onRemove,
}: OfferSelectedSlotProps) {
  const unstated = count - guaranteed;
  const isCalamity = isCal(cardId);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 4,
        background: 'rgba(10, 13, 18, 0.95)',
        borderRadius: 6,
        border: '1px solid var(--civ-gold-border-subtle)',
        gap: 3,
      }}
    >
      {isCalamity ? (
        <CalamityCard id={cardId.slice(9)} width={52} height={78} />
      ) : (
        <CommodityCard id={cardId} count={count} width={52} height={78} />
      )}

      {/* Guaranteed quantity control */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
        <span style={{ color: 'var(--civ-stone-muted)', fontSize: 9 }}>Garanti :</span>
        <button
          className="glass-btn"
          style={{ padding: '0 4px', minWidth: 16 }}
          disabled={guaranteed <= 0}
          onClick={() => onBumpGuar(-1)}
        >
          −
        </button>
        <b style={{ color: guaranteed > 0 ? '#86efac' : 'var(--civ-stone-muted)' }}>{guaranteed}</b>
        <button
          className="glass-btn"
          style={{ padding: '0 4px', minWidth: 16 }}
          disabled={guaranteed >= count}
          onClick={() => onBumpGuar(1)}
        >
          +
        </button>
      </div>

      {/* Bluff / Secret declaration for unstated cards */}
      {unstated > 0 && (
        <select
          value={claim}
          onChange={(e) => onSetClaim(e.target.value)}
          style={{
            background: 'var(--civ-stone-900)',
            color: 'var(--civ-gold-light)',
            border: '1px solid var(--civ-gold-border)',
            borderRadius: 4,
            fontSize: 9,
            padding: '2px 3px',
            maxWidth: 82,
          }}
        >
          <option value="">(secret/calamité)</option>
          {!isCalamity && <option value={cardId}>vrai: {commodityById.get(cardId)?.name ?? cardId}</option>}
          {COMMODITY_ORDER.filter((x) => x !== cardId).map((x) => (
            <option key={x} value={x}>
              bluff: {commodityById.get(x)?.name}
            </option>
          ))}
        </select>
      )}

      <button
        className="glass-btn glass-btn--danger"
        style={{ padding: '1px 6px', fontSize: 9, alignSelf: 'stretch' }}
        onClick={onRemove}
        title="Retirer de l'offre"
      >
        ✕ Retirer
      </button>
    </div>
  );
}
