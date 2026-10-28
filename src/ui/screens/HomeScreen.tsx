import { useState, useRef, type ChangeEvent } from 'react';
import type { LocalSaveFile } from '../../local/types.js';
import { loadLocalSave, importSaveFromJson } from '../../local/persistence.js';
import { VideoBackground } from './VideoBackground.js';
import { SettingsModal } from '../components/hud/SettingsModal.js';
import { SettingsIcon } from '../theme/icons/index.js';
import { useTranslation, LanguageSelector } from '../i18n/index.js';

interface HomeScreenProps {
  onNewGame: () => void;
  onResumeGame: (save: LocalSaveFile) => void;
  onImportSave: (save: LocalSaveFile) => void;
}

/**
 * Portail d'accueil inspiré des musées archéologiques méditerranéens (MANN / Musée de l'Acropole).
 */
export function HomeScreen({ onNewGame, onResumeGame, onImportSave }: HomeScreenProps) {
  const existingSave = loadLocalSave();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const { t } = useTranslation();

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importSaveFromJson(text);
      if (res.ok) onImportSave(res.save);
      else alert(t.settingsModal.saveError(res.error));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        color: 'var(--civ-marble)',
        background: 'radial-gradient(ellipse at 50% 30%, #18202c 0%, #0a0d12 100%)',
        textAlign: 'center',
        userSelect: 'none',
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: '100%',
        boxSizing: 'border-box',
      }}
    >
      <VideoBackground opacity={0.55} />

      {/* Top Bar with Language Selector and Settings Button */}
      <header
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px 8px 20px',
          width: '100%',
          boxSizing: 'border-box',
          gap: 12,
          flexShrink: 0,
        }}
      >
        <LanguageSelector compact={false} />

        <button
          onClick={() => setShowSettings(true)}
          className="glass-btn"
          title={t.settingsModal.title}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            fontSize: 12,
            flexShrink: 0,
          }}
        >
          <SettingsIcon size={14} color="#ffd23f" />
          <span>{t.home.settings}</span>
        </button>
      </header>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onImportSave={onImportSave}
      />

      <main
        className="animate-fade-in"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          maxWidth: 680,
          width: '100%',
          margin: 'auto 0',
          padding: '12px 20px 24px 20px',
          boxSizing: 'border-box',
        }}
      >
        {/* Curatorial Header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              fontSize: 11,
              letterSpacing: 4,
              textTransform: 'uppercase',
              color: 'var(--civ-gold-light)',
              fontWeight: 700,
              fontFamily: 'var(--civ-font-display)',
            }}
          >
            {t.home.curatorialBadge}
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(26px, 5vw, 44px)',
              fontWeight: 800,
              letterSpacing: 3,
              fontFamily: 'var(--civ-font-display)',
              background: 'linear-gradient(180deg, #ffffff 20%, #d4af37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 20px rgba(0,0,0,0.8)',
            }}
          >
            {t.home.title}
          </h1>

          <div
            style={{
              fontFamily: 'var(--civ-font-serif)',
              fontSize: 17,
              fontStyle: 'italic',
              color: '#dcd4c4',
              maxWidth: 560,
              lineHeight: 1.4,
            }}
          >
            {t.home.subtitle}
          </div>

          <div style={{ fontSize: 12, color: 'var(--civ-stone-muted)', maxWidth: 480, lineHeight: 1.45, marginTop: 2 }}>
            {t.home.desc}
          </div>
        </div>

        {/* Gallery Action Vitrine */}
        <div
          className="glass-panel glass-panel--gold"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
            maxWidth: 380,
            padding: '18px 20px',
            background: 'rgba(14, 18, 25, 0.85)',
            boxSizing: 'border-box',
          }}
        >
          <button
            className="glass-btn glass-btn--primary"
            style={{ fontSize: 13, padding: '12px 20px', letterSpacing: 0.8 }}
            onClick={onNewGame}
          >
            {t.home.newGame}
          </button>

          {existingSave && (
            <button
              className="glass-btn"
              style={{ fontSize: 13, padding: '10px 18px', borderColor: 'var(--civ-gold-base)', color: '#ffffff' }}
              onClick={() => onResumeGame(existingSave)}
            >
              {t.home.resumeGame(existingSave.state.turn)}
            </button>
          )}

          <button
            className="glass-btn"
            style={{ fontSize: 12, padding: '9px 16px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            {t.settingsModal.importJson} (.json)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', maxWidth: 480, lineHeight: 1.45 }}>
          <div>{t.home.footerLocal}</div>
          <div style={{ marginTop: 2, opacity: 0.75 }}>
            {t.home.footerTribute}
          </div>
        </div>
      </main>
    </div>
  );
}
