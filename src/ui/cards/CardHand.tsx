import { useState, useMemo } from 'react';
import { CommodityCard } from './CommodityCard.js';
import { CalamityCard } from './CalamityCard.js';
import { useCardDrag } from '../hooks/useCardDrag.js';
import { handValue } from '../../engine/helpers.js';

interface CardHandProps {
  hand: Record<string, number>;
  selectedCard?: string | null;
  onSelectCard?: (cardId: string) => void;
  onDropCard?: (cardId: string, zoneId: string) => void;
  defaultExpanded?: boolean;
}

export function CardHand({
  hand,
  selectedCard,
  onSelectCard,
  onDropCard,
  defaultExpanded = false,
}: CardHandProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const { drag, startDrag } = useCardDrag(onDropCard);

  const cardList = useMemo(() => {
    const list: { id: string; count: number; isCalamity: boolean }[] = [];
    for (const [id, count] of Object.entries(hand)) {
      if (count > 0) {
        list.push({ id, count, isCalamity: id.startsWith('calamity:') });
      }
    }
    return list;
  }, [hand]);

  const totalCards = cardList.reduce((acc, c) => acc + c.count, 0);
  const totalValue = handValue(hand);

  if (totalCards === 0) return null;

  const totalDistinct = cardList.length;
  const spreadAngle = Math.min(24 / Math.max(totalDistinct, 1), 6);
  const overlap = Math.max(34, 110 - totalDistinct * 6);

  return (
    <>
      {/* Toggle button */}
      <div
        style={{
          position: 'absolute',
          bottom: expanded ? 210 : 64,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 46,
          transition: 'bottom 0.25s ease',
        }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className="glass-btn glass-btn--primary"
          style={{
            padding: '4px 14px',
            fontSize: 11,
            borderRadius: '9999px',
            boxShadow: 'var(--civ-glass-shadow)',
          }}
          title={expanded ? 'Replier la main' : 'Déplier les cartes en main'}
        >
          <span>🎴 Mes Cartes ({totalCards})</span>
          <span style={{ fontSize: 10, opacity: 0.8 }}>· {totalValue} pts</span>
          <span style={{ fontSize: 10 }}>{expanded ? '▼' : '▲'}</span>
        </button>
      </div>

      {/* Fan of cards */}
      {expanded && (
        <div className="civ-hand-container animate-pop">
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              position: 'relative',
              height: 180,
              padding: '0 40px',
            }}
          >
            {cardList.map((card, idx) => {
              const rotation = (idx - (totalDistinct - 1) / 2) * spreadAngle;
              const offsetY = Math.abs(idx - (totalDistinct - 1) / 2) * 5;
              const isSelected = selectedCard === card.id;

              return (
                <div
                  key={card.id}
                  className="civ-hand-item"
                  onPointerDown={(e) => startDrag(card.id, e)}
                  onClick={() => onSelectCard?.(card.id)}
                  style={{
                    transform: `rotate(${rotation}deg) translateY(${offsetY}px)`,
                    marginLeft: idx > 0 ? -overlap : 0,
                    zIndex: idx + 10,
                  }}
                >
                  {card.isCalamity ? (
                    <CalamityCard id={card.id.slice(9)} isSelected={isSelected} width={90} height={135} />
                  ) : (
                    <CommodityCard id={card.id} count={card.count} isSelected={isSelected} width={90} height={135} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dragging ghost under pointer */}
      {drag && (
        <div
          style={{
            position: 'fixed',
            left: drag.x - 45,
            top: drag.y - 68,
            width: 90,
            height: 135,
            zIndex: 999,
            pointerEvents: 'none',
            opacity: 0.85,
            transform: 'scale(1.05) rotate(4deg)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.8), 0 0 16px rgba(255,210,63,0.6)',
          }}
        >
          {drag.cardId.startsWith('calamity:') ? (
            <CalamityCard id={drag.cardId.slice(9)} width={90} height={135} />
          ) : (
            <CommodityCard id={drag.cardId} width={90} height={135} />
          )}
        </div>
      )}
    </>
  );
}
