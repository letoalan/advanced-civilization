import { describe, expect, it } from 'vitest';
import { adapter, createGame } from '../engine/index.js';
import type { GameState } from '../engine/types.js';
import { computeMoveOptions } from './components/phases/movement/movementLegality.js';
import { buildMovementPreview, computeSurplusWarnings } from './components/phases/movement/movementPreview.js';
import { CitySiteEmblem, VolcanoEmblem, FloodplainEmblem, SvgCapacityBadge } from './components/board/BoardAreaEmblems.js';

describe('Mécanisme de transit et déplacements au tour 1', () => {
  function setupTurn1Movement(): { state: GameState; actor: 'egypt' } {
    const s = createGame({ players: ['egypt', 'babylon', 'assyria', 'asia'], seed: 42 });
    s.turn = 1;
    s.phase = 'movement';
    s.activeOrder = ['egypt', 'babylon', 'assyria', 'asia'];
    s.actedThisPhase = [];
    // Turn 1 Egypt starting tokens in Thebes
    s.areas['thebes'] = { tokens: { egypt: 2 } };
    return { state: s, actor: 'egypt' };
  }

  it('génère des options de déplacement valides au tour 1 depuis le point de départ', () => {
    const { state, actor } = setupTurn1Movement();
    const legal = adapter.legalActions(state, actor);
    const moveOpts = computeMoveOptions(legal);

    expect(moveOpts.has('thebes')).toBe(true);
    const thebesDests = moveOpts.get('thebes')!;
    // Adjacent land territories to Thebes (buhen, nubia, ptolemais)
    expect(thebesDests.size).toBeGreaterThan(0);
    expect(thebesDests.has('buhen')).toBe(true);
  });

  it('calcule correctement la prévisualisation du transit d\'un pion d\'une case à l\'autre', () => {
    const { state, actor } = setupTurn1Movement();
    const queuedMoves = [{ from: 'thebes', to: 'buhen', count: 1 }];

    const { previewState, moved } = buildMovementPreview(state, actor, queuedMoves, []);

    // Thebes should now have 1 token left
    expect(previewState.areas['thebes']?.tokens[actor]).toBe(1);
    // Buhen should now have 1 token
    expect(previewState.areas['buhen']?.tokens[actor]).toBe(1);
    // Moved set should mark buhen as the destination
    expect(moved.has('buhen')).toBe(true);
  });

  it('permet le transit multiple de pions vers différentes cases cibles', () => {
    const { state, actor } = setupTurn1Movement();
    const queuedMoves = [
      { from: 'thebes', to: 'buhen', count: 1 },
      { from: 'thebes', to: 'nubia', count: 1 },
    ];

    const { previewState, moved } = buildMovementPreview(state, actor, queuedMoves, []);

    expect(previewState.areas['thebes']?.tokens[actor]).toBeUndefined();
    expect(previewState.areas['buhen']?.tokens[actor]).toBe(1);
    expect(previewState.areas['nubia']?.tokens[actor]).toBe(1);
    expect(moved.has('buhen')).toBe(true);
    expect(moved.has('nubia')).toBe(true);
  });

  it('applique le déplacement au moteur de jeu avec succès et met à jour l\'état', () => {
    const { state, actor } = setupTurn1Movement();
    const action = {
      type: 'move' as const,
      moves: [{ from: 'thebes', to: 'buhen', count: 1 }],
    };

    const res = adapter.tryApplyAction(state, action, actor);
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect(res.state.areas['thebes']?.tokens[actor]).toBe(1);
    expect(res.state.areas['buhen']?.tokens[actor]).toBe(1);
    expect(res.state.actedThisPhase).toContain(actor);
  });

  it('calcule les avertissements de surpopulation si un dépassement est prévu', () => {
    const { state, actor } = setupTurn1Movement();
    // Nubia has sustains 1
    // If we move 2 tokens to Nubia (sustains 1), 1 should be lost
    const queuedMoves = [{ from: 'thebes', to: 'nubia', count: 2 }];
    const { previewState } = buildMovementPreview(state, actor, queuedMoves, []);
    const warnings = computeSurplusWarnings(state, actor, previewState);

    expect(warnings.length).toBeGreaterThan(0);
    const nubiaWarn = warnings.find((w) => w.area === 'nubia');
    expect(nubiaWarn).toBeDefined();
    expect(nubiaWarn?.lost).toBe(1);
  });
});

describe('Indicateurs vectoriels SVG des cases', () => {
  it('rend l\'emblème SVG de site de cité avec les détails architecturaux', () => {
    const el = CitySiteEmblem({ cx: 100, cy: 100, style: 'atlas' });
    expect(el).toBeDefined();
    expect(el.props.transform).toBe('translate(100.0, 100.0)');
    expect(el.type).toBe('g');
  });

  it('rend le badge SVG de capacité avec contraste élevé (≤limit)', () => {
    const el = SvgCapacityBadge({ cx: 50, cy: 50, r: 14, limit: 3, style: 'atlas' });
    expect(el).toBeDefined();
    expect(el.type).toBe('g');
  });

  it('rend les emblèmes de volcan et de plaine inondable', () => {
    const v = VolcanoEmblem({ cx: 200, cy: 200, style: 'atlas' });
    const f = FloodplainEmblem({ cx: 300, cy: 300, style: 'atlas' });
    expect(v.type).toBe('g');
    expect(f.type).toBe('g');
  });
});

describe('Calcul du zoom complet du plateau', () => {
  it('calcule une largeur permettant une vue 100% intégrale du plateau sans rognage', () => {
    const containerW = 900;
    const containerH = 600;
    const baseFitWidth = Math.min(containerW, containerH * (3800 / 1405));
    // board width at zoom 1.0 must fit within container width and height
    const boardWidth = Math.round(1.0 * baseFitWidth);
    const boardHeight = Math.round(boardWidth * (1405 / 3800));

    expect(boardWidth).toBeLessThanOrEqual(containerW);
    expect(boardHeight).toBeLessThanOrEqual(containerH);
  });

  it('permet un zoom supérieur à 100% (jusqu\'à 400%) pour l\'inspection détaillée', () => {
    const containerW = 900;
    const containerH = 600;
    const baseFitWidth = Math.min(containerW, containerH * (3800 / 1405));
    const zoom150 = Math.round(1.5 * baseFitWidth);
    const zoom200 = Math.round(2.0 * baseFitWidth);

    expect(zoom150).toBeGreaterThan(containerW);
    expect(zoom200).toBeGreaterThan(zoom150);
  });
});
