import { useState, type CSSProperties } from 'react';
import { advances as ALL_ADVANCES, advanceById, commodityById } from '../../../data/index.js';
import { miningAvailable, creditTowards, handValue } from '../../../engine/helpers.js';
import type { Action, GameState, PlayerId } from '../../../engine/types.js';
import { useTranslation, translateAdvance, translateCommodity } from '../../i18n/index.js';
import { AdvanceCard } from '../../cards/AdvanceCard.js';
import { AdvanceDetailModal } from '../views/index.js';

interface AdvancePickerProps {
  state: GameState;
  actor: PlayerId;
  onApply: (a: Action) => void;
}

const NOTE: CSSProperties = { color: '#fca5a5', fontWeight: 600, fontSize: 11 };

export function AdvancePicker({ state, actor, onApply }: AdvancePickerProps) {
  const { t, language } = useTranslation();
  const p = state.players[actor]!;
  const mining = miningAvailable(p);
  const [sel, setSel] = useState<string[]>([]);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [spend, setSpend] = useState<Record<string, number>>({});
  const [treasury, setTreasury] = useState(0);

  const cName = (c: string) => translateCommodity(c, t);
  const aName = (id: string) => translateAdvance(id, t).name || advanceById.get(id)?.name || id;

  const owned = new Set(p.advances);
  const boughtThisTurn = p.advancesThisTurn ?? [];
  const creditEligible = p.advances.filter((a) => !boughtThisTurn.includes(a));
  const creditFor = (id: string) => creditTowards(creditEligible, id);

  const available = ALL_ADVANCES.filter(
    (a) => !owned.has(a.id) && (a.prerequisites ?? []).every((pre) => owned.has(pre) && !boughtThisTurn.includes(pre)),
  );
  const basket = sel.map((id) => advanceById.get(id)!).filter(Boolean);
  const commHand = Object.entries(p.hand)
    .filter(([c, n]) => !c.startsWith('calamity:') && n > 0)
    .sort((a, b) => (commodityById.get(a[0])?.value ?? 0) - (commodityById.get(b[0])?.value ?? 0));

  const spendableHand: Record<string, number> = Object.fromEntries(commHand);
  if (spendableHand['grain']) {
    spendableHand['grain'] -= p.grainLockedThisTurn ?? 0;
    if (spendableHand['grain'] <= 0) delete spendableHand['grain'];
  }

  const maxCardVal = handValue(spendableHand, { mining });
  const affordable = (a: { id: string; cost: number }) => maxCardVal + p.treasury + creditFor(a.id) >= a.cost;
  const cardVal = handValue(spend, { mining });
  const credit = basket.reduce((tCredit, a) => tCredit + creditFor(a.id), 0);
  const cost = basket.reduce((tCost, a) => tCost + a.cost, 0);

  const maxTreasury = Math.min(p.treasury, Math.max(0, cost - cardVal - credit));
  const treasuryUsed = Math.min(treasury, maxTreasury);
  const paid = cardVal + treasuryUsed + credit;
  const canBuy = basket.length > 0 && paid >= cost;

  const grainLocked = Math.min(p.grainLockedThisTurn ?? 0, p.hand['grain'] ?? 0);
  const spendable = (c: string) => (p.hand[c] ?? 0) - (c === 'grain' ? grainLocked : 0);
  const addSpend = (c: string) => setSpend((s) => ((s[c] ?? 0) >= spendable(c) ? s : { ...s, [c]: (s[c] ?? 0) + 1 }));
  const rmSpend = (c: string) =>
    setSpend((s) => {
      const n = (s[c] ?? 0) - 1;
      const o = { ...s };
      if (n <= 0) delete o[c]; else o[c] = n;
      return o;
    });

  const toggle = (id: string) => setSel((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const buy = () => {
    onApply({ type: 'buyAdvance', advances: sel, spendCommodities: spend, spendTreasury: treasuryUsed });
    setSel([]);
    setSpend({});
    setTreasury(0);
  };

  const handCount = commHand.reduce((tCount, [, n]) => tCount + n, 0);
  const done = () => {
    const warn = [
      basket.length > 0 ? (language === 'en' ? `You have selected ${basket.map((a) => aName(a.id)).join(' + ')} without buying.` : `Vous avez sélectionné ${basket.map((a) => aName(a.id)).join(' + ')} sans cliquer sur Acheter.`) : '',
      handCount > 8 ? (language === 'en' ? `You hold ${handCount} commodities — maximum is 8, you must discard ${handCount - 8} (§31.71).` : `Vous détenez ${handCount} marchandises — seules 8 sont conservables, vous devrez en défausser ${handCount - 8} (§31.71).`) : '',
    ].filter(Boolean);
    if (!warn.length || confirm(`${warn.join('\n\n')}\n\n${language === 'en' ? 'End acquisitions anyway?' : 'Terminer quand même vos acquisitions ?'}`)) onApply({ type: 'pass' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--civ-gold-light)', fontWeight: 700, textTransform: 'uppercase' }}>
          {t.advances.title} — {t.views.census.treasury} : {p.treasury}
        </span>
        <span style={{ fontSize: 11, color: 'var(--civ-stone-muted)' }}>
          {available.length} {language === 'en' ? 'advances available' : language === 'de' ? 'Fortschritte verfügbar' : language === 'es' ? 'avances disponibles' : 'progrès disponibles'}
        </span>
      </div>

      {grainLocked > 0 && <span style={NOTE}>🔒 {grainLocked} {language === 'en' ? 'Grain cards locked by Famine (§30.312).' : 'carte(s) de Grain verrouillée(s) par la famine (§30.312).'}</span>}
      {p.advances.includes('mining') && !mining && <span style={NOTE}>⛏ {language === 'en' ? 'Mining used this turn.' : 'Industrie Minière déjà utilisée ce tour.'}</span>}

      {/* Available Advances Gallery with Cards */}
      <div
        className="civ-custom-scrollbar"
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          paddingBottom: 6,
          maxHeight: 165,
          alignItems: 'center',
        }}
      >
        {available.length === 0 && <span className="civ-lbl">{language === 'en' ? 'No advances available.' : 'Aucun progrès disponible.'}</span>}
        {available.map((a) => {
          const aff = affordable(a);
          const on = sel.includes(a.id);
          const effCost = Math.max(0, a.cost - creditFor(a.id));

          return (
            <div key={a.id} style={{ position: 'relative', flexShrink: 0 }}>
              <AdvanceCard
                id={a.id}
                effectiveCost={effCost}
                isSelected={on}
                disabled={!aff && !on}
                onClick={() => toggle(a.id)}
                width={94}
                height={140}
              />
              <button
                onClick={(e) => { e.stopPropagation(); setDetailId(a.id); }}
                style={{
                  position: 'absolute',
                  top: 3,
                  left: 3,
                  background: 'rgba(0,0,0,0.7)',
                  color: 'var(--civ-gold-light)',
                  border: '1px solid var(--civ-gold-border)',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 2,
                }}
                title={language === 'en' ? 'Advance details' : 'Détails du progrès'}
              >
                i
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected Basket & Payment Controls */}
      {basket.length > 0 && (
        <div style={{ border: '1px solid var(--civ-gold-border)', background: 'rgba(16, 21, 28, 0.9)', borderRadius: 8, padding: 8, display: 'flex', flexDirection: 'column', gap: 5, boxShadow: 'var(--civ-glass-shadow)' }}>
          <div style={{ fontSize: 11, color: 'var(--civ-gold-light)', fontWeight: 700 }}>
            {language === 'en' ? 'Basket:' : 'Panier :'} <b>{basket.map((a) => aName(a.id)).join(' + ')}</b> — {t.advances.cost} {cost}{credit ? `, ${credit} ${t.advances.credits}` : ''}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {commHand.map(([c, n]) => (
              <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, border: '1px solid var(--civ-gold-border-subtle)', borderRadius: 4, padding: '1px 4px', background: spend[c] ? 'rgba(35, 55, 45, 0.6)' : 'rgba(20, 26, 36, 0.6)' }}>
                <button className="glass-btn" style={{ padding: '2px 5px', fontSize: 10 }} disabled={spendable(c) <= 0} onClick={() => addSpend(c)}>{cName(c)} {spend[c] ? `${spend[c]}/${spendable(c)}` : `×${n}`}</button>
                {(spend[c] ?? 0) > 0 && <button className="glass-btn" style={{ padding: '2px 4px', fontSize: 10 }} onClick={() => rmSpend(c)}>−</button>}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11 }}>
            <span style={{ color: 'var(--civ-stone-muted)' }}>{t.views.census.treasury} :</span>
            <input type="range" min={0} max={Math.max(0, maxTreasury)} value={treasuryUsed} onChange={(e) => setTreasury(+e.target.value)} style={{ width: 100 }} disabled={maxTreasury <= 0} />
            <b>{treasuryUsed}</b>
            <span style={{ color: 'var(--civ-stone-muted)' }}>· {language === 'en' ? 'paid' : 'payé'} <b style={{ color: canBuy ? '#86efac' : '#f87171' }}>{paid}</b> / {cost}</span>
            <button className={`glass-btn ${canBuy ? 'glass-btn--primary' : ''}`} style={{ padding: '3px 10px', fontSize: 10 }} disabled={!canBuy} onClick={buy}>{canBuy ? `${t.advances.buy} (${basket.length})` : (language === 'en' ? `Missing ${cost - paid} pts` : `Manque ${cost - paid} pts`)}</button>
            <button className="glass-btn" style={{ padding: '3px 8px', fontSize: 10 }} onClick={() => { setSel([]); setSpend({}); setTreasury(0); }}>{language === 'en' ? 'Clear' : language === 'de' ? 'Leeren' : language === 'es' ? 'Vaciar' : 'Vider'}</button>
          </div>
        </div>
      )}

      <button className="glass-btn glass-btn--primary" style={{ alignSelf: 'flex-start', marginTop: 2, padding: '6px 14px' }} onClick={done}>
        {language === 'en' ? 'Finish acquisitions (pass) ➔' : language === 'de' ? 'Erwerb abschließen (passen) ➔' : language === 'es' ? 'Finalizar adquisiciones (pasar) ➔' : 'Terminer les acquisitions (passer) ➔'}
      </button>

      {detailId && (
        <AdvanceDetailModal
          id={detailId}
          onClose={() => setDetailId(null)}
          owned={owned.has(detailId)}
          creditDiscount={creditFor(detailId)}
        />
      )}
    </div>
  );
}
