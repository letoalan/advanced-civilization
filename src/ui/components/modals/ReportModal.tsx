import { useState } from 'react';
import type { MyReport } from '../../../client/api.js';
import { resolutionNote } from '../../../client/api.js';

interface ReportModalProps {
  mine: MyReport[];
  onSend: (message: string, severity: string) => Promise<string>;
  onDownload?: () => void;
  onClose: () => void;
}

export function ReportModal({ mine, onSend, onDownload, onClose }: ReportModalProps) {
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<'bug' | 'rules-question' | 'feedback'>('bug');
  const [status, setStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    setStatus('Envoi en cours…');
    try {
      const id = await onSend(message, severity);
      setStatus(`Rapport ${id.slice(0, 8)} transmis.`);
      setMessage('');
    } catch (e) {
      setStatus(`Erreur : ${(e as Error).message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(8,6,3,0.8)', display: 'grid', placeItems: 'center', zIndex: 150 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#211c14', color: '#eee', padding: 22, borderRadius: 12, border: '2px solid #c79a3a', width: 500, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto' }}>
        <h3 style={{ margin: '0 0 8px', color: '#ffd23f' }}>Signaler un problème</h3>
        <select value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)} style={{ fontSize: 13, marginBottom: 8 }}>
          <option value="bug">Anomalie (Bug)</option>
          <option value="rules-question">Question de règles</option>
          <option value="feedback">Retour / Suggestion</option>
        </select>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Description..." rows={4} style={{ fontSize: 13, width: '100%', boxSizing: 'border-box', marginBottom: 8 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="civ-btn" disabled={!message.trim() || sending} onClick={submit}>Envoyer</button>
          {onDownload && <button className="civ-btn" onClick={onDownload}>Télécharger diagnostic</button>}
          <button className="civ-btn" onClick={onClose}>Fermer</button>
        </div>
        {status && <div className="civ-lbl" style={{ color: '#e6b85a', marginTop: 8 }}>{status}</div>}
      </div>
    </div>
  );
}
