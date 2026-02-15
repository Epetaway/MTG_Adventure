exports.up = (pgm) => {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("users", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    email: { type: "text", notNull: true, unique: true },
    handle: { type: "text", notNull: true, unique: true },
    password_hash: { type: "text", notNull: true },
    role: { type: "text", notNull: true, default: "user" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("lore_planes", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    code: { type: "text", notNull: true, unique: true },
    name: { type: "text", notNull: true },
    era_tags: { type: "text[]", notNull: true, default: "{}" },
    is_active: { type: "boolean", notNull: true, default: true }
  });

  pgm.createTable("lore_factions", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    plane_id: { type: "uuid", notNull: true, references: "lore_planes", onDelete: "cascade" },
    code: { type: "text", notNull: true },
    name: { type: "text", notNull: true },
    color_identity: { type: "text", notNull: true },
    allowed_kinships: { type: "text[]", notNull: true, default: "{}" },
    is_active: { type: "boolean", notNull: true, default: true }
  });
  pgm.addConstraint("lore_factions", "lore_factions_plane_code_unique", {
    unique: ["plane_id", "code"]
  });

  pgm.createTable("lore_kinships", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    creature_type: { type: "text", notNull: true, unique: true },
    plane_codes: { type: "text[]", notNull: true, default: "{}" },
    is_active: { type: "boolean", notNull: true, default: true }
  });

  pgm.createTable("lore_classes", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    code: { type: "text", notNull: true, unique: true },
    name: { type: "text", notNull: true },
    description: { type: "text", notNull: true },
    allowed_archetypes: { type: "text[]", notNull: true, default: "{}" },
    is_active: { type: "boolean", notNull: true, default: true }
  });

  pgm.createTable("lore_archetypes", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    code: { type: "text", notNull: true, unique: true },
    name: { type: "text", notNull: true },
    description: { type: "text", notNull: true },
    required_tags: { type: "jsonb", notNull: true, default: "[]" },
    banned_tags: { type: "jsonb", notNull: true, default: "[]" },
    is_active: { type: "boolean", notNull: true, default: true }
  });

  pgm.createTable("rulesets", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    version: { type: "text", notNull: true, unique: true },
    notes: { type: "text", notNull: true, default: "" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("talent_packages", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    ruleset_id: { type: "uuid", notNull: true, references: "rulesets", onDelete: "restrict" },
    archetype_id: { type: "uuid", notNull: true, references: "lore_archetypes", onDelete: "restrict" },
    level_min: { type: "int", notNull: true },
    level_max: { type: "int", notNull: true },
    bracket_min: { type: "int", notNull: true },
    bracket_max: { type: "int", notNull: true },
    name: { type: "text", notNull: true },
    rules_text: { type: "text", notNull: true },
    keywords: { type: "text[]", notNull: true, default: "{}" },
    mana_value_delta: { type: "int", notNull: true, default: 0 },
    stats_delta: { type: "jsonb", notNull: true, default: "{}" },
    weight: { type: "int", notNull: true, default: 1 },
    is_active: { type: "boolean", notNull: true, default: true }
  });

  pgm.createTable("characters", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "cascade" },
    name: { type: "text", notNull: true },
    plane_id: { type: "uuid", notNull: true, references: "lore_planes" },
    faction_id: { type: "uuid", notNull: true, references: "lore_factions" },
    kinship_id: { type: "uuid", notNull: true, references: "lore_kinships" },
    class_id: { type: "uuid", notNull: true, references: "lore_classes" },
    archetype_id: { type: "uuid", notNull: true, references: "lore_archetypes" },
    color_identity: { type: "text", notNull: true },
    level: { type: "int", notNull: true, default: 1 },
    xp_total: { type: "int", notNull: true, default: 0 },
    bracket_cap: { type: "int", notNull: true, default: 1 },
    portrait_url: { type: "text" },
    card_version: { type: "int", notNull: true, default: 1 },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("character_unlocks", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    character_id: { type: "uuid", notNull: true, references: "characters", onDelete: "cascade" },
    level: { type: "int", notNull: true },
    roll: { type: "int", notNull: true },
    audit_hash: { type: "text", notNull: true },
    talent_package_id: { type: "uuid", notNull: true, references: "talent_packages", onDelete: "restrict" },
    reroll_of_unlock_id: { type: "uuid", references: "character_unlocks" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });

  pgm.createTable("xp_events", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    character_id: { type: "uuid", notNull: true, references: "characters", onDelete: "cascade" },
    type: { type: "text", notNull: true },
    value: { type: "int", notNull: true },
    evidence_ref: { type: "text" },
    created_by: { type: "uuid", references: "users" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") }
  });
};

exports.down = (pgm) => {
  pgm.dropTable("xp_events");
  pgm.dropTable("character_unlocks");
  pgm.dropTable("characters");
  pgm.dropTable("talent_packages");
  pgm.dropTable("rulesets");
  pgm.dropTable("lore_archetypes");
  pgm.dropTable("lore_classes");
  pgm.dropTable("lore_kinships");
  pgm.dropTable("lore_factions");
  pgm.dropTable("lore_planes");
  pgm.dropTable("users");
};
