import { useState } from 'react';
import { areaById, civById } from '../../../data/index.js';
import type { Action, GameState } from '../../../engine/types.js';
import { useAreaPeek } from '../board/AreaPeekContext.js';

interface PickControlsProps {
  state: GameState;
  legal: Action[];
  onApply: (a: Action) => void;
}

export function PickControls({ state, legal, onApply }: PickControlsProps) {
  const pk = state.pendingPick!;
  const peek = useAreaPeek();
  const suggested = (legal.find((a) => a.type === 'pickAreas') as Extract<Action, { type: 'pickAreas' }> | undefined)?.areas ?? [];
  const need = suggested.length;
  const [sel, setSel] = useState<string[]>([]);
  const ownerOf = (aid: string) => state.areas[aid]?.city as string | undefined;

  const toggle = (aid: string) =>
    setSel((s) => {
      if (s.includes(aid)) return s.filter((x) => x !== aid);
      if (s.length >= need) return s;
      if (pk.stage === 'piracySecondary' && s.some((x) => ownerOf(x) === ownerOf(aid))) return s;
      return [...s, aid];
    });

  const ok = sel.length === need;
  const vName = civById.get(pk.victim)?.name ?? pk.victim;
  const prompt =
    pk.stage === 'treachery'
      ? `Choisissez ${pk.chooser === pk.victim ? 'quelle cité vous perdez' : `quelle cité de ${vName} vous saisissez`}`
      : pk.stage === 'floodCity'
      ? 'Choisissez quelle cité côtière l’inondation emporte'
      : pk.stage === 'volcanoSite'
      ? 'Deux volcans causeraient des dégâts égaux — choisissez lequel entre en éruption (§30.211)'
      : pk.stage === 'earthquakeSite'
      ? 'Choisissez quelle cité le séisme détruit (§30.212)'
      : pk.stage === 'barbarian'
      ? `Les Barbares ont un choix à égalité — désignez où ils ${pk.march?.here == null ? 'débarquent' : 'marchent'} (§30.5251)`
      : pk.stage === 'taxRevolt'
      ? `Les cités de ${vName} se révoltent — choisissez laquelle reprendre (§19.32)`
      : pk.stage === 'piracyPrimary'
      ? `Choisissez quelle cité côtière de ${pk.chooser === pk.victim ? 'votre empire' : vName} les pirates pillent`
      : 'Choisissez des cités côtières adverses pour les pirates (une par joueur)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span className="civ-lbl">⚓ {prompt} — sélectionnez <b>{need}</b> :</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {pk.candidates.map((aid) => (
          <button
            key={aid}
            className={`civ-btn ${sel.includes(aid) ? 'on' : ''}`}
            style={{ fontSize: 11, borderLeft: `5px solid ${civById.get(ownerOf(aid) ?? '')?.color ?? '#888'}` }}
            {...peek(aid)}
            onClick={() => toggle(aid)}
          >
            {sel.includes(aid) ? '✓ ' : ''}
            {areaById.get(aid)?.name ?? aid}
            {ownerOf(aid) && ownerOf(aid) !== pk.victim ? ` (${civById.get(ownerOf(aid)!)?.name})` : ''}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <span className="civ-lbl" style={{ color: ok ? '#7caa6a' : '#caa05a' }}>
          {sel.length} / {need} choisies
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {suggested.length > 0 && (
            <button className="civ-btn" style={{ fontSize: 11 }} onClick={() => setSel([...suggested])}>
              Suggérer
            </button>
          )}
          <button className="civ-btn" disabled={!ok} onClick={() => onApply({ type: 'pickAreas', areas: sel })}>
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
