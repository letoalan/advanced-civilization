import type { View } from '../navigation/ViewNav.js';
import { TradeIcon, TechIcon, AstIcon, ChronicleIcon } from '../../theme/icons/index.js';

interface DockCodexButtonsProps {
  activeCodex: View | null;
  onOpenCodex: (view: View) => void;
}

const CODEX_ITEMS: { id: View; label: string; icon: (active: boolean) => React.ReactNode }[] = [
  { id: 'tools', label: 'Progrès', icon: (act) => <TechIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
  { id: 'goods', label: 'Commerce', icon: (act) => <TradeIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
  { id: 'ast', label: 'AST', icon: (act) => <AstIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
  { id: 'log', label: 'Chroniques', icon: (act) => <ChronicleIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
];

export function DockCodexButtons({ activeCodex, onOpenCodex }: DockCodexButtonsProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {CODEX_ITEMS.map((item) => {
        const isActive = activeCodex === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onOpenCodex(item.id)}
            className={`glass-btn ${isActive ? 'glass-btn--primary' : ''}`}
            title={`Consulter ${item.label}`}
            style={{ padding: '4px 8px', fontSize: 11 }}
          >
            {item.icon(isActive)}
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
