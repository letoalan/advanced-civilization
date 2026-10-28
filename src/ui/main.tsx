import './theme/theme.css';
import { Component, StrictMode, useEffect, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { UpdateBanner } from 'digital-boardgame-framework/client';
import App from './App.js';
import { Lobby, OnlineGame } from './online.js';
import DevApp from './dev/DevApp.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { LocalSetupScreen } from './screens/LocalSetupScreen.js';
import type { LocalSessionConfig, LocalSaveFile } from '../local/types.js';
import { fetchUnseenResponses, markResponseSeen, resolutionNote, submitStandaloneReport, type MyReport } from '../client/api.js';
import { REPORT_CATEGORY } from '../report-meta.js';
import { features } from '../config/features.js';

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null; sent: boolean }> {
  state = { error: null as Error | null, sent: false };
  static getDerivedStateFromError(error: Error) { return { error, sent: false }; }
  componentDidCatch(error: Error) {
    if (!features.remoteReports) return;
    let alreadySent = false;
    try {
      const key = `advciv-crash:${error.message}`;
      alreadySent = sessionStorage.getItem(key) === '1';
      sessionStorage.setItem(key, '1');
    } catch { /* ignore */ }
    if (alreadySent) { this.setState({ sent: true }); return; }
    submitStandaloneReport('', { message: `App crashed: ${error.message}\n${(error.stack ?? '').slice(0, 1500)}`, severity: 'bug', category: REPORT_CATEGORY, clientBuild: 'web-ui', userAgent: navigator.userAgent })
      .then(() => this.setState({ sent: true })).catch(() => {});
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#eee', padding: 24, textAlign: 'center' }}>
        <h2 style={{ margin: 0, color: '#ffd23f' }}>Une erreur est survenue</h2>
        <p style={{ maxWidth: 520, color: '#ccc' }}>L'application a rencontré un problème. Vous pouvez recharger la page pour reprendre votre partie sauvegardée.</p>
        <code style={{ fontSize: 12, color: '#f88', maxWidth: 600, overflow: 'auto' }}>{this.state.error.message}</code>
        <button className="civ-btn" style={{ fontSize: 16, padding: '10px 18px' }} onClick={() => location.reload()}>Recharger</button>
      </div>
    );
  }
}

function ReportResponseModal({ r, onDismiss }: { r: MyReport; onDismiss: () => void }) {
  return (
    <div onClick={onDismiss} style={{ position: 'fixed', inset: 0, background: 'rgba(8,6,3,0.78)', display: 'grid', placeItems: 'center', zIndex: 200 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#211c14', color: '#eee', padding: 22, borderRadius: 12, border: '2px solid #ffd23f', width: 460, maxWidth: '92vw', maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 8px 40px #000' }}>
        <div style={{ fontSize: 12, color: '#ffd23f', fontWeight: 800, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>Réponse à votre rapport</div>
        <div style={{ fontSize: 14, color: '#ece4d2', lineHeight: 1.55, whiteSpace: 'pre-wrap', marginBottom: 16 }}>{resolutionNote(r.resolution)}</div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="civ-btn" onClick={onDismiss} style={{ padding: '8px 18px', fontWeight: 700 }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function Root() {
  const params = new URLSearchParams(location.search);
  const game = params.get('game');
  const token = params.get('token');

  if (params.has('dev')) return <DevApp />;

  const [replies, setReplies] = useState<MyReport[]>([]);
  useEffect(() => {
    if (features.remoteReports) {
      fetchUnseenResponses('').then(setReplies).catch(() => {});
    }
  }, []);
  const reply = replies[0];
  const modal = reply ? <ReportResponseModal r={reply} onDismiss={() => { markResponseSeen(reply.reportId); setReplies((rs) => rs.slice(1)); }} /> : null;

  const [mode, setMode] = useState<'home' | 'setup' | 'game' | 'online'>('home');
  const [activeConfig, setActiveConfig] = useState<LocalSessionConfig | undefined>();
  const [activeSave, setActiveSave] = useState<LocalSaveFile | undefined>();

  let body: React.ReactNode;

  if (game && token) {
    if (features.onlineMultiplayer) {
      body = <OnlineGame gameId={game} token={token} />;
    } else {
      body = (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, color: '#eee', padding: 24, textAlign: 'center' }}>
          <h2 style={{ color: '#ffd23f', margin: 0 }}>Multijoueur en ligne indisponible</h2>
          <p style={{ maxWidth: 520, color: '#ccc' }}>Le jeu multijoueur en ligne n'est pas activé dans cette version locale autonome.</p>
          <button className="civ-btn" style={{ fontSize: 16, padding: '10px 18px' }} onClick={() => { location.href = location.pathname; }}>Retour à l'accueil</button>
        </div>
      );
    }
  } else if (mode === 'home') {
    body = (
      <HomeScreen
        onNewGame={() => setMode('setup')}
        onResumeGame={(save) => { setActiveSave(save); setActiveConfig(undefined); setMode('game'); }}
        onImportSave={(save) => { setActiveSave(save); setActiveConfig(undefined); setMode('game'); }}
      />
    );
  } else if (mode === 'setup') {
    body = (
      <LocalSetupScreen
        onLaunch={(cfg) => { setActiveConfig(cfg); setActiveSave(undefined); setMode('game'); }}
        onBack={() => setMode('home')}
      />
    );
  } else if (mode === 'game') {
    body = <App sessionConfig={activeConfig} initialSave={activeSave} onExitToMenu={() => setMode('home')} />;
  } else if (mode === 'online' && features.onlineMultiplayer) {
    body = <Lobby />;
  }

  return <>{modal}{body}</>;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UpdateBanner currentBuild={__DBF_BUILD_ID__} />
    <ErrorBoundary><Root /></ErrorBoundary>
  </StrictMode>,
);
