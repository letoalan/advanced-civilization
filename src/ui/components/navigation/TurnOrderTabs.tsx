import { civById } from '../../../data/index.js';
import type { GameState, PlayerId } from '../../../engine/types.js';
import { useTranslation, translateCiv } from '../../i18n/index.js';

interface TurnOrderTabsProps {
  state: GameState;
  actor: PlayerId | null;
  seats: Record<PlayerId, 'human' | 'ai'>;
}

export function TurnOrderTabs({ state, actor, seats }: TurnOrderTabsProps) {
  const { t, language } = useTranslation();

  const orderLabel = {
    fr: 'Ordre :',
    en: 'Order:',
    de: 'Reihenfolge:',
    es: 'Orden:',
  }[language] ?? 'Ordre :';

  return (
    <aside
      className="animate-fade-in"
      style={{
        position: 'absolute',
        bottom: 12,
        left: 14,
        zIndex: 42,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        background: 'rgba(12, 16, 22, 0.82)',
        backdropFilter: 'var(--civ-blur-sm)',
        WebkitBackdropFilter: 'var(--civ-blur-sm)',
        border: '1px solid var(--civ-gold-border-subtle)',
        borderRadius: 'var(--civ-radius-md)',
        boxShadow: 'var(--civ-glass-shadow)',
        fontSize: 11,
        userSelect: 'none',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--civ-font-display)',
          fontSize: 9,
          textTransform: 'uppercase',
          color: 'var(--civ-gold-light)',
          fontWeight: 800,
          letterSpacing: 0.8,
          marginRight: 2,
        }}
      >
        {orderLabel}
      </span>
      {state.activeOrder.map((id, idx) => {
        const isAct = actor === id;
        const civ = civById.get(id);
        const name = translateCiv(id, t);
        return (
          <div
            key={id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              borderRadius: 4,
              background: isAct ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
              border: isAct ? '1px solid var(--civ-gold-base)' : '1px solid transparent',
              color: isAct ? '#ffffff' : 'var(--civ-parchment)',
              fontWeight: isAct ? 800 : 500,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: civ?.color ?? '#888',
                boxShadow: isAct ? `0 0 6px ${civ?.color ?? '#ffd23f'}` : undefined,
              }}
            />
            <span>{name}</span>
            {seats[id] === 'ai' && <span style={{ opacity: 0.5, fontSize: 9 }}>{t.common.ai}</span>}
            {idx < state.activeOrder.length - 1 && <span style={{ opacity: 0.3, marginLeft: 2 }}>➔</span>}
          </div>
        );
      })}
    </aside>
  );
}
