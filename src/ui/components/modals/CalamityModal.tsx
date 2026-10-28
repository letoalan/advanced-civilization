import type { ReactNode } from 'react';
import { civById } from '../../../data/index.js';
import type { CalamityEvent, PlayerId } from '../../../engine/types.js';
import { useTranslation, translateCiv, translateCalamity } from '../../i18n/index.js';
import { StepModal, stepHead } from './StepModal.js';

const nationColor = (id: string) => (id === '__barbarian__' ? '#b08' : id === '__pirate__' ? '#000' : civById.get(id)?.color ?? '#ccc');

export function CalamityModal({ events, you }: { events: CalamityEvent[]; you?: PlayerId }) {
  const { t, language } = useTranslation();
  const pages: ReactNode[] = [];
  const replayed = events.filter((e) => !(e.holder === you && e.interactive));
  const shown = replayed.length ? events : [];

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

  shown.forEach((e, idx) => {
    const mine = e.holder === you;
    const nm = nationName(e.holder);
    const calName = translateCalamity(e.calamityId, t).name || e.calamity;
    const seq = t.modals.calamity.header(idx + 1, shown.length);
    const head = (kicker: string) =>
      stepHead(
        `${seq} · ${kicker}`,
        `⚠ ${calName}`,
        mine ? '#ff6b5a' : '#fff',
        <div style={{ marginBottom: 10 }}>
          {t.modals.calamity.affects} <b style={{ color: nationColor(e.holder) }}>{nm}</b>
          {mine ? t.modals.calamity.youAlert : ''}
        </div>,
      );

    if (mine && e.interactive) {
      pages.push(
        <div key={`${e.calamityId}-own`}>
          {head(t.modals.calamity.resolvedByYou)}
          <p style={{ fontSize: 13, color: '#cfc7b4', lineHeight: 1.5 }}>
            {t.modals.calamity.choicesDoneJustNow}
          </p>
          <div style={{ fontSize: 13, lineHeight: 1.6 }}>
            <b style={{ color: '#9a8d6a' }}>{t.modals.calamity.before}</b> {e.overviewBefore}
          </div>
          <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
            <b style={{ color: '#9a8d6a' }}>{t.modals.calamity.after}</b> {e.overviewAfter}
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
        {head(t.modals.calamity.effects)}
        <p style={{ fontSize: 13, color: '#cfc7b4', lineHeight: 1.5 }}>{e.description}</p>
      </div>,
    );
    pages.push(
      <div key={`${e.calamityId}-p`}>
        {head(t.modals.calamity.impactOn(nm))}
        {primary.length ? list(primary) : <div style={{ fontSize: 13, color: '#9a9' }}>{t.modals.calamity.noDirectEffect}</div>}
      </div>,
    );
    if (secondary.length) {
      pages.push(
        <div key={`${e.calamityId}-s`}>
          {head(t.modals.calamity.secondaryVictims)}
          <div style={{ fontSize: 12, color: '#caa', marginBottom: 6 }}>{t.modals.calamity.secondaryRelayed(nm)}</div>
          {list(secondary)}
        </div>,
      );
    }
    pages.push(
      <div key={`${e.calamityId}-o`}>
        {head(t.modals.calamity.summary)}
        <div style={{ fontSize: 13, lineHeight: 1.6 }}>
          <b style={{ color: '#9a8d6a' }}>{t.modals.calamity.before}</b> {e.overviewBefore}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.6, marginTop: 4 }}>
          <b style={{ color: '#9a8d6a' }}>{t.modals.calamity.after}</b> {e.overviewAfter}
        </div>
      </div>,
    );
  });

  return <StepModal token={`cal:${JSON.stringify(events)}`} pages={pages} accent="#c0392b" />;
}
