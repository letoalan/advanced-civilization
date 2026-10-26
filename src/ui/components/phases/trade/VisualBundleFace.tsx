import { commodityById } from '../../../../data/index.js';
import { bundleFace } from '../../../../engine/helpers.js';
import type { TradeBundle } from '../../../../engine/types.js';
import { CommodityCard, CalamityCard } from '../../../cards/index.js';

interface VisualBundleFaceProps {
  b: TradeBundle;
  actual?: Record<string, number>;
}

const isCal = (c: string) => c.startsWith('calamity:');

export function bundleSummaryText(b: TradeBundle): string {
  const f = bundleFace(b);
  const parts: string[] = [];
  for (const [c, k] of Object.entries(f.guaranteed)) {
    parts.push(`${k}× ${commodityById.get(c)?.name ?? c} (garanti)`);
  }
  for (const [c, k] of Object.entries(f.claimed)) {
    parts.push(`${k}× ${commodityById.get(c)?.name ?? c} (annoncé)`);
  }
  if (f.unspecified > 0) {
    parts.push(`${f.unspecified}× secrète${f.unspecified > 1 ? 's' : ''}`);
  }
  return parts.join(' + ') || '—';
}

export function VisualBundleFace({ b, actual }: VisualBundleFaceProps) {
  if (actual) {
    return (
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        {Object.entries(actual).map(([c, k]) => (
          <div key={c} style={{ position: 'relative' }}>
            {isCal(c) ? (
              <CalamityCard id={c.slice(9)} width={58} height={86} />
            ) : (
              <CommodityCard id={c} count={k} width={58} height={86} />
            )}
          </div>
        ))}
      </div>
    );
  }

  const f = bundleFace(b);
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Guaranteed Cards */}
      {Object.entries(f.guaranteed).map(([c, k]) => (
        <div key={`g-${c}`} style={{ position: 'relative' }} title={`Garanti : ${k}× ${commodityById.get(c)?.name ?? c}`}>
          <CommodityCard id={c} count={k} width={58} height={86} />
          <span style={{ position: 'absolute', top: 3, left: 3, fontSize: 8, background: 'rgba(20, 83, 45, 0.95)', color: '#86efac', borderRadius: 3, padding: '1px 4px', fontWeight: 800, zIndex: 4, letterSpacing: 0.3 }}>
            Garanti
          </span>
        </div>
      ))}

      {/* Claimed bluff cards */}
      {Object.entries(f.claimed).map(([c, k]) => (
        <div key={`c-${c}`} style={{ position: 'relative' }} title={`Annoncé : ${k}× ${commodityById.get(c)?.name ?? c}`}>
          <CommodityCard id={c} count={k} width={58} height={86} />
          <span style={{ position: 'absolute', top: 3, left: 3, fontSize: 8, background: 'rgba(180, 83, 9, 0.95)', color: '#fef08a', borderRadius: 3, padding: '1px 4px', fontWeight: 800, zIndex: 4, letterSpacing: 0.3 }}>
            Annoncé
          </span>
        </div>
      ))}

      {/* Unspecified mystery cards (Card Backs) */}
      {Array.from({ length: f.unspecified }).map((_, idx) => (
        <div key={`u-${idx}`} style={{ position: 'relative', width: 58, height: 86, borderRadius: 6, overflow: 'hidden', border: '1px solid var(--civ-gold-border-subtle)', flexShrink: 0, display: 'flex', flexDirection: 'column' }} title="Carte cachée / secrète">
          <img src="/medias/images/backs/back_commodities.png" alt="Carte cachée" style={{ width: '100%', height: 'calc(100% - 18px)', objectFit: 'cover' }} />
          <div style={{ background: 'rgba(10, 13, 18, 0.95)', color: 'var(--civ-stone-muted)', fontSize: 9, textAlign: 'center', fontWeight: 700, padding: '1px 0' }}>
            Mystère
          </div>
          <span style={{ position: 'absolute', top: 3, left: 3, fontSize: 8, background: 'rgba(20, 26, 36, 0.9)', color: '#dcd4c4', borderRadius: 3, padding: '1px 4px', fontWeight: 800 }}>
            Secret
          </span>
        </div>
      ))}
    </div>
  );
}
