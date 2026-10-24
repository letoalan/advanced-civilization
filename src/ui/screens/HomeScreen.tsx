import { useRef, type ChangeEvent } from 'react';
import type { LocalSaveFile } from '../../local/types.js';
import { loadLocalSave, importSaveFromJson } from '../../local/persistence.js';

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
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        color: '#f0e6d2',
        padding: 24,
        background: 'radial-gradient(ellipse at center, #1e1710 0%, #0d0a07 100%)',
        textAlign: 'center',
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', color: '#ffd23f', fontWeight: 800 }}>
          Portage Numérique
        </div>
        <h1
          style={{
            margin: 0,
            fontSize: 'clamp(28px, 5vw, 42px)',
            fontWeight: 900,
            letterSpacing: 1.5,
            color: '#f8edd4',
            textShadow: '0 2px 10px rgba(0,0,0,0.8)',
          }}
        >
          ADVANCED CIVILIZATION
        </h1>
        <div style={{ fontSize: 13, color: '#aa9980', maxWidth: 520, lineHeight: 1.4 }}>
          D’après le chef-d’œuvre d’Avalon Hill (1991). Version autonome locale, multijoueur sur un seul poste et adversaires IA.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 360, marginTop: 12 }}>
        <button
          className="civ-btn"
          style={{ fontSize: 15, padding: '12px 20px', fontWeight: 800, background: '#e69830', borderColor: '#874f17' }}
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

      <div style={{ marginTop: 24, fontSize: 11, color: '#887766', maxWidth: 480, lineHeight: 1.5 }}>
        <div>Sauvegardes 100 % locales — Aucune transmission de données à des serveurs tiers.</div>
        <div style={{ marginTop: 4 }}>
          Règles originales par Francis Tresham & Avalon Hill. Implémentation basée sur <i>digital-boardgame-framework</i>.
        </div>
      </div>
    </div>
  );
}
