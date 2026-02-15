export function gatingNotesForBracket(bracket: 1 | 2 | 3 | 4 | 5): string[] {
  switch (bracket) {
    case 1:
      return [
        'Bracket 1: no Game Changers',
        'Bracket 1: no tutors',
        'Bracket 1: no extra turns',
        'Bracket 1: no mass land denial',
        'Bracket 1: no two-card infinite combos'
      ];
    case 2:
      return [
        'Bracket 2: no Game Changers',
        'Bracket 2: limit tutors and avoid early combo lines'
      ];
    case 3:
      return [
        'Bracket 3: up to 3 Game Changers',
        'Bracket 3: avoid cheap two-card infinite combos'
      ];
    case 4:
      return ['Bracket 4: optimized power, restrictions minimal beyond bans'];
    case 5:
      return ['Bracket 5: cEDH-level optimization, restrictions minimal beyond bans'];
  }
}
