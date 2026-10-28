import type { ReactNode } from 'react';
import { areaById, civById } from '../../../data/index.js';
import type { CombatEvent, PlayerId } from '../../../engine/types.js';
import { useTranslation, translateCiv } from '../../i18n/index.js';
import { StepModal, stepHead } from './StepModal.js';

const nationColor = (id: string) => (id === '__barbarian__' ? '#b08' : id === '__pirate__' ? '#000' : civById.get(id)?.color ?? '#ccc');

export function CombatModal({ events }: { events: CombatEvent[]; you?: PlayerId }) {
  const { t, language } = useTranslation();

  const nationName = (id: string) => {
    if (id === '__barbarian__') {
      switch (language) {
        case 'en': return 'Barbarians';
        case 'de': return 'Barbaren';
        case 'es': return 'Bárbaros';
        default: return 'Barbares';
      }
    }
    if (id === '__pirate__') {
      switch (language) {
        case 'de': return 'Piraten';
        case 'es': return 'Piratas';
        default: return 'Pirates';
      }
    }
    return translateCiv(id, t);
  };

  const pages: ReactNode[] = events.map((e, n) => {
    const name = areaById.get(e.area)?.name ?? e.area;
    const afterById = new Map(e.after.map((f) => [f.id, f]));
    const forceRow = (f: CombatEvent['before'][number]) => (
      <li key={f.id} style={{ color: nationColor(f.id) }}>
        {nationName(f.id)} : {f.tokens} {f.tokens === 1 ? 'pion' : 'pions'}
        {f.city ? ` + ${language === 'en' ? 'city' : language === 'de' ? 'Stadt' : language === 'es' ? 'ciudad' : 'cité'}` : ''}
      </li>
    );
    const losses = e.before
      .map((f) => {
        const a = afterById.get(f.id);
        const lost = f.tokens - (a?.tokens ?? 0);
        const lostCity = f.city && !a?.city;
        return { id: f.id, lost, lostCity };
      })
      .filter((l) => l.lost > 0 || l.lostCity);

    return (
      <div key={e.area}>
        {stepHead(t.modals.combat.conflictHead(n + 1, events.length), `⚔ ${name}`, '#ffcf8a')}
        <div style={{ fontSize: 12, color: '#9a8d6a', marginTop: 4 }}>{t.modals.combat.forces}</div>
        <ul style={{ margin: '2px 0 8px', paddingLeft: 18, fontSize: 14 }}>{e.before.map(forceRow)}</ul>
        {e.modifiers.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: '#9a8d6a' }}>{t.modals.combat.modifiers}</div>
            <ul style={{ margin: '2px 0 8px', paddingLeft: 18, fontSize: 13, color: '#e6b85a' }}>
              {e.modifiers.map((m, k) => (
                <li key={k}>{m}</li>
              ))}
            </ul>
          </>
        )}
        <div style={{ fontSize: 12, color: '#9a8d6a' }}>{t.modals.combat.losses}</div>
        {losses.length ? (
          <ul style={{ margin: '2px 0 8px', paddingLeft: 18, fontSize: 14 }}>
            {losses.map((l) => (
              <li key={l.id} style={{ color: nationColor(l.id) }}>
                {t.modals.combat.tokenLoss(nationName(l.id), l.lost)}
                {l.lostCity ? t.modals.combat.cityDestroyed : ''}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 13, color: '#9a9', margin: '2px 0 8px' }}>{t.modals.combat.noLosses}</div>
        )}
        {e.note && <div style={{ fontSize: 12, color: '#cfc7b4', fontStyle: 'italic' }}>{e.note}</div>}
      </div>
    );
  });

  return <StepModal token={`cmb:${JSON.stringify(events)}`} pages={pages} accent="#8a4b2a" />;
}
