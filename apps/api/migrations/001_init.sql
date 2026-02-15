create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  handle text unique not null,
  password_hash text not null,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create table lore_planes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  era_tags text[] not null default '{}',
  is_active boolean not null default true
);

create table lore_factions (
  id uuid primary key default gen_random_uuid(),
  plane_id uuid not null references lore_planes(id),
  code text not null,
  name text not null,
  color_identity text not null,
  allowed_kinships text[] not null default '{}',
  is_active boolean not null default true,
  unique (plane_id, code)
);

create table lore_kinships (
  id uuid primary key default gen_random_uuid(),
  creature_type text unique not null,
  plane_codes text[] not null default '{}',
  is_active boolean not null default true
);

create table lore_classes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  allowed_archetypes text[] not null default '{}',
  is_active boolean not null default true
);

create table lore_archetypes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  required_tags jsonb not null default '[]',
  banned_tags jsonb not null default '[]',
  is_active boolean not null default true
);

create table rulesets (
  id uuid primary key default gen_random_uuid(),
  version text unique not null,
  notes text not null,
  created_at timestamptz not null default now()
);

create table talent_packages (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references rulesets(id),
  archetype_id uuid not null references lore_archetypes(id),
  level_min int not null,
  level_max int not null,
  bracket_min int not null,
  bracket_max int not null,
  name text not null,
  rules_text text not null,
  keywords text[] not null default '{}',
  mana_value_delta int not null default 0,
  stats_delta jsonb not null default '{}',
  weight int not null default 1,
  is_active boolean not null default true
);

create table characters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  name text not null,
  plane_id uuid not null references lore_planes(id),
  faction_id uuid not null references lore_factions(id),
  kinship_id uuid not null references lore_kinships(id),
  class_id uuid not null references lore_classes(id),
  archetype_id uuid not null references lore_archetypes(id),
  color_identity text not null,
  level int not null default 1,
  xp_total int not null default 0,
  bracket_cap int not null default 1,
  portrait_url text null,
  card_version int not null default 1,
  created_at timestamptz not null default now()
);

create table character_unlocks (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id),
  level int not null,
  roll int not null,
  talent_package_id uuid not null references talent_packages(id),
  reroll_of_unlock_id uuid null references character_unlocks(id),
  created_at timestamptz not null default now()
);

create table xp_events (
  id uuid primary key default gen_random_uuid(),
  character_id uuid not null references characters(id),
  type text not null,
  value int not null,
  evidence_ref text null,
  created_by uuid null references users(id),
  created_at timestamptz not null default now()
);

create table decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id),
  character_id uuid not null references characters(id),
  name text not null,
  bracket int not null,
  is_registered boolean not null default false,
  last_validated_at timestamptz null,
  created_at timestamptz not null default now()
);

create table deck_cards (
  id uuid primary key default gen_random_uuid(),
  deck_id uuid not null references decks(id) on delete cascade,
  card_name text not null,
  qty int not null default 1,
  tags text[] not null default '{}'
);

create table matches (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references users(id),
  ruleset_id uuid not null references rulesets(id),
  mode text not null,
  bracket int not null,
  players jsonb not null,
  winner jsonb null,
  duration_seconds int null,
  created_at timestamptz not null default now()
);

create table quests (
  id uuid primary key default gen_random_uuid(),
  ruleset_id uuid not null references rulesets(id),
  code text unique not null,
  name text not null,
  description text not null,
  xp_reward int not null,
  cooldown_hours int not null default 0,
  xp_cap_per_day int not null default 0,
  is_active boolean not null default true
);

create table quest_completions (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests(id),
  user_id uuid not null references users(id),
  character_id uuid not null references characters(id),
  completed_at timestamptz not null default now()
);
