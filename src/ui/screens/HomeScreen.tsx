import { useRef, type ChangeEvent } from 'react';
import type { LocalSaveFile } from '../../local/types.js';
import { loadLocalSave, importSaveFromJson } from '../../local/persistence.js';
import { VideoBackground } from './VideoBackground.js';

interface HomeScreenProps {
  onNewGame: () => void;
  onResumeGame: (save: LocalSaveFile) => void;
  onImportSave: (save: LocalSaveFile) => void;
}

/**
 * Écran d'accueil principal en français de la version locale autonome.
 */
export function HomeScreen({ onNewGame, onResumeGame, onImportSave }: HomeScreenProps) {
  const existingSave = loadLocalSave();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const res = importSaveFromJson(text);
      if (res.ok) {
        onImportSave(res.save);
      } else {
        alert(`Erreur d'importation de la sauvegarde :\n${res.error}`);
      }
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
        justifyContent: 'center',
        color: '#f0e6d2',
        padding: 24,
        background: '#0a0806',
        textAlign: 'center',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Fond vidéo YouTube avec calque transparent de contraste */}
      <VideoBackground opacity={0.75} />

      {/* Contenu interactif (au-dessus du calque) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          maxWidth: 620,
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: '#ffd23f', fontWeight: 800, textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
            Portage Numérique
          </div>
          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(28px, 5.5vw, 44px)',
              fontWeight: 900,
              letterSpacing: 2,
              color: '#f8edd4',
              textShadow: '0 4px 20px rgba(0,0,0,0.95), 0 0 35px rgba(255,210,63,0.3)',
            }}
          >
            ADVANCED CIVILIZATION
          </h1>
          <div style={{ fontSize: 13, color: '#c2b29a', maxWidth: 520, lineHeight: 1.45, textShadow: '0 2px 6px rgba(0,0,0,0.9)' }}>
            D’après le chef-d’œuvre d’Avalon Hill (1991). Version autonome locale, multijoueur sur un seul poste et adversaires IA.
          </div>
        </div>

        {/* Bloc central des boutons avec effet glassmorphism */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            width: '100%',
            maxWidth: 380,
            marginTop: 6,
            background: 'rgba(22, 16, 11, 0.72)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(140, 96, 42, 0.4)',
            borderRadius: 12,
            padding: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          <button
            className="civ-btn"
            style={{
              fontSize: 15,
              padding: '12px 20px',
              fontWeight: 800,
              background: 'linear-gradient(180deg, #f5a623 0%, #d47e12 100%)',
              borderColor: '#ffd23f',
              color: '#1a0e03',
              boxShadow: '0 4px 14px rgba(245, 166, 35, 0.4)',
            }}
            onClick={onNewGame}
          >
            ⚔️ Nouvelle partie locale
          </button>

          <button
            className="civ-btn"
            disabled={!existingSave}
            style={{ fontSize: 14, padding: '10px 18px', opacity: existingSave ? 1 : 0.4 }}
            onClick={() => existingSave && onResumeGame(existingSave)}
            title={existingSave ? `Reprendre le tour ${existingSave.state.turn}` : 'Aucune sauvegarde existante'}
          >
            💾 Reprendre la partie {existingSave ? `(Tour ${existingSave.state.turn})` : ''}
          </button>

          <button
            className="civ-btn"
            style={{ fontSize: 14, padding: '10px 18px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            📂 Importer une sauvegarde (.json)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            className="civ-btn"
            disabled
            style={{ fontSize: 13, padding: '8px 14px', opacity: 0.45, cursor: 'not-allowed', color: '#bbb' }}
            title="Désactivé dans cette version locale autonome"
          >
            🌐 Multijoueur en ligne (indisponible)
          </button>
        </div>

        <div style={{ marginTop: 10, fontSize: 11, color: '#9a8a78', maxWidth: 480, lineHeight: 1.5, textShadow: '0 1px 4px rgba(0,0,0,0.9)' }}>
          <div>Sauvegardes 100 % locales — Aucune transmission de données à des serveurs tiers.</div>
          <div style={{ marginTop: 4 }}>
            Règles originales par Francis Tresham & Avalon Hill. Implémentation basée sur <i>digital-boardgame-framework</i>.
          </div>
        </div>
      </div>
    </div>
  );
}
