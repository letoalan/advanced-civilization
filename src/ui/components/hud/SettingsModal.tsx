import { useRef, type ChangeEvent } from 'react';
import { useUiSettings, type EffectsLevel } from '../../theme/settingsStore.js';
import { CloseIcon, SettingsIcon } from '../../theme/icons/index.js';
import { loadLocalSave, saveLocalGame, downloadSaveFile, importSaveFromJson } from '../../../local/persistence.js';
import { useMapArt } from '../../mapArt.js';
import { useTranslation, LanguageSelector } from '../../i18n/index.js';
import type { LocalSaveFile } from '../../../local/types.js';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapArt?: ReturnType<typeof useMapArt>;
  onImportSave?: (save: LocalSaveFile) => void;
}

export function SettingsModal({ isOpen, onClose, mapArt, onImportSave }: SettingsModalProps) {
  const [settings, setSettings] = useUiSettings();
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vmodInputRef = useRef<HTMLInputElement>(null);
  const internalMapArt = useMapArt();
  const activeMapArt = mapArt ?? internalMapArt;

  if (!isOpen) return null;

  const handleJsonImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importSaveFromJson(text);
      if (res.ok) {
        saveLocalGame(res.save.config, res.save.state);
        if (onImportSave) {
          onImportSave(res.save);
          onClose();
        } else {
          location.reload();
        }
      } else {
        alert(t.settingsModal.saveError(res.error));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleVmodImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) activeMapArt.importVmod(file);
    e.target.value = '';
  };

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
          width: 440,
          maxWidth: '92vw',
          padding: 22,
          boxShadow: 'var(--civ-glass-shadow-lg)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, color: '#ffd23f', textTransform: 'uppercase', fontFamily: 'var(--civ-font-display)' }}>
            <SettingsIcon size={18} color="#ffd23f" />
            <span>{t.settingsModal.title}</span>
          </div>
          <button onClick={onClose} className="glass-btn" style={{ padding: 4 }}>
            <CloseIcon size={16} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Language selector */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#e8dec8', display: 'block', marginBottom: 6 }}>
              {t.settingsModal.language}
            </label>
            <LanguageSelector style={{ width: '100%', justifyContent: 'space-between' }} />
          </div>

          {/* Effects level */}
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#e8dec8', display: 'block', marginBottom: 6 }}>
              {t.settingsModal.visualEffects}
            </label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['full', 'reduced', 'off'] as EffectsLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSettings({ effects: lvl })}
                  className={`glass-btn ${settings.effects === lvl ? 'glass-btn--primary' : ''}`}
                  style={{ flex: 1, textTransform: 'capitalize', fontSize: 11 }}
                >
                  {lvl === 'full' ? t.settingsModal.effectsFull : lvl === 'reduced' ? t.settingsModal.effectsReduced : t.settingsModal.effectsOff}
                </button>
              ))}
            </div>
          </div>

          {/* Sound toggle */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#e8dec8' }}>
                {t.settingsModal.soundEffects}
              </label>
              <button
                onClick={() => setSettings({ sound: !settings.sound })}
                className={`glass-btn ${settings.sound ? 'glass-btn--primary' : ''}`}
                style={{ fontSize: 11, padding: '3px 10px' }}
              >
                {settings.sound ? t.settingsModal.enabled : t.settingsModal.disabled}
              </button>
            </div>
          </div>

          {/* Focus mode */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#e8dec8', display: 'block' }}>
                  {t.settingsModal.focusMode}
                </label>
                <span style={{ fontSize: 10, color: '#a89880' }}>
                  {t.settingsModal.focusModeDesc}
                </span>
              </div>
              <button
                onClick={() => setSettings({ focusMode: !settings.focusMode })}
                className={`glass-btn ${settings.focusMode ? 'glass-btn--primary' : ''}`}
                style={{ fontSize: 11, padding: '3px 10px' }}
              >
                {settings.focusMode ? t.settingsModal.enabled : t.settingsModal.disabled}
              </button>
            </div>
          </div>

          {/* Interface Style: Option 3 Ethereal HUD vs Classic Dock */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#ffd23f', display: 'block', marginBottom: 2 }}>
              {t.settingsModal.hudStyle}
            </label>
            <span style={{ fontSize: 10, color: '#a89880', display: 'block', marginBottom: 8 }}>
              {t.settingsModal.hudStyleDesc}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setSettings({ hudStyle: 'ethereal-hud' })}
                className={`glass-btn ${settings.hudStyle === 'ethereal-hud' ? 'glass-btn--primary' : ''}`}
                style={{ flex: 1, padding: '6px 8px', fontSize: 11 }}
              >
                {t.settingsModal.etherealHud}
              </button>
              <button
                onClick={() => setSettings({ hudStyle: 'classic-dock' })}
                className={`glass-btn ${settings.hudStyle === 'classic-dock' ? 'glass-btn--primary' : ''}`}
                style={{ flex: 1, padding: '6px 8px', fontSize: 11 }}
              >
                {t.settingsModal.classicDock}
              </button>
            </div>
          </div>

          {/* Cartes originales VASSAL */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--civ-gold-light)', display: 'block' }}>
                  {t.settingsModal.vassalMaps}
                </label>
                <span style={{ fontSize: 10, color: 'var(--civ-stone-muted)', display: 'block', marginTop: 2 }}>
                  {activeMapArt.status === 'ready'
                    ? t.settingsModal.vassalActive
                    : t.settingsModal.vassalInactive}
                </span>
                {activeMapArt.status === 'error' && (
                  <span style={{ fontSize: 10, color: '#fca5a5', display: 'block', marginTop: 4 }}>
                    {t.settingsModal.vassalError(activeMapArt.error ?? '')}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                {activeMapArt.status === 'ready' ? (
                  <button
                    onClick={() => activeMapArt.clearArt()}
                    className="glass-btn"
                    style={{ fontSize: 11, padding: '5px 10px', color: '#fca5a5' }}
                  >
                    {t.settingsModal.vassalRemove}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => vmodInputRef.current?.click()}
                      disabled={activeMapArt.status === 'importing'}
                      className="glass-btn glass-btn--primary"
                      style={{ fontSize: 11, padding: '5px 12px' }}
                    >
                      {activeMapArt.status === 'importing' ? t.settingsModal.vassalReading : t.settingsModal.vassalImport}
                    </button>
                    <input
                      ref={vmodInputRef}
                      type="file"
                      accept=".vmod,.zip,application/zip"
                      onChange={handleVmodImport}
                      style={{ display: 'none' }}
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sauvegardes JSON */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--civ-gold-light)', display: 'block' }}>
                  {t.settingsModal.jsonSave}
                </label>
                <span style={{ fontSize: 10, color: 'var(--civ-stone-muted)' }}>
                  {t.settingsModal.jsonSaveDesc}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="glass-btn"
                  style={{ fontSize: 11, padding: '5px 10px' }}
                >
                  {t.settingsModal.importJson}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleJsonImport}
                  style={{ display: 'none' }}
                />
                <button
                  onClick={() => {
                    const save = loadLocalSave();
                    if (save) downloadSaveFile(save);
                    else alert(t.settingsModal.noActiveSave);
                  }}
                  className="glass-btn glass-btn--primary"
                  style={{ fontSize: 11, padding: '5px 12px' }}
                >
                  {t.settingsModal.exportJson}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="glass-btn glass-btn--primary" style={{ padding: '7px 18px' }}>
            {t.settingsModal.close}
          </button>
        </div>
      </div>
    </div>
  );
}
