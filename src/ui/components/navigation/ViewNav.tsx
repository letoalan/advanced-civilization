export type View = 'map' | 'ast' | 'census' | 'tools' | 'goods' | 'log';

interface ViewNavProps {
  currentView: View;
  onSelectView: (view: View) => void;
  onExit: () => void;
}

const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'map', label: 'Carte', icon: '🗺' },
  { id: 'ast', label: 'AST', icon: '⏳' },
  { id: 'census', label: 'Recens.', icon: '👥' },
  { id: 'tools', label: 'Progrès', icon: '📜' },
  { id: 'goods', label: 'Commerce', icon: '🏺' },
  { id: 'log', label: 'Journal', icon: '📖' },
];

export function ViewNav({ currentView, onSelectView, onExit }: ViewNavProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, width: '100%' }}>
      {VIEWS.map((v) => (
        <button
          key={v.id}
          className={`civ-nav ${currentView === v.id ? 'on' : ''}`}
          style={{ padding: '5px 4px', fontSize: 11, textAlign: 'center', whiteSpace: 'nowrap' }}
          onClick={() => onSelectView(v.id)}
          title={v.label}
        >
          <span style={{ marginRight: 3 }}>{v.icon}</span>{v.label}
        </button>
      ))}
      <button
        className="civ-nav"
        onClick={onExit}
        style={{ padding: '5px 4px', fontSize: 11, textAlign: 'center', color: '#ffd23f', gridColumn: 'span 3', marginTop: 1 }}
        title="Retour au menu principal"
      >
        ⚙ Menu principal
      </button>
    </div>
  );
}

