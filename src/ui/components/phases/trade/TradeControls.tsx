import { useState } from 'react';
import { civById, commodityById } from '../../../../data/index.js';
import { bundleFace, handValue } from '../../../../engine/helpers.js';
import type { Action, GameState, PlayerId, TradeBundle } from '../../../../engine/types.js';
import { OfferBuilder, isCal } from './OfferBuilder.js';

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

  const describe = (b: TradeBundle) => {
    const f = bundleFace(b);
    if (f.legacy) return <>{f.count} cartes (annoncé {chips(f.claimed)} ; au moins deux vraies)</>;
    return (
      <>
        {f.count} cartes : <b>{chips(f.guaranteed)}</b> garanties
        {Object.keys(f.claimed).length > 0 && <>; annonce {chips(f.claimed)} <i>(non vérifié)</i></>}
        {f.unspecified > 0 && <>; {f.unspecified} non précisées</>}
      </>
    );
  };

  const handCards = Object.entries(me.hand).filter(([c, k]) => !isCal(c) && k > 0);
  const handTotal = handCards.reduce((a, [, k]) => a + k, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div className="civ-lbl">
        Votre main : <b>{handTotal}</b> marchandise{handTotal > 1 ? 's' : ''} · valeur estimée <b>{handValue(me.hand)}</b>.
      </div>

      {(() => {
        const cals = Object.keys(me.hand).filter((c) => isCal(c) && (me.hand[c] ?? 0) > 0);
        if (cals.length === 0) return null;
        return (
          <div className="civ-msg" style={{ padding: 6, fontSize: 12, background: 'rgba(120,42,42,0.5)' }}>
            ⚠ Vous détenez {cals.length} calamité{cals.length > 1 ? 's' : ''} : {cals.map((c) => c.slice(9)).join(', ')}. Vous pouvez en glisser une échangeable dans vos offres pour la transmettre (§28.3).
          </div>
        );
      })()}

      {(n.completed ?? []).filter((d) => d.a === actor || d.b === actor).map((d, i) => {
        const youAreA = d.a === actor;
        const gave = youAreA ? d.aGave : d.bGave;
        const got = youAreA ? d.bGave : d.aGave;
        const partner = youAreA ? d.b : d.a;
        const face = bundleFace(got);
        const said: Record<string, number> = { ...face.guaranteed };
        for (const [c, k] of Object.entries(face.claimed)) said[c] = (said[c] ?? 0) + k;
        const bluff: Record<string, number> = {};
        for (const [c, k] of Object.entries(got.actual)) {
          if (k > (said[c] ?? 0)) bluff[c] = k - (said[c] ?? 0);
        }
        return (
          <div key={i} className="civ-msg" style={{ padding: 6, fontSize: 12 }}>
            ✅ Échange avec <b style={{ color: civById.get(partner)?.color }}>{civById.get(partner)?.name}</b> : vous avez cédé {chips(gave.actual)} et reçu <b>{chips(got.actual)}</b>.
            {Object.keys(bluff).length > 0 && <span style={{ color: '#8a3b12' }}> ({civById.get(partner)?.name} a bluffé : {chips(bluff)})</span>}
          </div>
        );
      })}

      {myOffer ? (
        <div style={{ border: '2px solid #ffd23f', borderRadius: 4, padding: 6 }}>
          <div className="civ-lbl">
            Votre offre — vous cédez {chips(myOffer.give.actual)} ; les autres voient {describe(myOffer.give)} ; recherche {myOffer.wants.map(cName).join(' ou ')}.
          </div>
          {myOffer.responses.length === 0 ? (
            <div className="civ-lbl">En attente de réponses…</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 3 }}>
              <span className="civ-lbl">Réponses reçues :</span>
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
                return (
                  <div key={r.from} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                    <span style={{ flex: 1 }}>
                      <b style={{ color: civById.get(r.from)?.color }}>{civById.get(r.from)?.name}</b> propose {describe(r.give)}
                    </span>
                    <b style={{ color: gain >= 0 ? '#2e6b3a' : '#8a3b12', minWidth: 38, textAlign: 'right' }}>
                      {gain >= 0 ? '+' : ''}{gain}
                    </b>
                    <button className="civ-btn" onClick={() => onApply({ type: 'acceptResponse', offerId: myOffer.id, responder: r.from })}>
                      Accepter
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <button className="civ-btn" style={{ marginTop: 4 }} onClick={() => onApply({ type: 'withdrawOffer' })}>
            {myOffer.responses.length ? 'Rejeter tout & retirer' : 'Retirer l’offre'}
          </button>
        </div>
      ) : (
        <div>
          <span className="civ-lbl">Publier une offre :</span>
          <OfferBuilder
            me={me}
            wantPicker
            submitLabel="Publier l’offre au tableau"
            onSubmit={(give, wants) => onApply({ type: 'postOffer', give, wants })}
          />
        </div>
      )}

      <div>
        <span className="civ-lbl">Offres ouvertes sur le tableau :</span>
        {otherOffers.length === 0 && <div className="civ-lbl">(aucune offre en cours)</div>}
        {otherOffers.map((o) => (
          <div key={o.id} style={{ border: '1px solid #7a4a18', borderRadius: 4, padding: 6, marginTop: 3 }}>
            <div style={{ fontSize: 12 }}>
              <b style={{ color: civById.get(o.from)?.color }}>{civById.get(o.from)?.name}</b> propose {describe(o.give)} · recherche <b>{o.wants.map(cName).join(' ou ')}</b>
            </div>
            {o.responses.some((r) => r.from === actor) ? (
              <span className="civ-lbl">Vous avez répondu.</span>
            ) : respondTo === o.id ? (
              <OfferBuilder
                me={me}
                wantPicker={false}
                receive={o.give}
                submitLabel={`Répondre à ${civById.get(o.from)?.name}`}
                onSubmit={(give) => {
                  onApply({ type: 'respondOffer', offerId: o.id, give });
                  setRespondTo(null);
                }}
              />
            ) : (
              <button className="civ-btn" style={{ marginTop: 3 }} onClick={() => setRespondTo(o.id)}>
                Répondre à cette offre
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="civ-btn" onClick={() => onApply({ type: 'tradeWait' })}>
          Attendre — voir les autres offres
        </button>
        <button className="civ-btn" onClick={() => onApply({ type: 'pass' })}>
          Terminer le commerce (passer)
        </button>
      </div>
    </div>
  );
}
