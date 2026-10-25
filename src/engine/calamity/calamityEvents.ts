import { Rng } from 'digital-boardgame-framework';
import { areaById, calamityById, CALAMITY_DESC } from '../../data/index.js';
import { cityCount, player, populationCount } from '../helpers.js';
import { log } from '../logging.js';
import { BARBARIAN, isPlayer, PIRATE } from '../primitives.js';
import { pname } from '../phases/conflictHelpers.js';
import type { CalamityStep, GameState, PlayerId } from '../types.js';

export type AreaSnapshot = Record<string, { city?: PlayerId; tokens: Record<string, number> }>;

export function snapAreas(s: GameState): AreaSnapshot {
  const o: AreaSnapshot = {};
  for (const [aid, a] of Object.entries(s.areas)) o[aid] = { city: a.city, tokens: { ...a.tokens } };
  return o;
}

export function boardOverview(s: GameState): string {
  return s.seating.map((id) => `${pname(s, id)}: ${cityCount(s, id)} cit, ${populationCount(s, id)} tok`).join(' · ');
}

export function calamitySteps(s: GameState, before: AreaSnapshot, holder: PlayerId): CalamityStep[] {
  const nm = (aid: string) => areaById.get(aid)?.name ?? aid;
  const steps: CalamityStep[] = [];
  for (const aid of new Set([...Object.keys(before), ...Object.keys(s.areas)])) {
    const b = before[aid] ?? { tokens: {} as Record<string, number> };
    const a = s.areas[aid] ?? { tokens: {} as Record<string, number> };
    if (b.city && isPlayer(s, b.city) && a.city !== b.city) {
      const owner = b.city;
      const text = a.city && a.city !== BARBARIAN && a.city !== PIRATE ? `City in ${nm(aid)} seized by ${pname(s, a.city)}`
        : a.city === PIRATE ? `City in ${nm(aid)} fell to pirates`
        : `Lost the city in ${nm(aid)}`;
      steps.push({ text, player: owner, secondary: owner !== holder });
    }
    for (const o of new Set([...Object.keys(b.tokens), ...Object.keys(a.tokens)])) {
      const d = (b.tokens[o] ?? 0) - (a.tokens[o] ?? 0);
      if (isPlayer(s, o)) {
        if (d > 0) steps.push({ text: `${pname(s, o)} loses ${d} token${d === 1 ? '' : 's'} in ${nm(aid)}`, player: o, secondary: o !== holder });
      } else if (o === BARBARIAN && -d > 0 && b.city !== holder) {
        steps.push({ text: `Barbarians (${-d}) appear in ${nm(aid)}` });
      }
    }
  }
  return steps.sort((x, y) => Number(x.secondary ?? false) - Number(y.secondary ?? false)).slice(0, 40);
}

export function pushCalamityEvent(s: GameState, calamityId: string, holder: PlayerId, before: AreaSnapshot, overviewBefore: string, interactive = false): void {
  (s.lastCalamities ??= []).push({
    calamity: calamityById.get(calamityId)?.name ?? calamityId,
    calamityId,
    description: CALAMITY_DESC[calamityId] ?? '',
    holder,
    steps: calamitySteps(s, before, holder),
    overviewBefore,
    overviewAfter: boardOverview(s),
    interactive,
  });
}

export function nextHeldCalamity(s: GameState): { calamityId: string; holder: PlayerId } | null {
  let best: { calamityId: string; holder: PlayerId; sev: number } | null = null;
  for (const id of s.seating) {
    for (const card of Object.keys(player(s, id).hand)) {
      if (!card.startsWith('calamity:') || (player(s, id).hand[card] ?? 0) <= 0) continue;
      const calamityId = card.slice('calamity:'.length);
      const sev = calamityById.get(calamityId)?.severity ?? 0;
      if (!best || sev < best.sev) best = { calamityId, holder: id, sev };
    }
  }
  return best ? { calamityId: best.calamityId, holder: best.holder } : null;
}

export function heldCalamities(s: GameState): { calamity: string; holder: PlayerId }[] {
  const out: { calamity: string; holder: PlayerId; sev: number; seat: number }[] = [];
  s.seating.forEach((id, seat) => {
    for (const [card, n] of Object.entries(player(s, id).hand)) {
      if (!card.startsWith('calamity:') || n <= 0) continue;
      const calamity = card.slice('calamity:'.length);
      for (let i = 0; i < n; i++) out.push({ calamity, holder: id, sev: calamityById.get(calamity)?.severity ?? 0, seat });
    }
  });
  return out.sort((a, b) => a.sev - b.sev || a.seat - b.seat).map(({ calamity, holder }) => ({ calamity, holder }));
}

export function capCalamitiesPerPlayer(s: GameState, rng: Rng): void {
  for (const id of s.seating) {
    const hand = player(s, id).hand;
    const held: string[] = [];
    for (const [card, n] of Object.entries(hand)) if (card.startsWith('calamity:')) for (let i = 0; i < n; i++) held.push(card);
    if (held.length <= 2) continue;
    const dropped = rng.shuffle(held).slice(2);
    for (const card of dropped) {
      hand[card] = (hand[card] ?? 0) - 1;
      if (hand[card]! <= 0) delete hand[card];
      const lvl = calamityById.get(card.slice('calamity:'.length))?.level;
      if (lvl && s.trade.stacks[lvl]) s.trade.stacks[lvl]!.unshift(card);
    }
    const names = dropped.map((c) => calamityById.get(c.slice('calamity:'.length))?.name ?? c);
    log(s, 'calamity.disregarded', id, `${id} holds ${held.length} calamities; only two may strike (§29.5) — ${names.join(' and ')} ${dropped.length === 1 ? 'is' : 'are'} drawn out at random and returned to the stack.`, { calamities: dropped.map((c) => c.slice('calamity:'.length)), held: held.length, rule: '29.5' });
  }
}
