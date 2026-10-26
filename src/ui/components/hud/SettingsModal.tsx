import { useUiSettings, type EffectsLevel } from '../../theme/settingsStore.js';
import { CloseIcon, SettingsIcon } from '../../theme/icons/index.js';
import { loadLocalSave, downloadSaveFile } from '../../../local/persistence.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useUiSettings();

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 3, 2, 0.72)',
        backdropFilter: 'blur(8px)',
        zIndex: 200,
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-panel glass-panel--gold animate-pop"
        style={{
          width: 380,
          maxWidth: '92vw',
          padding: 22,
          boxShadow: 'var(--civ-glass-shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#ffd23f', textTransform: 'uppercase', fontFamily: 'var(--civ-font-display)' }}>
            <SettingsIcon size={18} color="#ffd23f" />
            <span>Réglages de l'interface</span>
          </div>
          <button onClick={onClose} className="glass-btn" style={{ padding: 4 }}>
            <CloseIcon size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Effects level */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#e8dec8', display: 'block', marginBottom: 6 }}>
              Effets visuels & animations
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['full', 'reduced', 'off'] as EffectsLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSettings({ effects: lvl })}
                  className={`glass-btn ${settings.effects === lvl ? 'glass-btn--primary' : ''}`}
                  style={{ flex: 1, textTransform: 'capitalize', fontSize: 11 }}
                >
                  {lvl === 'full' ? 'Complets' : lvl === 'reduced' ? 'Réduits' : 'Désactivés'}
                </button>
              ))}
            </div>
          </div>

          {/* Sound toggle */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#e8dec8' }}>
                Effets sonores
              </label>
              <button
                onClick={() => setSettings({ sound: !settings.sound })}
                className={`glass-btn ${settings.sound ? 'glass-btn--primary' : ''}`}
                style={{ fontSize: 11, padding: '3px 10px' }}
              >
                {settings.sound ? 'Activé' : 'Désactivé'}
              </button>
            </div>
          </div>

          {/* Focus mode */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#e8dec8', display: 'block' }}>
                  Mode Focus (Atténuation au repos)
                </label>
                <span style={{ fontSize: 10, color: '#a89880' }}>
                  Estompe l'interface quand vous contemplez la carte
                </span>
              </div>
              <button
                onClick={() => setSettings({ focusMode: !settings.focusMode })}
                className={`glass-btn ${settings.focusMode ? 'glass-btn--primary' : ''}`}
                style={{ fontSize: 11, padding: '3px 10px' }}
              >
                {settings.focusMode ? 'Activé' : 'Désactivé'}
              </button>
            </div>
          </div>

          {/* Export JSON Save */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--civ-gold-light)', display: 'block' }}>
                  Sauvegarde de la partie (.json)
                </label>
                <span style={{ fontSize: 10, color: 'var(--civ-stone-muted)' }}>
                  Télécharger les archives complètes de la partie
                </span>
              </div>
              <button
                onClick={() => {
                  const save = loadLocalSave();
                  if (save) downloadSaveFile(save);
                  else alert('Aucune partie active à exporter.');
                }}
                className="glass-btn glass-btn--primary"
                style={{ fontSize: 11, padding: '5px 12px' }}
              >
                💾 Exporter JSON
              </button>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="glass-btn glass-btn--primary" style={{ padding: '7px 18px' }}>
            Enregistrer et fermer
          </button>
        </div>
      </div>
    </div>
  );
}
