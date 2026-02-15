import { describe, expect, it } from 'vitest';
import { defaultRuleset } from '../src/defaultRuleset.js';
import { validateDeck } from '../src/validateDeck.js';
import type { CharacterContext, DeckContext } from '../src/types.js';

describe('validateDeck', () => {
  it('fails when deck bracket exceeds character cap', () => {
    const character: CharacterContext = {
      id: 'c1',
      level: 1,
      bracketCap: 1,
      colorIdentity: 'WB',
      archetypeCode: 'LIFEGAIN_ENGINE'
    };

    const deck: DeckContext = {
      id: 'd1',
      bracket: 3,
      cards: []
    };

    const res = validateDeck(deck, character, defaultRuleset);
    expect(res.isValid).toBe(false);
    expect(
      res.issues.some((issue) => issue.code === 'BRACKET_EXCEEDS_CHARACTER_CAP')
    ).toBe(true);
  });

  it('fails bracket 1 when Game Changers present', () => {
    const character: CharacterContext = {
      id: 'c1',
      level: 1,
      bracketCap: 1,
      colorIdentity: 'WB',
      archetypeCode: 'LIFEGAIN_ENGINE'
    };

    const deck: DeckContext = {
      id: 'd1',
      bracket: 1,
      cards: [{ cardName: 'Some Card', qty: 1, tags: ['game_changer'] }]
    };

    const res = validateDeck(deck, character, defaultRuleset);
    expect(res.isValid).toBe(false);
    expect(
      res.issues.some((issue) => issue.code === 'TOO_MANY_GAME_CHANGERS')
    ).toBe(true);
  });

  it('fails Lifegain Engine baseline when tags are under minimum', () => {
    const character: CharacterContext = {
      id: 'c1',
      level: 1,
      bracketCap: 1,
      colorIdentity: 'WB',
      archetypeCode: 'LIFEGAIN_ENGINE'
    };

    const deck: DeckContext = {
      id: 'd1',
      bracket: 1,
      cards: [
        { cardName: 'Trigger A', qty: 5, tags: ['lifegain_source'] },
        { cardName: 'Payoff A', qty: 2, tags: ['lifegain_payoff'] }
      ]
    };

    const res = validateDeck(deck, character, defaultRuleset);
    expect(res.isValid).toBe(false);
    expect(
      res.issues.some(
        (issue) => issue.code === 'ARCHETYPE_REQ_LIFEGAIN_SOURCES'
      )
    ).toBe(true);
    expect(
      res.issues.some((issue) => issue.code === 'ARCHETYPE_REQ_PAYOFFS')
    ).toBe(true);
  });

  it('passes a compliant deck', () => {
    const character: CharacterContext = {
      id: 'c1',
      level: 2,
      bracketCap: 2,
      colorIdentity: 'WB',
      archetypeCode: 'LIFEGAIN_ENGINE'
    };

    const deck: DeckContext = {
      id: 'd1',
      bracket: 2,
      cards: [
        { cardName: 'Lifegain', qty: 12, tags: ['lifegain_source'] },
        { cardName: 'Payoff', qty: 6, tags: ['lifegain_payoff'] }
      ]
    };

    const res = validateDeck(deck, character, defaultRuleset);
    expect(res.isValid).toBe(true);
    expect(res.issues.filter((issue) => issue.severity === 'error')).toHaveLength(
      0
    );
  });
});
