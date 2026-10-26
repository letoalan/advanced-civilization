import { advanceById, ADVANCE_EFFECTS } from '../../../data/index.js';
import { CloseIcon } from '../../theme/icons/index.js';
import { GROUP_COLOR } from './ToolsView.js';

interface AdvanceDetailModalProps {
  id: string | null;
  onClose: () => void;
  owned: boolean;
  creditDiscount?: number;
}

const GROUP_LABEL_FR: Record<string, string> = {
  Crafts: 'Métiers',
  Arts: 'Arts',
  Civics: 'Civisme',
  Sciences: 'Sciences',
  Religion: 'Religion',
};

export function AdvanceDetailModal({ id, onClose, owned, creditDiscount = 0 }: AdvanceDetailModalProps) {
  if (!id) return null;
  const a = advanceById.get(id);
  if (!a) return null;

  const primaryGroup = a.groups[0] ?? 'Crafts';
  const groupColor = GROUP_COLOR[primaryGroup] ?? 'var(--civ-gold-base)';
  const effectiveCost = Math.max(0, a.cost - creditDiscount);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'var(--civ-blur)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel animate-pop"
        style={{
          width: 'min(520px, 92vw)',
          maxHeight: 'min(85vh, 640px)',
          overflowY: 'auto',
          padding: 20,
          border: '1.5px solid var(--civ-gold-base)',
          borderRadius: 'var(--civ-radius-lg)',
          boxShadow: 'var(--civ-glass-shadow-lg), 0 0 30px rgba(212, 175, 55, 0.2)',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--civ-gold-border-subtle)', paddingBottom: 10 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: groupColor, boxShadow: `0 0 8px ${groupColor}` }} />
              <span style={{ fontSize: 11, color: groupColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                {a.groups.map((g) => GROUP_LABEL_FR[g] ?? g).join(' · ')}
              </span>
              {owned && (
                <span style={{ background: 'rgba(22, 101, 52, 0.35)', color: '#86efac', border: '1px solid #16a34a', padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>
                  ✓ Acquis
                </span>
              )}
            </div>
            <h2 style={{ margin: 0, fontFamily: 'var(--civ-font-display)', color: 'var(--civ-gold-light)', fontSize: 20 }}>
              {a.name}
            </h2>
          </div>
          <button onClick={onClose} className="glass-btn" style={{ padding: '4px 8px' }}>
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Card Artwork & Cost Plinth */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 110, height: 165, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--civ-gold-border)', flexShrink: 0, boxShadow: 'var(--civ-glass-shadow)' }}>
            <img src={`/medias/images/advances/${id}.png`} alt={a.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(20, 26, 36, 0.7)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: 12, color: 'var(--civ-stone-muted)' }}>Coût de base :</span>
              <b style={{ color: 'var(--civ-marble)', fontSize: 13 }}>{a.cost} pts</b>
            </div>
            {creditDiscount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(22, 101, 52, 0.25)', borderRadius: 6, border: '1px solid #16a34a' }}>
                <span style={{ fontSize: 12, color: '#86efac' }}>Réductions acquises :</span>
                <b style={{ color: '#86efac', fontSize: 13 }}>−{creditDiscount} pts</b>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(212, 175, 55, 0.12)', borderRadius: 6, border: '1px solid var(--civ-gold-border)' }}>
              <span style={{ fontSize: 12, color: 'var(--civ-gold-light)', fontWeight: 700 }}>Coût effectif :</span>
              <b style={{ color: 'var(--civ-gold-light)', fontSize: 15 }}>{effectiveCost} pts</b>
            </div>
          </div>
        </div>

        {/* Rule / Lore Effect */}
        <div style={{ background: 'rgba(12, 16, 22, 0.85)', padding: 12, borderRadius: 8, border: '1px solid var(--civ-gold-border-subtle)', fontSize: 12, lineHeight: 1.6, color: 'var(--civ-parchment)' }}>
          <b style={{ color: 'var(--civ-gold-light)', display: 'block', marginBottom: 4, textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.5 }}>
            Effet & Texte de Loi :
          </b>
          {ADVANCE_EFFECTS[id] ?? 'Aucun effet spécial documenté.'}
        </div>

        {/* Prerequisites & Granted Credits */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
          {a.prerequisites?.length ? (
            <div style={{ color: 'var(--civ-stone-muted)' }}>
              Prérequis : <b style={{ color: 'var(--civ-gold-light)' }}>{a.prerequisites.map((p) => advanceById.get(p)?.name ?? p).join(', ')}</b>
            </div>
          ) : (
            <div style={{ color: 'var(--civ-stone-muted)' }}>Prérequis : <i>Aucun (progrès initial)</i></div>
          )}

          {Object.keys(a.credits.byGroup).length > 0 && (
            <div style={{ color: 'var(--civ-stone-muted)' }}>
              Réductions de domaine : {Object.entries(a.credits.byGroup).map(([g, v]) => `+${v} à tous les ${GROUP_LABEL_FR[g] ?? g}`).join(', ')}
            </div>
          )}
          {Object.keys(a.credits.byCard).length > 0 && (
            <div style={{ color: 'var(--civ-stone-muted)' }}>
              Réductions ciblées : {Object.entries(a.credits.byCard).map(([c, v]) => `+${v} à ${advanceById.get(c)?.name ?? c}`).join(', ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
