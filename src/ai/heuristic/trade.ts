import { calamityById, commodityById } from '../../data/index.js';
import { bundleFace, commoditySetValue } from '../../engine/helpers.js';
import type { Action, GameState, PlayerId, TradeBundle } from '../../engine/types.js';

const isCal = (c: string) => c.startsWith('calamity:');
const isTradableCal = (c: string) => isCal(c) && calamityById.get(c.slice(9))?.tradable === true;
const commValue = (c: string) => commodityById.get(c)?.value ?? 0;

function givable(hand: Record<string, number>): [string, number][] {
  return Object.entries(hand).filter(([c, n]) => n > 0 && (!isCal(c) || isTradableCal(c)));
}

function totalGivable(hand: Record<string, number>): number {
  return givable(hand).reduce((s, [, n]) => s + n, 0);
}

function topCommodity(hand: Record<string, number>): string | null {
  let best: string | null = null,
    bestGain = 0;
  for (const [c, n] of Object.entries(hand)) {
    if (isCal(c) || n <= 0) continue;
    const gain = commoditySetValue(c, n + 1) - commoditySetValue(c, n);
    if (gain > bestGain) {
      bestGain = gain;
      best = c;
    }
  }
  return best;
}

function cheapCommodities(hand: Record<string, number>, except: Set<string>): string[] {
  const out: string[] = [];
  for (const [c, n] of Object.entries(hand)) {
    if (!isCal(c) && !except.has(c)) {
      for (let i = 0; i < n; i++) out.push(c);
    }
  }
  return out.sort((a, b) => commValue(a) - commValue(b));
}

function buildBundle(cards: string[]): TradeBundle {
  const actual: Record<string, number> = {};
  const declared: Record<string, number> = {};
  const claimed: Record<string, number> = {};
  let named = 0;
  for (const c of cards) {
    actual[c] = (actual[c] ?? 0) + 1;
    if (!isCal(c) && named < 2) {
      declared[c] = (declared[c] ?? 0) + 1;
      named += 1;
      continue;
    }
    const name = isCal(c) ? 'ochre' : c;
    claimed[name] = (claimed[name] ?? 0) + 1;
  }
  return { actual, declared, count: cards.length, claimed };
}

const mentioned = (b: TradeBundle) =>
  Object.keys({ ...bundleFace(b).guaranteed, ...bundleFace(b).claimed });

function buildGive(
  me: { hand: Record<string, number> },
  collect: string,
  wantToInclude?: string,
  allowCollect = false,
): TradeBundle | null {
  const cards: string[] = [];
  const committed: Record<string, number> = {};
  const take = (c: string) => {
    committed[c] = (committed[c] ?? 0) + 1;
    cards.push(c);
  };
  const cal = givable(me.hand).map(([c]) => c).find(isTradableCal);
  if (cal) take(cal);
  if (
    wantToInclude &&
    !isCal(wantToInclude) &&
    (allowCollect || wantToInclude !== collect) &&
    (me.hand[wantToInclude] ?? 0) > (committed[wantToInclude] ?? 0)
  ) {
    take(wantToInclude);
  }
  for (const c of cheapCommodities(me.hand, new Set([collect]))) {
    if (cards.length >= 3) break;
    if ((me.hand[c] ?? 0) <= (committed[c] ?? 0)) continue;
    take(c);
  }
  if (cards.length < 3 || cards.filter((c) => !isCal(c)).length < 2) return null;
  return buildBundle(cards);
}

function wantsByGain(hand: Record<string, number>): string[] {
  const gain = (c: string) =>
    commoditySetValue(c, (hand[c] ?? 0) + 1) - commoditySetValue(c, hand[c] ?? 0);
  return Object.keys(hand)
    .filter((c) => !isCal(c) && (hand[c] ?? 0) > 0)
    .sort((a, b) => gain(b) - gain(a));
}

function buildFairGive(
  me: { hand: Record<string, number> },
  want: string,
  collect: string,
): TradeBundle | null {
  const target = commValue(want) + 2;
  const cards: string[] = [];
  const cal = givable(me.hand).map(([c]) => c).find(isTradableCal);
  if (cal) cards.push(cal);
  let worth = 0;
  for (const c of cheapCommodities(me.hand, new Set([want, collect]))) {
    if (cards.length >= 3 && worth >= target) break;
    if (commValue(c) > commValue(want)) break;
    cards.push(c);
    worth += commValue(c);
  }
  if (worth < target || cards.length < 3 || cards.filter((c) => !isCal(c)).length < 2) return null;
  return buildBundle(cards.sort((a, b) => commValue(b) - commValue(a)));
}

function guaranteedGain(hand: Record<string, number>, b: TradeBundle): number {
  let gain = 0;
  for (const [c, k] of Object.entries(bundleFace(b).guaranteed)) {
    if (isCal(c) || k <= 0) continue;
    const n = hand[c] ?? 0;
    gain += commoditySetValue(c, n + k) - commoditySetValue(c, n);
  }
  return gain;
}

const partingCost = (hand: Record<string, number>, c: string) =>
  commoditySetValue(c, hand[c] ?? 0) - commoditySetValue(c, (hand[c] ?? 0) - 1);

function wantedWorthGiving(
  hand: Record<string, number>,
  o: { wants: string[]; give: TradeBundle },
): string | undefined {
  const gain = guaranteedGain(hand, o.give);
  return o.wants
    .filter((w) => !isCal(w) && (hand[w] ?? 0) >= 1 && partingCost(hand, w) <= gain)
    .sort((a, b) => partingCost(hand, a) - partingCost(hand, b))[0];
}

export function planTradeTurn(
  state: GameState,
  actor: PlayerId,
  _rng: { pick<T>(a: readonly T[]): T },
): Action | null {
  const me = state.players[actor]!;
  const n = state.negotiation;
  const myWant = topCommodity(me.hand);

  const mine = n.offers.find((o) => o.from === actor);
  if (mine && mine.responses.length) {
    const good =
      mine.responses.find((r) =>
        mentioned(r.give).some(
          (c) => !isCal(c) && (mine.wants.includes(c) || (me.hand[c] ?? 0) >= 1),
        ),
      ) ?? mine.responses[0];
    if (good) return { type: 'acceptResponse', offerId: mine.id, responder: good.from };
  }

  if (!mine && totalGivable(me.hand) >= 3) {
    for (const want of wantsByGain(me.hand)) {
      const give = buildFairGive(me, want, myWant ?? want);
      if (give) return { type: 'postOffer', give, wants: [want] };
    }
    if (myWant && givable(me.hand).some(([c]) => isTradableCal(c))) {
      const give = buildGive(me, myWant);
      if (give) return { type: 'postOffer', give, wants: [myWant] };
    }
  }

  for (const o of n.offers) {
    if (o.from === actor || o.responses.some((r) => r.from === actor)) continue;
    const grows = mentioned(o.give).some((c) => !isCal(c) && (me.hand[c] ?? 0) >= 1);
    const haveCal = givable(me.hand).some(([c]) => isTradableCal(c));
    const worthIt = wantedWorthGiving(me.hand, o);
    if (!grows && !haveCal && !worthIt) continue;
    const give = worthIt
      ? buildGive(me, myWant ?? '', worthIt, true)
      : buildGive(me, myWant ?? '', o.wants.find((w) => w !== myWant && (me.hand[w] ?? 0) >= 1));
    if (give) return { type: 'respondOffer', offerId: o.id, give };
  }

  return { type: 'pass' };
}
