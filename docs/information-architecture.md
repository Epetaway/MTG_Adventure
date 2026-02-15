# Information Architecture

Date: 2026-02-15

## Global Navigation (Bottom Tabs)
- Characters
- Decks
- Table
- Quests
- Profile

## Global Utilities
- Global search (cards, archetypes, factions) - optional v1
- Notification inbox (level-up ready, validation alerts, quest completion) - v1 lite
- QR scanner (validate commander card) - v2

## Key Concepts the UI Must Enforce
- Lore locking: Plane, faction, kinship, class, archetype must be canonical and compatible.
- Color identity lock: Once set, it is immutable.
- Bracket lock: Character level sets bracket ceiling; decks must validate to that bracket.
- No custom rules text: Users select system packages only; art and cosmetics are the only edits.
- XP outside the game: Match logging and app quests only; no in-game XP increments.
- D20 leveling is server-verified: Roll happens server-side; results stored as immutable audit records.

## Screen-by-Screen Wireflow

### 1) Characters Tab

#### 1.1 Characters List
Purpose: Quick access like a "My Characters" hub.

List cards display:
- portrait
- name
- level
- archetype badge
- bracket badge
- plane or faction chips

Primary CTA: Create Character

Secondary CTA: Copy (new Level 1 version with same lore choices, reset XP and level)

States:
- Empty state: "Create your first commander"
- Offline banner: "Offline - leveling and validation disabled"
- Sync state: "Syncing..." or "Last synced 2m ago"

#### 1.2 Create Character Wizard (Critical Flow)
Step 0: Lore baseline
- Brief: "Everything here is lore-consistent. You cannot mix incompatible canon tags."

Step 1: Choose Plane
- Cards grid (Ravnica, Dominaria, Zendikar, Innistrad, etc.)
- Filter: Story era (optional v1)

Step 2: Choose Faction or Guild or Group
- Depends on plane selection
- Shows color identity hints (not final)

Step 3: Choose Kinship (Creature Type)
- Show only lore-consistent options for that plane or faction

Step 4: Choose Class or Role
- MTG lore roles only
- Maps to ability pools

Step 5: Choose Archetype Path
- Examples: Lifegain Engine, Aristocrats, Tokens, Spellslinger, Artifacts Value, Reanimator
- Locks baseline template rules

Step 6: Identity confirmation
- App proposes color identity with explanations
- User picks from allowed alternatives only
- Finalize: lock color identity

Step 7: Level 1 Commander Package (Roll)
- Server-verified d20 roll
- Assigns mild ability package
- UI reveals rules text, stat line, keywords, bracket cap

Step 8: Portrait upload and name
- Upload artwork or choose placeholder
- Optional text prompts
- Finish and land on Character Sheet

#### 1.3 Character Sheet (D and D Beyond Fusion)
Top area:
- portrait
- name, level, XP progress
- plane, faction, kinship, class, archetype chips
- bracket badge

Primary actions:
- View Card
- Level Up (only when eligible)
- Register Deck
- Open Table (preselect commander)

Section A: Commander Card (read-only)
- rendered card preview
- rules text
- mana value and keywords
- version number (v1.0, v1.1)
- copy rules text

Section B: Oaths and Template Constraints
- required tag minimums
- forbidden tag categories at this level
- banned mechanics

Section C: Talents and Unlocks
- timeline list with roll, package name, unlocked changes

Section D: XP Ledger
- match logs
- quest completion
- seasonal achievements
- shows caps and limits

Section E: Cosmetics
- portrait
- frame styles (later)
- title prefixes earned

#### 1.4 Level-Up Flow (Server-Verified)
Level Up screen:
- requirements met
- bracket expansion at next level
- roll d20 button
- celebratory UI for rare packages (cosmetic only)

Reroll system:
- only with earned reroll token
- reroll logs remain auditable

### 2) Decks Tab

#### 2.1 Decks List
- deck name
- linked character
- bracket
- last validated date
- status: valid, needs changes, illegal

CTA: Create Deck

#### 2.2 Create or Import Deck
Choose one:
- Paste list (MVP)
- Manual add (later)
- Build from template (recommended)

Flow:
- select character
- select build mode
- open editor with validation panel

#### 2.3 Deck Editor and Validation
Layout:
- left: deck list
- right: validation, compliance, suggestions

Validation output should be explicit:
- "2 cards violate color identity"
- "Bracket 1 forbids game changers"
- "Archetype requires 12 lifegain triggers; you have 7"
- "Infinite combo risk: X + Y flagged"

Suggestions panel tabs:
- Fix Compliance
- Staples unlocked
- Archetype upgrades

#### 2.4 Deck Registration
- Deck becomes registered after validation passes
- Registered decks are selectable in Table mode and match logs

### 3) Table Tab (Mythic Tools Fusion)

#### 3.1 Pod Setup
- choose player count (2 to 5)
- add players (local names or friends list)
- select commander per player
- optional ruleset: Standard Commander or Adventure start or Party vs Villain
- CTA: Start Game

#### 3.2 Table Mode UI
Goals: big touch targets, fast actions, no scrolling.

Each player panel:
- life total (default 40)
- commander damage by opponent commander
- poison, energy, monarch, initiative toggles

Quick buttons:
- plus 1, minus 1
- plus 5, minus 5
- custom increments

Global controls:
- turn tracker
- timer (optional)
- end game

#### 3.3 End Game Summary
- winner or winners
- duration
- notable events
- log match

### 4) Quests Tab

#### 4.1 Quest Board
Quest types:
- session log quests
- mini-game quests
- seasonal story quests

Quest card fields:
- title
- XP reward
- bracket restriction
- cooldown info

#### 4.2 Mini-Games (MVP)
- lore quiz
- deckbuilder puzzle
- d20 trials

### 5) Profile Tab
- account settings
- preferences
- friends and playgroups
- data export
- governance: report issue or appeal

## Component Inventory
Foundation components:
- AppShell
- TopAppBar
- SheetSection
- Badge
- Chip
- Card
- StepperWizard
- RollModal
- AuditTimeline
- XPProgress
- XPLedgerList
- ValidationPanel
- SuggestionTabs
- DeckListEditor
- PlayerPanel
- CounterControl
- MatchSummary
- QuestCard
- QuestBoard
- PortraitUploader
- ImageCropper
- QRCodeView

## Key Patterns
- Read-only rules text is visually locked.
- Explain-why component for restrictions.
- Bracket gating banners explain unlock level.

## UX Fusion Rules
D and D Beyond side:
- progressive disclosure with collapsible sections
- strong identity header
- content toggles for sources and ruleset version

Mythic Tools side:
- big touch zones
- always-on essential controls
- automatic match record creation

## Engineering Notes
Phase 1 screens:
- Characters List
- Create Character Wizard
- Character Sheet
- Deck Import and Validate
- Table Mode
- Quest Board

Phase 2 screens:
- Collection tracking
- Template starter decks
- Stats dashboards
- Co-op scenario runner
