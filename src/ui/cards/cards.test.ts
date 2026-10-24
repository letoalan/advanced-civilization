import { describe, expect, it } from 'vitest';
import { COMMODITY_NAMES_FR } from './CommodityCard.js';
import { CALAMITY_NAMES_FR } from './CalamityCard.js';
import { ADVANCE_NAMES_FR } from './AdvanceCard.js';
import { commodities, calamities, advances } from '../../data/index.js';

describe('Vérification de la table des cartes et de leur nomenclature', () => {
  it('toutes les 18 marchandises ont une traduction française définie', () => {
    expect(commodities.length).toBe(18);
    for (const comm of commodities) {
      expect(COMMODITY_NAMES_FR[comm.id]).toBeDefined();
      expect(COMMODITY_NAMES_FR[comm.id]?.length).toBeGreaterThan(0);
    }
  });

  it('toutes les 12 calamités ont une traduction française définie', () => {
    expect(calamities.length).toBe(12);
    for (const cal of calamities) {
      expect(CALAMITY_NAMES_FR[cal.id]).toBeDefined();
      expect(CALAMITY_NAMES_FR[cal.id]?.length).toBeGreaterThan(0);
    }
  });

  it('toutes les 24 avances ont une traduction française définie', () => {
    expect(advances.length).toBe(24);
    for (const adv of advances) {
      expect(ADVANCE_NAMES_FR[adv.id]).toBeDefined();
      expect(ADVANCE_NAMES_FR[adv.id]?.length).toBeGreaterThan(0);
    }
  });
});
