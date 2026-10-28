import type { View } from '../navigation/ViewNav.js';
import { TradeIcon, TechIcon, AstIcon, ChronicleIcon } from '../../theme/icons/index.js';
import { useTranslation } from '../../i18n/index.js';

interface DockCodexButtonsProps {
  activeCodex: View | null;
  onOpenCodex: (view: View) => void;
}

export function DockCodexButtons({ activeCodex, onOpenCodex }: DockCodexButtonsProps) {
  const { t } = useTranslation();

  const codexItems: { id: View; label: string; icon: (active: boolean) => React.ReactNode }[] = [
    { id: 'tools', label: t.dock.progress, icon: (act) => <TechIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
    { id: 'goods', label: t.dock.trade, icon: (act) => <TradeIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
    { id: 'ast', label: t.dock.ast, icon: (act) => <AstIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
    { id: 'log', label: t.dock.chronicles, icon: (act) => <ChronicleIcon size={14} color={act ? '#ffd23f' : 'currentColor'} /> },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {codexItems.map((item) => {
        const isActive = activeCodex === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onOpenCodex(item.id)}
            className={`glass-btn ${isActive ? 'glass-btn--primary' : ''}`}
            title={item.label}
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
