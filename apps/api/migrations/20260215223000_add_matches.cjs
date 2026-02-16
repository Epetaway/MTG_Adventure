exports.up = (pgm) => {
  pgm.createTable('matches', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    ruleset_id: { type: 'uuid', notNull: true, references: 'rulesets', onDelete: 'restrict' },
    mode: { type: 'text', notNull: true },
    bracket: { type: 'int', notNull: true },
    status: { type: 'text', notNull: true, default: 'created' },
    started_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    ended_at: { type: 'timestamptz' },
    duration_seconds: { type: 'int' },
    created_by: { type: 'uuid', references: 'users' },
    tournament_ref: { type: 'text' },
    xp_awarded: { type: 'boolean', notNull: true, default: false },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  pgm.createTable('match_participants', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    match_id: { type: 'uuid', notNull: true, references: 'matches', onDelete: 'cascade' },
    character_id: { type: 'uuid', notNull: true, references: 'characters', onDelete: 'cascade' },
    placement: { type: 'int' },
    xp_value: { type: 'int', notNull: true, default: 0 },
    is_winner: { type: 'boolean', notNull: true, default: false },
    recorded_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') }
  });

  pgm.addConstraint('match_participants', 'match_participants_unique_match_character', {
    unique: ['match_id', 'character_id']
  });
};

exports.down = (pgm) => {
  pgm.dropTable('match_participants');
  pgm.dropTable('matches');
};
