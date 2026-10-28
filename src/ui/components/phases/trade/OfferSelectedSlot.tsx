import { commodityById } from '../../../../data/index.js';
import { CommodityCard, CalamityCard } from '../../../cards/index.js';
import { COMMODITY_ORDER, isCal } from './OfferBuilder.js';
import { useTranslation } from '../../../i18n/index.js';

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
  const { trCommodity, t, lang } = useTranslation();
  const unstated = count - guaranteed;
  const isCalamity = isCal(cardId);

  const realPrefix = lang === 'en' ? 'true: ' : lang === 'de' ? 'echt: ' : lang === 'es' ? 'real: ' : 'vrai: ';
  const bluffPrefix = lang === 'en' ? 'bluff: ' : lang === 'de' ? 'Bluff: ' : lang === 'es' ? 'farol: ' : 'bluff: ';

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

      {/* Guaranteed quantity control (only for commodities) */}
      {!isCalamity ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10 }}>
          <span style={{ color: 'var(--civ-stone-muted)', fontSize: 9 }}>{t.trade.guaranteed} :</span>
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
      ) : (
        <div style={{ padding: '2px 4px', borderRadius: 3, background: 'rgba(185, 28, 28, 0.3)', border: '1px solid #f87171' }}>
          <span style={{ color: '#fca5a5', fontSize: 8.5, fontWeight: 800 }}>⚡ Calamité secrète</span>
        </div>
      )}

      {/* Bluff / Secret declaration for unstated cards or calamity */}
      {(unstated > 0 || isCalamity) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%', boxSizing: 'border-box' }}>
          <span style={{ fontSize: 8.5, color: 'var(--civ-stone-muted)' }}>
            {isCalamity ? '🎭 Bluff annoncé :' : 'Déclaration :'}
          </span>
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
              width: '100%',
              maxWidth: 96,
            }}
          >
            <option value="">
              {isCalamity ? t.trade.secretCalamityCard : t.trade.secretCalamity}
            </option>
            {!isCalamity && <option value={cardId}>{realPrefix}{trCommodity(cardId)}</option>}
            {COMMODITY_ORDER.filter((x) => x !== cardId).map((x) => (
              <option key={x} value={x}>
                {bluffPrefix}{trCommodity(x)}
              </option>
            ))}
            {!isCalamity && (
              <option value="calamity:bluff">
                {bluffPrefix}⚡ {t.trade.bluffCalamity}
              </option>
            )}
          </select>
        </div>
      )}

      <button
        className="glass-btn glass-btn--danger"
        style={{ padding: '1px 6px', fontSize: 9, alignSelf: 'stretch' }}
        onClick={onRemove}
        title={t.trade.remove}
      >
        ✕ {t.trade.remove}
      </button>
    </div>
  );
}
