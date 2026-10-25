import { useState } from 'react';
import type { PlayerId } from '../../engine/index.js';
import { civilizations, civById } from '../../data/index.js';
import { availableNations, unavailableReason } from '../../engine/boards.js';
import { createNetworkGame, tokenFromInvite } from '../../client/api.js';
import { BoardPicker, effectiveBoardPreset } from '../App.js';

const API = ''; // same-origin; Vite proxies /api -> the GameServer host

export function Lobby() {
  // Default two-player picks are §16.8-legal (the rules-default board for two).
  const [picked, setPicked] = useState<PlayerId[]>(['italy', 'africa']);
  const [presetId, setPresetId] = useState<string | null>(null); // null = rules default for the count
  const [created, setCreated] = useState<{ gameId: string; invites: Record<string, string> } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const toggle = (id: PlayerId) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const preset = effectiveBoardPreset(picked.length, presetId);
  // §16.6-16.8/§16.12: only these nations may be seated on the chosen board.
  const avail = new Set(availableNations(preset.config));
  const invalid = picked.filter((id) => !avail.has(id));
  const ok = picked.length >= 2 && picked.length <= 6 && invalid.length === 0;

  async function create() {
    setError(null);
    try {
      const seed = Math.floor(Math.random() * 0xffff);
      setCreated(await createNetworkGame(API, { players: picked, seed, maxTurns: 60, boardPreset: preset.id, chooseStartAreas: true, autoSkip: true }));
    } catch (e) { setError((e as Error).message); }
  }

  // Human = first picked nation; the rest become server-driven, rated AI seats.
  async function createVsAi() {
    setError(null);
    try {
      const seed = Math.floor(Math.random() * 0xffff);
      const ai = Object.fromEntries(picked.slice(1).map((n) => [n, 'standard']));
      const g = await createNetworkGame(API, { players: picked, seed, maxTurns: 60, ai, boardPreset: preset.id, chooseStartAreas: true, autoSkip: true });
      const myUrl = g.invites[picked[0]!] ?? '';
      location.search = `?game=${encodeURIComponent(g.gameId)}&token=${encodeURIComponent(tokenFromInvite(myUrl))}`;
    } catch (e) { setError((e as Error).message); }
  }

  return (
    <div style={{ padding: 24, color: '#eee', maxWidth: 760, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Advanced Civilization — Online</h1>
      {!created ? (
        <>
          <p className="civ-lbl" style={{ color: '#ccc' }}>Pick 2–6 nations, then create a game and share each seat's link.</p>
          <div style={{ marginBottom: 12 }}>
            <BoardPicker numPlayers={picked.length} presetId={presetId} onPick={setPresetId} />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {civilizations.map((c) => (
              <button key={c.id} className={`civ-btn ${picked.includes(c.id) ? 'on' : ''}`} onClick={() => toggle(c.id)}
                disabled={!avail.has(c.id) && !picked.includes(c.id)}
                title={unavailableReason(preset.config, c.id)}
                style={{ opacity: avail.has(c.id) ? 1 : 0.35, ...(picked.includes(c.id) && !avail.has(c.id) ? { outline: '2px solid #e05555' } : {}) }}>
                <span style={{ display: 'inline-block', width: 10, height: 10, background: c.color, marginRight: 5, borderRadius: 2 }} />{c.name}
              </button>
            ))}
          </div>
          <button className="civ-btn" disabled={!ok} onClick={create}>Create game ({picked.length} players)</button>
          <button className="civ-btn" style={{ marginLeft: 8 }} disabled={!ok} onClick={createVsAi}>vs AI (you = {civById.get(picked[0]!)?.name ?? picked[0]}, rest AI)</button>
          <p className="civ-lbl" style={{ color: '#999', fontSize: 12 }}>Sign in first so your result vs the AI counts. Fewer AI seats = snappier turns.</p>
          {invalid.length > 0 && <p style={{ color: '#f2a0a0' }}>{invalid.map((id) => civById.get(id)?.name ?? id).join(', ')} {invalid.length === 1 ? 'is' : 'are'} not available on this board (rules {preset.rule}) — unselect {invalid.length === 1 ? 'it' : 'them'}, or pick another board.</p>}
          {error && <p style={{ color: '#f88' }}>{error}</p>}
        </>
      ) : (
        <>
          <p>Game <code>{created.gameId}</code> created. Send each player their link; open one yourself to start.</p>
          <table style={{ width: '100%', fontSize: 13 }}><tbody>
            {Object.entries(created.invites).map(([seat, url]) => (
              <tr key={seat}>
                <td style={{ fontWeight: 800, color: civById.get(seat)?.color, padding: '4px 8px' }}>{civById.get(seat)?.name ?? seat}</td>
                <td><input readOnly value={url} style={{ width: '100%' }} onFocus={(e) => e.currentTarget.select()} /></td>
                <td><button className="civ-btn" onClick={() => navigator.clipboard?.writeText(url)}>Copy</button></td>
                <td><button className="civ-btn" onClick={() => { location.search = `?game=${encodeURIComponent(created.gameId)}&token=${encodeURIComponent(tokenFromInvite(url))}`; }}>Open as {civById.get(seat)?.name ?? seat}</button></td>
              </tr>
            ))}
          </tbody></table>
        </>
      )}
    </div>
  );
}
