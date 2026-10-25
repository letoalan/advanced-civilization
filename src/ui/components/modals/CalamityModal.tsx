import type { ReactNode } from 'react';
import { civById } from '../../../data/index.js';
import type { CalamityEvent, PlayerId } from '../../../engine/types.js';
import { StepModal, stepHead } from './StepModal.js';

const nationName = (id: string) => (id === '__barbarian__' ? 'Barbares' : id === '__pirate__' ? 'Pirates' : civById.get(id)?.name ?? id);
const nationColor = (id: string) => (id === '__barbarian__' ? '#b08' : id === '__pirate__' ? '#000' : civById.get(id)?.color ?? '#ccc');

export function CalamityModal({ events, you }: { events: CalamityEvent[]; you?: PlayerId }) {
  const pages: ReactNode[] = [];
  const replayed = events.filter((e) => !(e.holder === you && e.interactive));
  const shown = replayed.length ? events : [];

  shown.forEach((e, idx) => {
    const mine = e.holder === you;
    const nm = nationName(e.holder);
    const seq = `Calamité ${idx + 1} sur ${shown.length} (§29.6)`;
    const head = (kicker: string) =>
      stepHead(
        `${seq} · ${kicker}`,
        `⚠ ${e.calamity}`,
        mine ? '#ff6b5a' : '#fff',
        <div style={{ marginBottom: 10 }}>
          touche <b style={{ color: nationColor(e.holder) }}>{nm}</b>
          {mine ? ' — vous !' : ''}
        </div>,
      );

    if (mine && e.interactive) {
      pages.push(
        <div key={`${e.calamityId}-own`}>
          {head('résolue par vous')}
          <p style={{ fontSize: 13, color: '#cfc7b4', lineHeight: 1.5 }}>
            Vous avez effectué ces choix à l'instant.
          </p>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <b style={{ color: '#9a8d6a' }}>Avant :</b> {e.overviewBefore}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
            <b style={{ color: '#9a8d6a' }}>Après :</b> {e.overviewAfter}
          </div>
        </div>,
      );
      return;
    }

    const primary = e.steps.filter((st) => !st.secondary);
    const secondary = e.steps.filter((st) => st.secondary);
    const list = (steps: typeof e.steps) => (
      <ul style={{ margin: '0 0 4px', paddingLeft: 18, fontSize: 14, lineHeight: 1.6 }}>
        {steps.map((st, k) => (
          <li key={k} style={{ color: st.player ? nationColor(st.player) : '#ece4d2' }}>
            {st.text}
          </li>
        ))}
      </ul>
    );

    pages.push(
      <div key={`${e.calamityId}-i`}>
        {head('effets')}
        <p style={{ fontSize: 13, color: '#cfc7b4', lineHeight: 1.5 }}>{e.description}</p>
      </div>,
    );
    pages.push(
      <div key={`${e.calamityId}-p`}>
        {head(`impact sur ${nm}`)}
        {primary.length ? list(primary) : <div style={{ fontSize: 13, color: '#9a9' }}>Aucun effet direct.</div>}
      </div>,
    );
    if (secondary.length) {
      pages.push(
        <div key={`${e.calamityId}-s`}>
          {head('victimes secondaires')}
          <div style={{ fontSize: 12, color: '#caa', marginBottom: 6 }}>{nm} répercute ces pertes :</div>
          {list(secondary)}
        </div>,
      );
    }
    pages.push(
      <div key={`${e.calamityId}-o`}>
        {head('bilan')}
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          <b style={{ color: '#9a8d6a' }}>Avant :</b> {e.overviewBefore}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
          <b style={{ color: '#9a8d6a' }}>Après :</b> {e.overviewAfter}
        </div>
      </div>,
    );
  });

  return <StepModal token={`cal:${JSON.stringify(events)}`} pages={pages} accent="#c0392b" />;
}
