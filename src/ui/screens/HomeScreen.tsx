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
 * Portail d'accueil inspiré des musées archéologiques méditerranéens (MANN / Musée de l'Acropole).
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
      if (res.ok) onImportSave(res.save);
      else alert(`Erreur lors du chargement des archives :\n${res.error}`);
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
        color: 'var(--civ-marble)',
        padding: 24,
        background: 'radial-gradient(ellipse at 50% 30%, #18202c 0%, #0a0d12 100%)',
        textAlign: 'center',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      <VideoBackground opacity={0.55} />

      <div
        className="animate-fade-in"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 20,
          maxWidth: 680,
          width: '100%',
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
            Jeu de stratégie Historique
          </div>

          <h1
            style={{
              margin: 0,
              fontSize: 'clamp(28px, 5.5vw, 46px)',
              fontWeight: 800,
              letterSpacing: 3,
              fontFamily: 'var(--civ-font-display)',
              background: 'linear-gradient(180deg, #ffffff 20%, #d4af37 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 20px rgba(0,0,0,0.8)',
            }}
          >
            ADVANCED CIVILIZATION
          </h1>

          <div
            style={{
              fontFamily: 'var(--civ-font-serif)',
              fontSize: 18,
              fontStyle: 'italic',
              color: '#dcd4c4',
              maxWidth: 560,
              lineHeight: 1.4,
            }}
          >
            L’Aube des Empires de la Méditerranée Antique
          </div>

          <div style={{ fontSize: 12, color: 'var(--civ-stone-muted)', maxWidth: 480, lineHeight: 1.5, marginTop: 4 }}>
            Un jeu de stratégie historique explorant l'essor démographique, les routes commerciales maritimes et les avancées culturelles, du Néolithique à l’Âge du Fer.
          </div>
        </div>

        {/* Gallery Action Vitrine */}
        <div
          className="glass-panel glass-panel--gold"
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            width: '100%',
            maxWidth: 400,
            padding: '22px 20px',
            background: 'rgba(14, 18, 25, 0.85)',
          }}
        >
          <button
            className="glass-btn glass-btn--primary"
            style={{ fontSize: 13, padding: '12px 22px', letterSpacing: 0.8 }}
            onClick={onNewGame}
          >
            🏛 Inaugurer une Expédition
          </button>

          {existingSave && (
            <button
              className="glass-btn"
              style={{ fontSize: 13, padding: '10px 18px', borderColor: 'var(--civ-gold-base)', color: '#ffffff' }}
              onClick={() => onResumeGame(existingSave)}
            >
              📜 Reprendre les Annales (Tour {existingSave.state.turn})
            </button>
          )}

          <button
            className="glass-btn"
            style={{ fontSize: 12, padding: '9px 16px' }}
            onClick={() => fileInputRef.current?.click()}
          >
            📁 Charger des Archives (.json)
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".json,application/json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />

          <button
            className="glass-btn"
            style={{ fontSize: 11, padding: '8px 14px', color: 'var(--civ-gold-light)', borderColor: 'var(--civ-gold-border-subtle)' }}
            onClick={async () => {
              try {
                const res = await fetch('/save.json');
                if (res.ok) {
                  const text = await res.text();
                  const parsed = importSaveFromJson(text);
                  if (parsed.ok) onImportSave(parsed.save);
                  else alert('Erreur lors du chargement de save.json.');
                }
              } catch {
                alert('Impossible de charger le fichier save.json.');
              }
            }}
          >
            ⚡ Charger la Sauvegarde Exemple (save.json)
          </button>
        </div>

        <div style={{ fontSize: 11, color: 'var(--civ-stone-muted)', maxWidth: 480, lineHeight: 1.5 }}>
          <div>Collections et sauvegardes 100 % locales — Aucune transmission de données externes.</div>
          <div style={{ marginTop: 2, opacity: 0.75 }}>
            Hommage à Francis Tresham · Cartographie historique méditerranéenne.
          </div>
        </div>
      </div>
    </div>
  );
}
