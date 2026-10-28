import { civById } from '../../../../data/index.js';
import type { Action, OpenOffer, PlayerId, PlayerState } from '../../../../engine/types.js';
import { VisualBundleFace, bundleSummaryText } from './VisualBundleFace.js';
import { OfferBuilder } from './OfferBuilder.js';
import { CloseIcon } from '../../../theme/icons/index.js';
import { useTranslation } from '../../../i18n/index.js';

interface MarketplaceOffersProps {
  otherOffers: OpenOffer[];
  actor: PlayerId;
  me: PlayerState;
  respondTo: number | null;
  onSetRespondTo: (id: number | null) => void;
  onApply: (a: Action) => void;
  cName: (c: string) => string;
}

export function MarketplaceOffers({
  otherOffers,
  actor,
  me,
  respondTo,
  onSetRespondTo,
  onApply,
  cName,
}: MarketplaceOffersProps) {
  const { trCiv, t, lang } = useTranslation();
  const activeNegotiation = otherOffers.find((o) => o.id === respondTo);

  const orSeparator = lang === 'en' ? ' or ' : lang === 'de' ? ' oder ' : lang === 'es' ? ' o ' : ' ou ';
  const talksWithLabel = (name: string) => lang === 'en' ? `Talks with ${name}` : lang === 'de' ? `Verhandlungen mit ${name}` : lang === 'es' ? `Conversaciones con ${name}` : `Pourparlers avec ${name}`;
  const proposalFromLabel = (name: string) => lang === 'en' ? `Proposal from ${name}:` : lang === 'de' ? `Vorschlag von ${name}:` : lang === 'es' ? `Propuesta de ${name}:` : `Proposition de ${name} :`;
  const declarationLabel = lang === 'en' ? 'Declaration:' : lang === 'de' ? 'Erklärung:' : lang === 'es' ? 'Declaración:' : 'Déclaration :';
  const counterOfferLabel = lang === 'en' ? 'Your counter-offer (select at least 3 cards):' : lang === 'de' ? 'Dein Gegenangebot (mindestens 3 Karten wählen):' : lang === 'es' ? 'Tu contraoferta (selecciona al menos 3 cartas):' : 'Votre contre-offre (sélectionnez au moins 3 cartes) :';
  const submitExchangeLabel = (name: string) => t.trade.sendCounterOffer(name);
  const marketplaceTitle = lang === 'en' ? 'Market Exchange' : lang === 'de' ? 'Völker-Börse' : lang === 'es' ? 'Bolsa de las Naciones' : 'Bourse des Nations';
  const marketplaceSubtitle = lang === 'en' ? 'Public offers open for negotiation' : lang === 'de' ? 'Öffentliche Handelsangebote' : lang === 'es' ? 'Ofertas públicas abiertas a la negociación' : 'Offres publiques ouvertes à la négociation';
  const noOffersText = lang === 'en' ? 'No other nation has posted an offer to the board yet. Post your offer on the left to invite foreign merchants!' : lang === 'de' ? 'Noch hat keine andere Nation ein Angebot ausgehängt. Veröffentliche dein Angebot links, um fremde Händler einzuladen!' : lang === 'es' ? 'Ninguna otra nación ha publicado una oferta en el tablero todavía. ¡Publica tu oferta a la izquierda para invitar a los mercaderes extranjeros!' : 'Aucune autre nation n\'a pour l\'instant déposé d\'offre au tableau. Publiez votre offre à gauche pour inviter les marchands étrangers !';
  const offersLabel = lang === 'en' ? 'offers:' : lang === 'de' ? 'bietet:' : lang === 'es' ? 'ofrece:' : 'propose :';
  const responseSentLabel = lang === 'en' ? '✓ Response sent' : lang === 'de' ? '✓ Antwort gesendet' : lang === 'es' ? '✓ Respuesta enviada' : '✓ Réponse envoyée';

  if (activeNegotiation) {
    const fromCiv = civById.get(activeNegotiation.from);
    const fromCivName = activeNegotiation.from ? trCiv(activeNegotiation.from) : (fromCiv?.name ?? '');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
        {/* Header of focused bilateral negotiation */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 12px',
            background: 'rgba(20, 26, 36, 0.95)',
            border: '1px solid var(--civ-gold-border)',
            borderRadius: 8,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: fromCiv?.color ?? '#ffd23f',
                boxShadow: `0 0 8px ${fromCiv?.color ?? '#ffd23f'}`,
              }}
            />
            <span style={{ fontFamily: 'var(--civ-font-display)', fontWeight: 800, color: 'var(--civ-gold-light)', fontSize: 13, textTransform: 'uppercase' }}>
              {talksWithLabel(fromCivName)}
            </span>
          </div>
          <button
            onClick={() => onSetRespondTo(null)}
            className="glass-btn"
            style={{ padding: '3px 8px', fontSize: 10 }}
            title={t.common.close}
          >
            <CloseIcon size={12} />
            <span>{t.common.close}</span>
          </button>
        </div>

        {/* Incoming Offer Banner */}
        <div style={{ padding: '8px 12px', background: 'rgba(16, 21, 28, 0.75)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 6 }}>
            <span style={{ color: 'var(--civ-stone-muted)' }}>{proposalFromLabel(fromCivName)}</span>
            <span>
              {t.trade.wantsHeader} <b style={{ color: 'var(--civ-gold-base)' }}>{activeNegotiation.wants.map(cName).join(orSeparator)}</b>
            </span>
          </div>
          <VisualBundleFace b={activeNegotiation.give} />
          <div style={{ fontSize: 11, color: 'var(--civ-parchment)', marginTop: 4 }}>
            {declarationLabel} <i>{bundleSummaryText(activeNegotiation.give)}</i>
          </div>
        </div>

        {/* Counter-offer builder */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <span style={{ fontSize: 11, color: 'var(--civ-gold-light)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
            {counterOfferLabel}
          </span>
          <div style={{ padding: '6px 10px', marginBottom: 8, background: 'rgba(30, 41, 59, 0.65)', border: '1px solid rgba(148, 163, 184, 0.25)', borderRadius: 6, fontSize: 11, color: '#cbd5e1', lineHeight: 1.45 }}>
            {t.trade.counterOfferNotice(fromCivName)}
          </div>
          <OfferBuilder
            me={me}
            wantPicker={false}
            receive={activeNegotiation.give}
            submitLabel={submitExchangeLabel(fromCivName)}
            onSubmit={(give) => {
              onApply({ type: 'respondOffer', offerId: activeNegotiation.id, give });
              onSetRespondTo(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 4 }}>
        <span style={{ fontFamily: 'var(--civ-font-display)', fontWeight: 800, color: 'var(--civ-gold-light)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.6 }}>
          {marketplaceTitle} ({otherOffers.length})
        </span>
        <span style={{ fontSize: 10, color: 'var(--civ-stone-muted)' }}>
          {marketplaceSubtitle}
        </span>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
        {otherOffers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--civ-stone-muted)', fontStyle: 'italic', background: 'rgba(20, 26, 36, 0.4)', borderRadius: 8, border: '1px dashed var(--civ-gold-border-subtle)' }}>
            {noOffersText}
          </div>
        )}

        {otherOffers.map((o) => {
          const fromCiv = civById.get(o.from);
          const fromCivName = o.from ? trCiv(o.from) : (fromCiv?.name ?? '');
          const hasResponded = o.responses.some((r) => r.from === actor);

          return (
            <div
              key={o.id}
              style={{
                background: 'rgba(18, 23, 31, 0.85)',
                border: '1px solid var(--civ-gold-border-subtle)',
                borderRadius: 8,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                boxShadow: 'var(--civ-glass-shadow)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: fromCiv?.color ?? '#ffd23f' }} />
                  <b style={{ color: fromCiv?.color ?? '#ffffff', fontSize: 12 }}>{fromCivName}</b>
                  <span style={{ fontSize: 10, color: 'var(--civ-stone-muted)' }}>{offersLabel}</span>
                </div>
                <div style={{ fontSize: 11 }}>
                  {t.trade.wantsHeader} <b style={{ color: 'var(--civ-gold-base)' }}>{o.wants.map(cName).join(orSeparator)}</b>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <VisualBundleFace b={o.give} />
                  <span style={{ fontSize: 10, color: 'var(--civ-stone-muted)', fontStyle: 'italic' }}>
                    {bundleSummaryText(o.give)}
                  </span>
                </div>

                <div>
                  {hasResponded ? (
                    <span style={{ fontSize: 11, color: '#86efac', fontWeight: 700, padding: '4px 8px', borderRadius: 4, background: 'rgba(22, 101, 52, 0.3)' }}>
                      {responseSentLabel}
                    </span>
                  ) : (
                    <button
                      className="glass-btn glass-btn--primary"
                      style={{ padding: '6px 14px', fontSize: 11 }}
                      onClick={() => onSetRespondTo(o.id)}
                    >
                      💬 {t.trade.respond}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
