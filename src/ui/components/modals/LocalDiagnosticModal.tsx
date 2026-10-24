import { useState } from 'react';
import type { GameState } from '../../../engine/types.js';
import type { LocalSessionConfig } from '../../../local/types.js';
import { generateLocalDiagnostic, downloadTextFile } from '../../../local/diagnostics.js';

interface LocalDiagnosticModalProps {
  state: GameState;
  config?: LocalSessionConfig;
  onClose: () => void;
}

/**
 * Modale de diagnostic technique local sans transmission réseau.
 */
export function LocalDiagnosticModal({ state, config, onClose }: LocalDiagnosticModalProps) {
  const [userNote, setUserNote] = useState('');
  const [anonymize, setAnonymize] = useState(true);
  const [includeState, setIncludeState] = useState(false);
  const [copied, setCopied] = useState(false);

  const reportText = generateLocalDiagnostic(state, config, {
    userNote,
    anonymizeNames: anonymize,
    includeFullState: includeState,
  });

  const handleDownload = () => {
    const filename = `advciv-diagnostic-tour${state.turn}-${Date.now()}.txt`;
    downloadTextFile(filename, reportText);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Impossible de copier dans le presse-papiers.');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(8, 6, 4, 0.8)',
        backdropFilter: 'blur(4px)',
        display: 'grid',
        placeItems: 'center',
        zIndex: 400,
        color: '#f0e6d2',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1f1812',
          border: '2px solid #ffd23f',
          borderRadius: 10,
          padding: 20,
          width: 520,
          maxWidth: '92vw',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          boxShadow: '0 8px 30px #000',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#ffd23f', fontSize: 16 }}>Diagnostic Technique Local</h3>
          <button className="civ-btn" onClick={onClose} style={{ padding: '2px 8px' }}>✕</button>
        </div>

        <p style={{ margin: 0, fontSize: 12, color: '#baa', lineHeight: 1.4 }}>
          Générez un rapport technique pour reproduire un bug ou analyser le déroulement de la partie.
          Aucune donnée n’est transmise sur Internet.
        </p>

        <textarea
          placeholder="Note ou description du problème rencontré (facultatif)..."
          value={userNote}
          onChange={(e) => setUserNote(e.target.value)}
          rows={3}
          style={{
            background: '#14100c',
            border: '1px solid #7a5020',
            borderRadius: 4,
            padding: 8,
            color: '#eee',
            fontSize: 12,
            resize: 'none',
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#ccc' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={anonymize} onChange={(e) => setAnonymize(e.target.checked)} />
            <span>Anonymiser les noms des joueurs humains</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" checked={includeState} onChange={(e) => setIncludeState(e.target.checked)} />
            <span>Inclure l'état sérialisé complet (attention : révèle les cartes secrètes)</span>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button className="civ-btn" onClick={handleCopy} style={{ padding: '8px 14px' }}>
            {copied ? '✓ Copié !' : 'Copier'}
          </button>
          <button className="civ-btn" onClick={handleDownload} style={{ padding: '8px 18px', fontWeight: 800, background: '#ffd23f', color: '#1a1005' }}>
            💾 Télécharger le fichier (.txt)
          </button>
        </div>
      </div>
    </div>
  );
}
