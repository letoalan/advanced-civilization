import type { ReactNode } from 'react';
import { areaById, civById } from '../../../data/index.js';
import type { CombatEvent, PlayerId } from '../../../engine/types.js';
import { StepModal, stepHead } from './StepModal.js';

const nationName = (id: string) => (id === '__barbarian__' ? 'Barbares' : id === '__pirate__' ? 'Pirates' : civById.get(id)?.name ?? id);
const nationColor = (id: string) => (id === '__barbarian__' ? '#b08' : id === '__pirate__' ? '#000' : civById.get(id)?.color ?? '#ccc');

export function CombatModal({ events }: { events: CombatEvent[]; you?: PlayerId }) {
  const pages: ReactNode[] = events.map((e, n) => {
    const name = areaById.get(e.area)?.name ?? e.area;
    const afterById = new Map(e.after.map((f) => [f.id, f]));
    const forceRow = (f: CombatEvent['before'][number]) => (
      <li key={f.id} style={{ color: nationColor(f.id) }}>
        {nationName(f.id)} : {f.tokens} pion{f.tokens === 1 ? '' : 's'}
        {f.city ? ' + cité' : ''}
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
        {stepHead(`Conflit · territoire ${n + 1} sur ${events.length}`, `⚔ ${name}`, '#ffcf8a')}
        <div style={{ fontSize: 12, color: '#9a8d6a', marginTop: 4 }}>Forces en présence :</div>
        <ul style={{ margin: '2px 0 8px', paddingLeft: 18, fontSize: 14 }}>{e.before.map(forceRow)}</ul>
        {e.modifiers.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: '#9a8d6a' }}>Modificateurs :</div>
            <ul style={{ margin: '2px 0 8px', paddingLeft: 18, fontSize: 13, color: '#e6b85a' }}>
              {e.modifiers.map((m, k) => (
                <li key={k}>{m}</li>
              ))}
            </ul>
          </>
        )}
        <div style={{ fontSize: 12, color: '#9a8d6a' }}>Pertes :</div>
        {losses.length ? (
          <ul style={{ margin: '2px 0 8px', paddingLeft: 18, fontSize: 14 }}>
            {losses.map((l) => (
              <li key={l.id} style={{ color: nationColor(l.id) }}>
                {nationName(l.id)} : −{l.lost} pion{l.lost === 1 ? '' : 's'}
                {l.lostCity ? ', cité détruite' : ''}
              </li>
            ))}
          </ul>
        ) : (
          <div style={{ fontSize: 13, color: '#9a9', margin: '2px 0 8px' }}>Aucune perte (coexistence pacifique).</div>
        )}
        {e.note && <div style={{ fontSize: 12, color: '#cfc7b4', fontStyle: 'italic' }}>{e.note}</div>}
      </div>
    );
  });

  return <StepModal token={`cmb:${JSON.stringify(events)}`} pages={pages} accent="#8a4b2a" />;
}
