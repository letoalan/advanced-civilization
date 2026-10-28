import { useState } from 'react';
import { calamityById, civById, commodityById } from '../../../../data/index.js';
import { bundleFace, handValue } from '../../../../engine/helpers.js';
import { tradeRound } from '../../../../engine/index.js';
import type { Action, GameState, PlayerId } from '../../../../engine/types.js';
import { OfferBuilder, isCal } from './OfferBuilder.js';
import { VisualBundleFace } from './VisualBundleFace.js';
import { CompletedTradeHistory } from './CompletedTradeHistory.js';
import { MarketplaceOffers } from './MarketplaceOffers.js';
import { CalamityCard } from '../../../cards/index.js';
import { useTranslation } from '../../../i18n/index.js';

interface TradeControlsProps {
  state: GameState;
  actor: PlayerId;
  onApply: (a: Action) => void;
}

export function TradeControls({ state, actor, onApply }: TradeControlsProps) {
  const { trCommodity, trCalamity, trCiv, t, lang } = useTranslation();
  const me = state.players[actor]!;
  const n = state.negotiation;
  const myOffer = n.offers.find((o) => o.from === actor);
  const otherOffers = n.offers.filter((o) => o.from !== actor);
  const [respondTo, setRespondTo] = useState<number | null>(null);

  const cName = (c: string) => (isCal(c) ? `⚠ ${trCalamity(c.slice(9)).name}` : trCommodity(c));
  const chips = (m: Record<string, number>) => Object.entries(m).map(([c, k]) => `${k}× ${cName(c)}`).join(', ') || '—';

  const handCards = Object.entries(me.hand).filter(([c, k]) => !isCal(c) && k > 0);
  const handTotal = handCards.reduce((a, [, k]) => a + k, 0);
  const cals = Object.keys(me.hand).filter((c) => isCal(c) && (me.hand[c] ?? 0) > 0);
  const tradableCals = cals.filter((c) => calamityById.get(c.slice(9))?.tradable === true);
  const nonTradableCals = cals.filter((c) => calamityById.get(c.slice(9))?.tradable !== true);

  const { current: currentRound, max: maxRounds } = tradeRound(state);

  const orSeparator = lang === 'en' ? ' or ' : lang === 'de' ? ' oder ' : lang === 'es' ? ' o ' : ' ou ';
  const newOfferLabel = lang === 'en' ? 'Post a new offer to market:' : lang === 'de' ? 'Neues Handelsangebot aushängen:' : lang === 'es' ? 'Publicar una nueva oferta al mercado:' : 'Émettre une nouvelle offre au marché :';
  const realCardsLabel = lang === 'en' ? 'Actual cards:' : lang === 'de' ? 'Echte Karten:' : lang === 'es' ? 'Cartas reales:' : 'Cartes réelles :';
  const opponentViewLabel = lang === 'en' ? 'Opponent view:' : lang === 'de' ? 'Gegner-Ansicht:' : lang === 'es' ? 'Vista rival:' : 'Vue adverse :';
  const waitingResponsesLabel = lang === 'en' ? 'Waiting for responses from other merchant nations…' : lang === 'de' ? 'Warte auf Antworten anderer Handelsnationen…' : lang === 'es' ? 'Esperando respuestas de otras naciones comerciantes…' : 'En attente de réponses des autres nations marchandes…';
  const responsesReceivedLabel = (count: number) => lang === 'en' ? `Responses received (${count}):` : lang === 'de' ? `Erhaltene Antworten (${count}):` : lang === 'es' ? `Respuestas recibidas (${count}):` : `Réponses reçues (${count}) :`;
  const acceptLabel = t.trade.acceptDeal;
  const withdrawLabel = myOffer?.responses.length
    ? (lang === 'en' ? 'Reject all & withdraw' : lang === 'de' ? 'Alle ablehnen & zurückziehen' : lang === 'es' ? 'Rechazar todo y retirar' : 'Rejeter tout & retirer')
    : (lang === 'en' ? 'Withdraw offer' : lang === 'de' ? 'Angebot zurückziehen' : lang === 'es' ? 'Retirar oferta' : 'Retirer l’offre');
  const estimatedGainLabel = lang === 'en' ? 'Estimated gain' : lang === 'de' ? 'Geschätzter Gewinn' : lang === 'es' ? 'Ganancia estimada' : 'Gain estimé';

  return (
    <div
      className="civ-custom-scrollbar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxHeight: 'calc(100vh - 145px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        paddingRight: 4,
      }}
    >
      {/* Top Banner: Pavilion Title & Civilisation Status (Sticky) */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(10, 13, 18, 0.96)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--civ-gold-border-subtle)',
          paddingBottom: 6,
          paddingTop: 2,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--civ-font-display)', fontSize: 13, fontWeight: 800, color: 'var(--civ-gold-light)', textTransform: 'uppercase', letterSpacing: 1 }}>
            {t.trade.tradingPost}
          </span>
          <span
            style={{
              padding: '2px 8px',
              borderRadius: 12,
              background: 'rgba(212, 163, 89, 0.15)',
              border: '1px solid var(--civ-gold-border)',
              color: 'var(--civ-gold-light)',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: 0.4,
            }}
          >
            🏛️ {t.trade.round(currentRound, maxRounds)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>
            {t.trade.activeHand(handTotal, handValue(me.hand))}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="glass-btn" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => onApply({ type: 'tradeWait' })}>
            {t.trade.wait}
          </button>
          <button className="glass-btn glass-btn--primary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => onApply({ type: 'pass' })}>
            {t.trade.finishTrade}
          </button>
        </div>
      </div>

      {/* Calamity Warning Banner with visual cards if any */}
      {cals.length > 0 && (
        <div style={{ padding: '10px 14px', fontSize: 11, background: 'rgba(120, 24, 24, 0.45)', border: '1px solid #f87171', borderRadius: 8, color: '#fca5a5', display: 'flex', flexDirection: 'column', gap: 8, boxShadow: 'var(--civ-glass-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
            <b>⚠ {t.trade.calamitiesInHand(cals.length)} :</b>
            <div style={{ display: 'flex', gap: 12, fontSize: 10.5 }}>
              {tradableCals.length > 0 && (
                <span style={{ color: '#86efac' }}>⚡ {tradableCals.length} {t.trade.tradableCalamity.toLowerCase()}</span>
              )}
              {nonTradableCals.length > 0 && (
                <span style={{ color: '#fca5a5' }}>⛔ {nonTradableCals.length} {t.trade.nonTradableCalamity.toLowerCase()}</span>
              )}
            </div>
          </div>

          {/* Visual Cards Row */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', padding: '2px 0' }}>
            {cals.map((c) => {
              const calId = c.slice(9);
              const isTradable = calamityById.get(calId)?.tradable === true;
              return (
                <div key={c} style={{ position: 'relative' }}>
                  <CalamityCard id={calId} width={64} height={96} />
                  <div
                    style={{
                      position: 'absolute',
                      top: 2,
                      left: 2,
                      fontSize: 7.5,
                      fontWeight: 800,
                      padding: '1px 3px',
                      borderRadius: 3,
                      background: isTradable ? 'rgba(22, 101, 52, 0.95)' : 'rgba(127, 29, 29, 0.95)',
                      color: isTradable ? '#86efac' : '#fca5a5',
                      border: isTradable ? '1px solid #22c55e' : '1px solid #ef4444',
                    }}
                  >
                    {isTradable ? '⚡ BLUFF' : '⛔ §9.1'}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: 6 }}>
            {tradableCals.length > 0 && (
              <div style={{ color: '#fed7aa', fontSize: 10.5 }}>
                ⚡ <b>{t.trade.tradableCalamity} :</b> {tradableCals.map((c) => trCalamity(c.slice(9)).name).join(', ')}. {t.trade.tradableNotice}
              </div>
            )}
            {nonTradableCals.length > 0 && (
              <div style={{ color: '#fca5a5', fontSize: 10.5 }}>
                ⛔ <b>{t.trade.nonTradableCalamity} :</b> {nonTradableCals.map((c) => trCalamity(c.slice(9)).name).join(', ')}. {t.trade.nonTradableNotice}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Completed Trades Carousel/History if relevant */}
      <CompletedTradeHistory completed={n.completed ?? []} actor={actor} chips={chips} />

      {/* Two-Column Trade Floor */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 14, alignItems: 'start' }}>
        {/* Left Column: Mon Comptoir (Active Offer or Offer Builder) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {myOffer ? (
            <div style={{ border: '1px solid var(--civ-gold-base)', borderRadius: 8, padding: 10, background: 'rgba(18, 23, 31, 0.9)', boxShadow: 'var(--civ-glass-shadow-lg)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 800, color: 'var(--civ-gold-light)', fontSize: 12, textTransform: 'uppercase' }}>
                  {t.trade.yourOfferHeader}
                </span>
                <span style={{ fontSize: 11, color: 'var(--civ-parchment)' }}>
                  {t.trade.wantsHeader} <b style={{ color: 'var(--civ-gold-base)' }}>{myOffer.wants.map(cName).join(orSeparator)}</b>
                </span>
              </div>

              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 9, color: 'var(--civ-stone-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
                    {realCardsLabel}
                  </span>
                  <VisualBundleFace b={myOffer.give} actual={myOffer.give.actual} />
                </div>
                <div>
                  <span style={{ fontSize: 9, color: 'var(--civ-stone-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>
                    {opponentViewLabel}
                  </span>
                  <VisualBundleFace b={myOffer.give} />
                </div>
              </div>

              {myOffer.responses.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                  {waitingResponsesLabel}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--civ-gold-light)', fontSize: 11, textTransform: 'uppercase' }}>
                    {responsesReceivedLabel(myOffer.responses.length)}
                  </span>
                  {myOffer.responses.map((r) => {
                    const rf = bundleFace(r.give);
                    const after = { ...me.hand };
                    for (const [c, k] of Object.entries(myOffer.give.actual)) {
                      after[c] = (after[c] ?? 0) - k;
                      if (after[c]! <= 0) delete after[c];
                    }
                    for (const m of [rf.guaranteed, rf.claimed]) {
                      for (const [c, k] of Object.entries(m)) after[c] = (after[c] ?? 0) + k;
                    }
                    const gain = handValue(after) - handValue(me.hand);
                    const fromCiv = civById.get(r.from);
                    const fromCivName = r.from ? trCiv(r.from) : (fromCiv?.name ?? '');
                    return (
                      <div key={r.from} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 10px', background: 'rgba(12, 16, 22, 0.85)', borderRadius: 6, border: '1px solid var(--civ-gold-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <b style={{ color: fromCiv?.color ?? '#ffffff', fontSize: 12 }}>{fromCivName}</b>
                          <VisualBundleFace b={r.give} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 9, color: 'var(--civ-stone-muted)', display: 'block' }}>{estimatedGainLabel}</span>
                            <b style={{ color: gain >= 0 ? '#86efac' : '#f87171', fontSize: 11 }}>{gain >= 0 ? '+' : ''}{gain} {t.common.points}</b>
                          </div>
                          <button className="glass-btn glass-btn--primary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => onApply({ type: 'acceptResponse', offerId: myOffer.id, responder: r.from })}>
                            {acceptLabel}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button className="glass-btn glass-btn--danger" style={{ marginTop: 8, padding: '4px 10px', fontSize: 11 }} onClick={() => onApply({ type: 'withdrawOffer' })}>
                {withdrawLabel}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: 'var(--civ-font-display)', fontWeight: 800, color: 'var(--civ-gold-light)', fontSize: 12, textTransform: 'uppercase' }}>
                {newOfferLabel}
              </span>
              <OfferBuilder
                me={me}
                wantPicker
                submitLabel={t.trade.publishOffer}
                onSubmit={(give, wants) => onApply({ type: 'postOffer', give, wants })}
              />
            </div>
          )}
        </div>

        {/* Right Column: Bourse des Nations & Négociations Bilatérales */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <MarketplaceOffers
            otherOffers={otherOffers}
            actor={actor}
            me={me}
            respondTo={respondTo}
            onSetRespondTo={setRespondTo}
            onApply={onApply}
            cName={cName}
          />
        </div>
      </div>
    </div>
  );
}
