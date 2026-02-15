import {
  CharacterContext,
  DeckContext,
  RulesetContext,
  ValidationIssue,
  ValidationResult
} from './types.js';

export function validateDeck(
  deck: DeckContext,
  character: CharacterContext,
  ruleset: RulesetContext
): ValidationResult {
  const issues: ValidationIssue[] = [];
  const suggestedFixes: ValidationResult['suggestedFixes'] = [];

  if (deck.bracket > character.bracketCap) {
    issues.push({
      code: 'BRACKET_EXCEEDS_CHARACTER_CAP',
      severity: 'error',
      message: `Deck bracket ${deck.bracket} exceeds your character's bracket cap (${character.bracketCap}) at level ${character.level}.`,
      details: {
        deckBracket: deck.bracket,
        characterBracketCap: character.bracketCap
      }
    });
  }

  const bRules = ruleset.bracketRules[deck.bracket];
  const gameChangerCount = countTagged(deck, 'game_changer');
  const infiniteComboCount = countTagged(deck, 'infinite_combo_piece');
  const tutorCount = countTagged(deck, 'tutor');
  const extraTurnCount = countTagged(deck, 'extra_turn');
  const mldCount = countTagged(deck, 'mass_land_denial');

  if (bRules.maxGameChangers !== null && gameChangerCount > bRules.maxGameChangers) {
    issues.push({
      code: 'TOO_MANY_GAME_CHANGERS',
      severity: 'error',
      message: `Bracket ${deck.bracket} allows up to ${bRules.maxGameChangers} Game Changers; your deck contains ${gameChangerCount}.`,
      details: { gameChangerCount, max: bRules.maxGameChangers }
    });
  }

  if (!bRules.allowTwoCardInfinite && infiniteComboCount > 0) {
    issues.push({
      code: 'INFINITE_COMBO_NOT_ALLOWED',
      severity: 'error',
      message: `Bracket ${deck.bracket} disallows two-card infinite combos. Remove combo pieces flagged at this level.`,
      details: { infiniteComboCount }
    });
  }

  if (!bRules.allowTutors && tutorCount > 0) {
    issues.push({
      code: 'TUTORS_NOT_ALLOWED',
      severity: 'error',
      message: `Bracket ${deck.bracket} disallows tutors at this level.`,
      details: { tutorCount }
    });
  }

  if (!bRules.allowExtraTurns && extraTurnCount > 0) {
    issues.push({
      code: 'EXTRA_TURNS_NOT_ALLOWED',
      severity: 'error',
      message: `Bracket ${deck.bracket} disallows extra turns at this level.`,
      details: { extraTurnCount }
    });
  }

  if (!bRules.allowMassLandDenial && mldCount > 0) {
    issues.push({
      code: 'MLD_NOT_ALLOWED',
      severity: 'error',
      message: `Bracket ${deck.bracket} disallows mass land denial at this level.`,
      details: { mldCount }
    });
  }

  if (character.archetypeCode === 'LIFEGAIN_ENGINE') {
    const lifegainSources = countTagged(deck, 'lifegain_source');
    const payoffs = countTagged(deck, 'lifegain_payoff');

    if (lifegainSources < 12) {
      issues.push({
        code: 'ARCHETYPE_REQ_LIFEGAIN_SOURCES',
        severity: 'error',
        message: `Lifegain Engine baseline requires at least 12 lifegain sources at this level. You have ${lifegainSources}.`,
        details: { required: 12, actual: lifegainSources }
      });
      suggestedFixes.push({
        title: 'Add lifegain sources',
        description:
          'Increase your lifegain triggers to meet the archetype baseline before registering.',
        suggestedCards: []
      });
    }

    if (payoffs < 6) {
      issues.push({
        code: 'ARCHETYPE_REQ_PAYOFFS',
        severity: 'error',
        message: `Lifegain Engine baseline requires at least 6 payoffs at this level. You have ${payoffs}.`,
        details: { required: 6, actual: payoffs }
      });
      suggestedFixes.push({
        title: 'Add lifegain payoffs',
        description: 'Add payoffs to convert lifegain into board advantage.',
        suggestedCards: []
      });
    }
  }

  const isValid = !issues.some((issue) => issue.severity === 'error');

  return {
    isValid,
    bracket: deck.bracket,
    issues,
    suggestedFixes
  };
}

function countTagged(deck: DeckContext, tag: string): number {
  return deck.cards.reduce((acc, card) => {
    const tags = card.tags ?? [];
    return acc + (tags.includes(tag) ? card.qty : 0);
  }, 0);
}
