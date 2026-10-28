import { epochs, astTrackFor, civById } from '../../../data/index.js';
import type { GameState } from '../../../engine/types.js';
import { useTranslation, translateCiv, translateEpoch } from '../../i18n/index.js';

export const EPOCH_COLOR: Record<string, string> = {
  stone: '#384353',
  earlyBronze: '#225d7e',
  lateBronze: '#2b6a50',
  earlyIron: '#875314',
  lateIron: '#b85d18',
};

export function AstView({ state }: { state: GameState }) {
  const { t } = useTranslation();

  const epochRequirement = (r: { cities?: number; cards?: number; cardGroups?: number; perSpaceCardValue?: boolean }): string => {
    const parts: string[] = [];
    if (r.cities) parts.push(t.views.ast.reqCities(r.cities));
    if (r.cards) parts.push(t.views.ast.reqCards(r.cards));
    if (r.cardGroups) parts.push(t.views.ast.reqGroups(r.cardGroups));
    if (r.perSpaceCardValue) parts.push(t.views.ast.reqCardValue);
    return parts.length ? parts.join(' · ') : t.views.ast.reqNone;
  };

  return (
    <div style={{ color: 'var(--civ-marble)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', borderBottom: '1px solid var(--civ-gold-border)', paddingBottom: 10, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontFamily: 'var(--civ-font-display)', letterSpacing: 1.2, color: 'var(--civ-gold-light)', fontSize: 17, textTransform: 'uppercase' }}>
          {t.views.ast.title}
        </h2>
        <span style={{ fontSize: 12, color: 'var(--civ-stone-muted)', fontStyle: 'italic', fontFamily: 'var(--civ-font-serif)' }}>
          {t.views.ast.subtitle}
        </span>
      </div>

      <div style={{ fontSize: 11, color: 'var(--civ-gold-base)', fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 }}>
        {t.views.ast.requirementsTitle}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10, marginBottom: 18 }}>
        {epochs.map((e) => (
          <div
            key={e.id}
            style={{
              borderLeft: `4px solid ${EPOCH_COLOR[e.id]}`,
              background: 'rgba(20, 26, 36, 0.75)',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              borderRight: '1px solid rgba(255, 255, 255, 0.08)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 6,
              padding: '8px 12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 12, color: 'var(--civ-marble)', marginBottom: 3 }}>
              {translateEpoch(e.id, t) || e.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', lineHeight: 1.35 }}>
              {epochRequirement(e.requirements)}
            </div>
          </div>
        ))}
      </div>

      <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
        <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: 11 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '4px 8px', color: '#ffd23f', fontSize: 11, fontWeight: 700 }}>
                {t.views.ast.civColumn}
              </th>
              {Array.from({ length: 16 }, (_, i) => i + 1).map((s) => (
                <th
                  key={s}
                  style={{
                    width: 38,
                    padding: '3px 0',
                    textAlign: 'center',
                    color: '#a89a80',
                    fontSize: 10,
                    fontWeight: 700,
                  }}
                >
                  {s}
                </th>
              ))}
              <th style={{ padding: '4px 8px', color: '#ffd23f', fontSize: 12 }}>{t.views.ast.finish}</th>
            </tr>
          </thead>
          <tbody>
            {state.seating.map((id) => {
              const track = astTrackFor(id);
              const p = state.players[id]!;
              const liaStart = track.epochStart['lateIron'] ?? track.finishSpace;
              const civ = civById.get(id);
              const civName = translateCiv(id, t);

              return (
                <tr key={id}>
                  <td
                    style={{
                      padding: '4px 10px',
                      fontWeight: 800,
                      color: civ?.color,
                      background: 'rgba(20, 26, 36, 0.7)',
                      borderRadius: 4,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: civ?.color, marginRight: 6 }} />
                    {civName}
                  </td>
                  {Array.from({ length: track.finishSpace }, (_, i) => i + 1).map((space) => {
                    const epoch = [...epochs].reverse().find((e) => space >= (track.epochStart[e.id] ?? 1))!;
                    const here = p.astSpace === space;
                    const liaVal = track.lateIronThresholds?.[space - liaStart];
                    const color = EPOCH_COLOR[epoch.id];

                    return (
                      <td
                        key={space}
                        style={{
                          width: 38,
                          height: 34,
                          textAlign: 'center',
                          background: color,
                          borderRadius: 4,
                          border: here ? '2px solid var(--civ-gold-base)' : '1px solid rgba(255,255,255,0.12)',
                          boxShadow: here ? '0 0 12px rgba(212,175,55,0.6)' : 'inset 0 1px 2px rgba(255,255,255,0.15)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: 10,
                          position: 'relative',
                        }}
                      >
                        {liaVal ?? ''}
                        {here && (
                          <div
                            title={t.views.ast.currentPosition(space)}
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: '50%',
                                background: civ?.color,
                                border: '2px solid #ffffff',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.8)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ffffff',
                                fontWeight: 900,
                                fontSize: 11,
                                textShadow: '0 1px 2px #000',
                              }}
                            >
                              {civName[0]}
                            </div>
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ padding: '2px 8px', fontSize: 14, textAlign: 'center' }}>🏁</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ color: '#b8aa8e', fontSize: 11, fontStyle: 'italic', marginTop: 12 }}>
        {t.views.ast.lateIronNote}
      </p>
    </div>
  );
}
