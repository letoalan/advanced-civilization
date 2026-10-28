import type { SupportedLanguage } from '../theme/settingsStore.js';

export type { SupportedLanguage };

export interface PhaseInfo {
  num: string;
  title: string;
  subtitle: string;
}

export interface Translations {
  common: {
    back: string;
    close: string;
    cancel: string;
    confirm: string;
    loading: string;
    waiting: string;
    pass: string;
    save: string;
    settings: string;
    turn: string;
    activeTurn: string;
    human: string;
    ai: string;
    yourTurn: string;
    aiTurn: string;
    points: string;
  };
  home: {
    curatorialBadge: string;
    title: string;
    subtitle: string;
    desc: string;
    newGame: string;
    resumeGame: (turn: number) => string;
    settings: string;
    footerLocal: string;
    footerTribute: string;
  };
  setup: {
    title: string;
    subtitle: string;
    back: string;
    numCivs: string;
    diplomaticPool: (n: number) => string;
    mapTheatre: string;
    mapTheatreDesc: string;
    tokensCount: (n: number) => string;
    seatsTitle: string;
    seatsDesc: string;
    seatNumber: (n: number) => string;
    human: string;
    ai: string;
    civLabel: string;
    playerLabel: string;
    playerPlaceholder: (n: number) => string;
    automatedAi: string;
    notAvailable: string;
    swapWithSeat: (n: number) => string;
    privacyTitle: string;
    privacyHandoff: string;
    privacyOpenTable: string;
    privacyHandoffDesc: string;
    privacyOpenTableDesc: string;
    aiPaceTitle: string;
    aiPaceReadable: string;
    aiPaceInstant: string;
    aiPaceReadableDesc: string;
    aiPaceInstantDesc: string;
    launchButton: string;
  };
  settingsModal: {
    title: string;
    language: string;
    visualEffects: string;
    effectsFull: string;
    effectsReduced: string;
    effectsOff: string;
    soundEffects: string;
    focusMode: string;
    focusModeDesc: string;
    vassalMaps: string;
    vassalActive: string;
    vassalInactive: string;
    vassalImport: string;
    vassalRemove: string;
    vassalReading: string;
    vassalError: (err: string) => string;
    jsonSave: string;
    jsonSaveDesc: string;
    exportJson: string;
    importJson: string;
    saveImported: string;
    saveError: (err: string) => string;
    noActiveSave: string;
    enabled: string;
    disabled: string;
    close: string;
    hudStyle: string;
    hudStyleDesc: string;
    etherealHud: string;
    classicDock: string;
  };
  topBar: {
    myCiv: string;
    zoomFit: string;
    settings: string;
    menu: string;
    tokensTip: string;
    citiesTip: string;
    shipsTip: string;
    treasuryTip: string;
    calamityAlert: (count: number) => string;
  };
  dock: {
    progress: string;
    trade: string;
    ast: string;
    chronicles: string;
    godMode: string;
    godModeHint: string;
    hudStyleEthereal: string;
    hudStyleClassic: string;
    minimize: string;
    expand: string;
    seeBoard: string;
  };
  phases: Record<string, PhaseInfo>;
  trade: {
    tradingPost: string;
    activeHand: (count: number, val: number) => string;
    wait: string;
    finishTrade: string;
    calamitiesInHand: (count: number) => string;
    calamityTradeNotice: string;
    yourOfferHeader: string;
    wantsHeader: string;
    offerContent: string;
    guaranteed: string;
    announced: string;
    secretCalamity: string;
    remove: string;
    soughtCommodities: string;
    selectedCount: (n: number, max: number) => string;
    publishOffer: string;
    otherOffers: string;
    respond: string;
    seeking: string;
    completedTrades: string;
    noTradesYet: string;
    round: (cur: number, max: number) => string;
    sendCounterOffer: (civ: string) => string;
    counterOfferNotice: (civ: string) => string;
    acceptDeal: string;
    tradableCalamity: string;
    nonTradableCalamity: string;
    tradableNotice: string;
    nonTradableNotice: string;
    secretCalamityCard: string;
    bluffCalamity: string;
  };
  movement: {
    fleetControls: string;
    confirmMoves: string;
    resetMoves: string;
    remainingMoves: (count: number) => string;
  };
  combat: {
    title: string;
    casualties: string;
    attacker: string;
    defender: string;
    continue: string;
  };
  calamity: {
    title: string;
    primaryVictim: string;
    secondaryVictims: string;
    tradable: string;
    nonTradable: string;
    continue: string;
  };
  advances: {
    title: string;
    categories: {
      Crafts: string;
      Arts: string;
      Civics: string;
      Sciences: string;
      Religion: string;
    };
    cost: string;
    credits: string;
    buy: string;
    owned: string;
    prerequisites: string;
  };
  handoff: {
    title: string;
    turnOf: (name: string) => string;
    desc: string;
    revealButton: string;
    switchToOpenTable: string;
  };
  codex: {
    title: string;
    close: string;
    closeTooltip: string;
    progress: string;
    trade: string;
    ast: string;
    chronicles: string;
    census: string;
  };
  views: {
    tools: {
      title: (civ: string) => string;
      acquiredCount: (owned: number, total: number) => string;
      astPoints: string;
      allCategories: (total: number) => string;
      ironAgeReq: string;
      domainsCount: (count: number) => string;
    };
    goods: {
      title: (civ: string) => string;
      marketValue: string;
      allCards: (n: number) => string;
      commodities: (n: number) => string;
      calamities: (n: number) => string;
      formula: string;
      miningBonus: string;
      empty: string;
    };
    ast: {
      title: string;
      subtitle: string;
      requirementsTitle: string;
      civColumn: string;
      finish: string;
      currentPosition: (space: number) => string;
      lateIronNote: string;
      reqNone: string;
      reqCities: (n: number) => string;
      reqCards: (n: number) => string;
      reqGroups: (n: number) => string;
      reqCardValue: string;
    };
    census: {
      title: string;
      subtitle: string;
      rank: string;
      nation: string;
      pop: string;
      cities: string;
      cards: string;
      advances: string;
      stock: string;
      treasury: string;
      cadastreTitle: string;
      none: string;
    };
    log: {
      title: string;
      desc: (filtered: number, total: number) => string;
      placeholder: string;
      noResult: string;
      noEvent: string;
    };
    advanceDetail: {
      acquired: string;
      baseCost: string;
      discounts: string;
      effectiveCost: string;
      ruleLore: string;
      noLore: string;
      prerequisites: string;
      noPrerequisites: string;
      domainDiscounts: string;
      targetedDiscounts: string;
    };
    gameOver: {
      title: string;
      standingsTitle: string;
      scoreExplanation: string;
    };
  };
  stepModal: {
    eventCounter: (cur: number, total: number) => string;
    skip: string;
    next: string;
    continue: string;
  };
  modals: {
    combat: {
      conflictHead: (cur: number, total: number) => string;
      forces: string;
      modifiers: string;
      losses: string;
      noLosses: string;
      cityDestroyed: string;
      tokenLoss: (civ: string, count: number) => string;
    };
    calamity: {
      header: (cur: number, total: number) => string;
      affects: string;
      youAlert: string;
      resolvedByYou: string;
      choicesDoneJustNow: string;
      before: string;
      after: string;
      effects: string;
      impactOn: (name: string) => string;
      noDirectEffect: string;
      secondaryVictims: string;
      secondaryRelayed: (name: string) => string;
      summary: string;
    };
  };
  data: {
    civilizations: Record<string, string>;
    commodities: Record<string, string>;
    advances: Record<string, { name: string; desc: string }>;
    calamities: Record<string, { name: string; desc: string }>;
    epochs: Record<string, string>;
  };
}
