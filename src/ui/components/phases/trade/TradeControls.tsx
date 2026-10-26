import { useState } from 'react';
import { civById, commodityById } from '../../../../data/index.js';
import { bundleFace, handValue } from '../../../../engine/helpers.js';
import type { Action, GameState, PlayerId } from '../../../../engine/types.js';
import { OfferBuilder, isCal } from './OfferBuilder.js';
import { VisualBundleFace } from './VisualBundleFace.js';
import { CompletedTradeHistory } from './CompletedTradeHistory.js';
import { MarketplaceOffers } from './MarketplaceOffers.js';

interface TradeControlsProps {
  state: GameState;
  actor: PlayerId;
  onApply: (a: Action) => void;
}

export function TradeControls({ state, actor, onApply }: TradeControlsProps) {
  const me = state.players[actor]!;
  const n = state.negotiation;
  const myOffer = n.offers.find((o) => o.from === actor);
  const otherOffers = n.offers.filter((o) => o.from !== actor);
  const [respondTo, setRespondTo] = useState<number | null>(null);

  const cName = (c: string) => (isCal(c) ? `⚠ ${c.slice(9)}` : commodityById.get(c)?.name ?? c);
  const chips = (m: Record<string, number>) => Object.entries(m).map(([c, k]) => `${k}× ${cName(c)}`).join(', ') || '—';

  const handCards = Object.entries(me.hand).filter(([c, k]) => !isCal(c) && k > 0);
  const handTotal = handCards.reduce((a, [, k]) => a + k, 0);
  const cals = Object.keys(me.hand).filter((c) => isCal(c) && (me.hand[c] ?? 0) > 0);

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
        <div>
          <span style={{ fontFamily: 'var(--civ-font-display)', fontSize: 13, fontWeight: 800, color: 'var(--civ-gold-light)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Comptoir Commercial Méditerranéen
          </span>
          <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)', marginLeft: 8 }}>
            Main active : <b style={{ color: 'var(--civ-marble)' }}>{handTotal}</b> marchandise{handTotal > 1 ? 's' : ''} · valeur estimée <b style={{ color: 'var(--civ-gold-base)' }}>{handValue(me.hand)}</b>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="glass-btn" style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => onApply({ type: 'tradeWait' })}>
            ⏳ Attendre
          </button>
          <button className="glass-btn glass-btn--primary" style={{ padding: '4px 12px', fontSize: 11 }} onClick={() => onApply({ type: 'pass' })}>
            Terminer le commerce ➔
          </button>
        </div>
      </div>

      {/* Calamity Warning Banner if any */}
      {cals.length > 0 && (
        <div style={{ padding: '6px 10px', fontSize: 11, background: 'rgba(120, 24, 24, 0.45)', border: '1px solid #f87171', borderRadius: 6, color: '#fca5a5' }}>
          ⚠ <b>{cals.length} Calamité{cals.length > 1 ? 's' : ''} en main :</b> {cals.map((c) => c.slice(9)).join(', ')}. Vous pouvez en glisser une échangeable dans vos offres secrètement (§28.3).
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
                  Votre offre en vitrine :
                </span>
                <span style={{ fontSize: 11, color: 'var(--civ-parchment)' }}>
                  Recherche : <b style={{ color: 'var(--civ-gold-base)' }}>{myOffer.wants.map(cName).join(' ou ')}</b>
                </span>
              </div>

              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 9, color: 'var(--civ-stone-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Cartes réelles :</span>
                  <VisualBundleFace b={myOffer.give} actual={myOffer.give.actual} />
                </div>
                <div>
                  <span style={{ fontSize: 9, color: 'var(--civ-stone-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 3 }}>Vue adverse :</span>
                  <VisualBundleFace b={myOffer.give} />
                </div>
              </div>

              {myOffer.responses.length === 0 ? (
                <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                  En attente de réponses des autres nations marchandes…
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 8 }}>
                  <span style={{ fontWeight: 700, color: 'var(--civ-gold-light)', fontSize: 11, textTransform: 'uppercase' }}>
                    Réponses reçues ({myOffer.responses.length}) :
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
                    return (
                      <div key={r.from} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '6px 10px', background: 'rgba(12, 16, 22, 0.85)', borderRadius: 6, border: '1px solid var(--civ-gold-border-subtle)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <b style={{ color: fromCiv?.color ?? '#ffffff', fontSize: 12 }}>{fromCiv?.name}</b>
                          <VisualBundleFace b={r.give} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: 9, color: 'var(--civ-stone-muted)', display: 'block' }}>Gain estimé</span>
                            <b style={{ color: gain >= 0 ? '#86efac' : '#f87171', fontSize: 11 }}>{gain >= 0 ? '+' : ''}{gain} pts</b>
                          </div>
                          <button className="glass-btn glass-btn--primary" style={{ padding: '5px 12px', fontSize: 11 }} onClick={() => onApply({ type: 'acceptResponse', offerId: myOffer.id, responder: r.from })}>
                            Accepter
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button className="glass-btn glass-btn--danger" style={{ marginTop: 8, padding: '4px 10px', fontSize: 11 }} onClick={() => onApply({ type: 'withdrawOffer' })}>
                {myOffer.responses.length ? 'Rejeter tout & retirer' : 'Retirer l’offre'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontFamily: 'var(--civ-font-display)', fontWeight: 800, color: 'var(--civ-gold-light)', fontSize: 12, textTransform: 'uppercase' }}>
                Émettre une nouvelle offre au marché :
              </span>
              <OfferBuilder
                me={me}
                wantPicker
                submitLabel="Publier l’offre au tableau"
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
