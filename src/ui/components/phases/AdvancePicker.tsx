import { useState, type CSSProperties } from 'react';
import { advances as ALL_ADVANCES, advanceById, commodityById } from '../../../data/index.js';
import { miningAvailable, creditTowards, handValue } from '../../../engine/helpers.js';
import type { Action, GameState, PlayerId } from '../../../engine/types.js';
import { AdvanceTip } from '../views/index.js';

interface AdvancePickerProps {
  state: GameState;
  actor: PlayerId;
  onApply: (a: Action) => void;
}

const NOTE: CSSProperties = { color: '#5a1e06', fontWeight: 600 };

export function AdvancePicker({ state, actor, onApply }: AdvancePickerProps) {
  const p = state.players[actor]!;
  const mining = miningAvailable(p);
  const [sel, setSel] = useState<string[]>([]);
  const [tip, setTip] = useState<string>('');
  const [spend, setSpend] = useState<Record<string, number>>({});
  const [treasury, setTreasury] = useState(0);

  const cName = (c: string) => commodityById.get(c)?.name ?? c;
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
  const credit = basket.reduce((t, a) => t + creditFor(a.id), 0);
  const cost = basket.reduce((t, a) => t + a.cost, 0);

  const treasuryNeeded = Math.max(0, cost - cardVal - credit);
  const maxTreasury = Math.min(p.treasury, treasuryNeeded);
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
      if (n <= 0) delete o[c];
      else o[c] = n;
      return o;
    });

  const toggle = (id: string) => setSel((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));
  const buy = () => {
    onApply({ type: 'buyAdvance', advances: sel, spendCommodities: spend, spendTreasury: treasuryUsed });
    setSel([]);
    setSpend({});
    setTreasury(0);
  };

  const handCount = commHand.reduce((t, [, n]) => t + n, 0);
  const done = () => {
    const warn = [
      basket.length > 0 ? `Vous avez sélectionné ${basket.map((a) => a.name).join(' + ')} sans cliquer sur Acheter.` : '',
      handCount > 8 ? `Vous détenez ${handCount} marchandises — seules 8 sont conservables, vous devrez en défausser ${handCount - 8} (§31.71).` : '',
    ].filter(Boolean);
    if (!warn.length || confirm(`${warn.join('\n\n')}\n\nTerminer quand même vos acquisitions ?`)) onApply({ type: 'pass' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="civ-lbl">
        Acquérir des progrès — choisissez-en un ou plusieurs, puis payez le panier global (marchandises + trésor + réductions). Trésor disponible : {p.treasury}.
      </span>
      {grainLocked > 0 && <span className="civ-lbl" style={NOTE}>🔒 {grainLocked} carte(s) de Grain verrouillée(s) par la famine (§30.312).</span>}
      {p.advances.includes('mining') && !mining && <span className="civ-lbl" style={NOTE}>⛏ Industrie Minière déjà utilisée ce tour.</span>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {available.length === 0 && <span className="civ-lbl">Aucun progrès disponible.</span>}
        {available.map((a) => {
          const aff = affordable(a);
          const on = sel.includes(a.id);
          return (
            <span key={a.id} style={{ position: 'relative', display: 'inline-block' }} onMouseEnter={() => setTip(a.id)} onMouseLeave={() => setTip((t) => (t === a.id ? '' : t))}>
              <button className={`civ-btn ${on ? 'on' : ''}`} style={{ fontSize: 11, border: `2px solid ${on ? '#e6b85a' : aff ? '#5fbf6a' : 'transparent'}`, opacity: aff || on ? 1 : 0.55 }} onClick={() => toggle(a.id)}>
                {on ? '● ' : aff ? '✓ ' : ''}{a.name} ({a.cost}{creditFor(a.id) ? `, −${creditFor(a.id)}` : ''})
              </button>
              {tip === a.id && <AdvanceTip id={a.id} />}
            </span>
          );
        })}
      </div>
      {basket.length > 0 && (
        <div style={{ border: '1px solid #7a4a18', borderRadius: 4, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="civ-lbl">Achat de <b>{basket.map((a) => a.name).join(' + ')}</b> — coût {cost}{credit ? `, ${credit} en réductions` : ''} :</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            {commHand.map(([c, n]) => (
              <span key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: 2, border: '1px solid #7a4a18', borderRadius: 4, padding: '0 3px', background: spend[c] ? 'rgba(90,140,106,0.35)' : undefined }}>
                <button className="civ-btn" style={{ padding: '0 5px' }} disabled={spendable(c) <= 0} onClick={() => addSpend(c)}>
                  {cName(c)} {spend[c] ? `${spend[c]}/${spendable(c)}` : `×${n}`}
                </button>
                {(spend[c] ?? 0) > 0 && <button className="civ-btn" style={{ padding: '0 4px' }} onClick={() => rmSpend(c)}>−</button>}
              </span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span className="civ-lbl">Trésor :</span>
            <input type="range" min={0} max={Math.max(0, maxTreasury)} value={treasuryUsed} onChange={(e) => setTreasury(+e.target.value)} style={{ width: 110 }} disabled={maxTreasury <= 0} />
            <b>{treasuryUsed}</b>
            <span className="civ-lbl">· payé <b style={{ color: canBuy ? '#2e6b3a' : '#8a3b12' }}>{paid}</b> / {cost}</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className="civ-btn" disabled={!canBuy} onClick={buy}>{canBuy ? `Acheter (${basket.length})` : `Manque ${cost - paid}`}</button>
            <button className="civ-btn" onClick={() => { setSel([]); setSpend({}); setTreasury(0); }}>Vider panier</button>
          </div>
        </div>
      )}
      <button className="civ-btn" onClick={done}>Terminer les acquisitions (passer)</button>
    </div>
  );
}
