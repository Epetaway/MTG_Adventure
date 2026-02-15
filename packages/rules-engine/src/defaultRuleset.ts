import { RulesetContext } from './types.js';

export const defaultRuleset: RulesetContext = {
  version: '2026.02-beta',
  bracketRules: {
    1: {
      maxGameChangers: 0,
      allowTwoCardInfinite: false,
      allowExtraTurns: false,
      allowMassLandDenial: false,
      allowTutors: false
    },
    2: {
      maxGameChangers: 0,
      allowTwoCardInfinite: false,
      allowExtraTurns: false,
      allowMassLandDenial: false,
      allowTutors: false
    },
    3: {
      maxGameChangers: 3,
      allowTwoCardInfinite: false,
      allowExtraTurns: true,
      allowMassLandDenial: false,
      allowTutors: true
    },
    4: {
      maxGameChangers: null,
      allowTwoCardInfinite: true,
      allowExtraTurns: true,
      allowMassLandDenial: true,
      allowTutors: true
    },
    5: {
      maxGameChangers: null,
      allowTwoCardInfinite: true,
      allowExtraTurns: true,
      allowMassLandDenial: true,
      allowTutors: true
    }
  }
};
