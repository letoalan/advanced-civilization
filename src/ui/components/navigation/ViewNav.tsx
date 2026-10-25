export type View = 'map' | 'ast' | 'census' | 'tools' | 'goods' | 'log';

interface ViewNavProps {
  currentView: View;
  onSelectView: (view: View) => void;
  onExit: () => void;
}

const VIEWS: { id: View; label: string }[] = [
  { id: 'map', label: 'CARTE' },
  { id: 'ast', label: 'AST' },
  { id: 'census', label: 'RECENSEMENT' },
  { id: 'tools', label: 'PROGRÈS' },
  { id: 'goods', label: 'MARCHANDISES' },
  { id: 'log', label: 'JOURNAL' },
];

export function ViewNav({ currentView, onSelectView, onExit }: ViewNavProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {VIEWS.map((v) => (
        <button
          key={v.id}
          className={`civ-nav ${currentView === v.id ? 'on' : ''}`}
          onClick={() => onSelectView(v.id)}
        >
          {v.label}
        </button>
      ))}
      <button className="civ-nav" onClick={onExit} style={{ marginTop: 6, color: '#ffd23f' }}>
        MENU
      </button>
    </div>
  );
}
