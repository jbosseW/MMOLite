# MMOLite Art MVP Audit

## Snapshot

- Referenced image paths discovered in source (non-build): **309**
- Existing references: **206**
- Missing references: **103**
- Missing concentrated in: **icons/characters (60)**, **icons/books (25)**, **icons/items (9)**, **icons/loot (6)**, **weapons (3 path mismatches)**

## Content Scale (for MVP planning)

- Races: **8**
- Skill definitions: **45**
- Card templates: **667**
- Ability definitions: **50**
- Resource types: **148**
- Loot items: **102**
- Profile portraits cataloged: **60**
- Dungeon theme color sets: **50**
- World biomes: **17** + Hollow Earth biomes: **12**
- Runtime mount types referenced: **8** (raft, boat, ship, sea_mount, airship, flying_mount, horse, caravan)

## Blocking Gaps (coded but not fully wired)

- `loot.PROFILE_PORTRAITS` and avatar endpoints exist server-side, but client has no handler/UI for `portraits_list` / `avatar_updated` and does not render `avatar` fields in player UI.
- Build pipeline packages `client/*` and bundled server, but does **not** copy external `../icons` art folders into build output.
- No static `/icons` file serving route is configured in `server.js` (only API/socket middleware present).
- Most skills/cards use folder-style icon placeholders (e.g., `skills/Enchantment/`) rather than concrete image files.

## Missing Referenced Assets

### Character Portraits (60)

- `/icons/characters/elf_f1.png` (first seen: `loot.js:712`)
- `/icons/characters/elf_f2.png` (first seen: `loot.js:713`)
- `/icons/characters/elf_f3.png` (first seen: `loot.js:714`)
- `/icons/characters/elf_f5.png` (first seen: `loot.js:716`)
- `/icons/characters/elf_f6.png` (first seen: `loot.js:717`)
- `/icons/characters/elf_hunter.png` (first seen: `loot.js:715`)
- `/icons/characters/elf_m1.png` (first seen: `loot.js:706`)
- `/icons/characters/elf_m2.png` (first seen: `loot.js:707`)
- `/icons/characters/elf_m3.png` (first seen: `loot.js:708`)
- `/icons/characters/elf_m4.png` (first seen: `loot.js:709`)
- `/icons/characters/elf_m5.png` (first seen: `loot.js:710`)
- `/icons/characters/elf_mage.png` (first seen: `loot.js:711`)
- `/icons/characters/elf_warrior.png` (first seen: `loot.js:705`)
- `/icons/characters/gnome_dark.png` (first seen: `loot.js:722`)
- `/icons/characters/gnome_f1.png` (first seen: `loot.js:719`)
- `/icons/characters/gnome_f2.png` (first seen: `loot.js:720`)
- `/icons/characters/gnome_f3.png` (first seen: `loot.js:721`)
- `/icons/characters/gnome_m1.png` (first seen: `loot.js:723`)
- `/icons/characters/gnome_m2.png` (first seen: `loot.js:724`)
- `/icons/characters/gnome_m3.png` (first seen: `loot.js:725`)
- `/icons/characters/hm_alchemist.png` (first seen: `loot.js:675`)
- `/icons/characters/hm_archer.png` (first seen: `loot.js:672`)
- `/icons/characters/hm_barbarian.png` (first seen: `loot.js:673`)
- `/icons/characters/hm_bold.png` (first seen: `loot.js:667`)
- `/icons/characters/hm_captain.png` (first seen: `loot.js:680`)
- `/icons/characters/hm_chief.png` (first seen: `loot.js:687`)
- `/icons/characters/hm_conquistador.png` (first seen: `loot.js:685`)
- `/icons/characters/hm_darklord.png` (first seen: `loot.js:679`)
- `/icons/characters/hm_jarl.png` (first seen: `loot.js:669`)
- `/icons/characters/hm_knight.png` (first seen: `loot.js:663`)
- `/icons/characters/hm_knight2.png` (first seen: `loot.js:664`)
- `/icons/characters/hm_knight3.png` (first seen: `loot.js:665`)
- `/icons/characters/hm_lord.png` (first seen: `loot.js:678`)
- `/icons/characters/hm_pharaoh.png` (first seen: `loot.js:684`)
- `/icons/characters/hm_priest.png` (first seen: `loot.js:677`)
- `/icons/characters/hm_rogue.png` (first seen: `loot.js:676`)
- `/icons/characters/hm_ronin.png` (first seen: `loot.js:671`)
- `/icons/characters/hm_sage.png` (first seen: `loot.js:683`)
- `/icons/characters/hm_samurai.png` (first seen: `loot.js:670`)
- `/icons/characters/hm_scout.png` (first seen: `loot.js:681`)
- `/icons/characters/hm_shinobi.png` (first seen: `loot.js:682`)
- `/icons/characters/hm_templar.png` (first seen: `loot.js:674`)
- `/icons/characters/hm_thug.png` (first seen: `loot.js:686`)
- `/icons/characters/hm_viking.png` (first seen: `loot.js:668`)
- `/icons/characters/hm_warrior.png` (first seen: `loot.js:666`)
- `/icons/characters/hw_amazon.png` (first seen: `loot.js:691`)
- `/icons/characters/hw_archer.png` (first seen: `loot.js:693`)
- `/icons/characters/hw_girl.png` (first seen: `loot.js:703`)
- `/icons/characters/hw_knight.png` (first seen: `loot.js:692`)
- `/icons/characters/hw_maiden.png` (first seen: `loot.js:701`)
- `/icons/characters/hw_noble1.png` (first seen: `loot.js:699`)
- `/icons/characters/hw_noble2.png` (first seen: `loot.js:700`)
- `/icons/characters/hw_princess.png` (first seen: `loot.js:689`)
- `/icons/characters/hw_queen.png` (first seen: `loot.js:690`)
- `/icons/characters/hw_queen2.png` (first seen: `loot.js:702`)
- `/icons/characters/hw_shaman.png` (first seen: `loot.js:697`)
- `/icons/characters/hw_viking.png` (first seen: `loot.js:698`)
- `/icons/characters/hw_warrior.png` (first seen: `loot.js:694`)
- `/icons/characters/hw_witch1.png` (first seen: `loot.js:695`)
- `/icons/characters/hw_witch2.png` (first seen: `loot.js:696`)

### Spellbook Images (25)

- `/icons/books/Book_1.PNG` (first seen: `loot.js:227`)
- `/icons/books/Book_10.PNG` (first seen: `loot.js:237`)
- `/icons/books/Book_11.PNG` (first seen: `loot.js:239`)
- `/icons/books/Book_12.PNG` (first seen: `loot.js:240`)
- `/icons/books/Book_13.PNG` (first seen: `loot.js:241`)
- `/icons/books/Book_14.PNG` (first seen: `loot.js:242`)
- `/icons/books/Book_15.PNG` (first seen: `loot.js:243`)
- `/icons/books/Book_16.PNG` (first seen: `loot.js:245`)
- `/icons/books/Book_17.PNG` (first seen: `loot.js:246`)
- `/icons/books/Book_18.PNG` (first seen: `loot.js:247`)
- `/icons/books/Book_19.PNG` (first seen: `loot.js:248`)
- `/icons/books/Book_2.PNG` (first seen: `loot.js:228`)
- `/icons/books/Book_20.PNG` (first seen: `loot.js:250`)
- `/icons/books/Book_21.PNG` (first seen: `loot.js:251`)
- `/icons/books/Book_22.PNG` (first seen: `loot.js:253`)
- `/icons/books/Book_23.PNG` (first seen: `loot.js:254`)
- `/icons/books/Book_24.PNG` (first seen: `loot.js:256`)
- `/icons/books/Book_25.PNG` (first seen: `loot.js:257`)
- `/icons/books/Book_3.PNG` (first seen: `loot.js:229`)
- `/icons/books/Book_4.PNG` (first seen: `loot.js:230`)
- `/icons/books/Book_5.PNG` (first seen: `loot.js:231`)
- `/icons/books/Book_6.PNG` (first seen: `loot.js:233`)
- `/icons/books/Book_7.PNG` (first seen: `loot.js:234`)
- `/icons/books/Book_8.PNG` (first seen: `loot.js:235`)
- `/icons/books/Book_9.PNG` (first seen: `loot.js:236`)

### Scroll / Enchantment Icons (9)

- `/icons/items/Enchantment_22_scroll.PNG` (first seen: `loot.js:408`)
- `/icons/items/Enchantment_32_deathscroll.PNG` (first seen: `loot.js:394`)
- `/icons/items/Enchantment_33_runescroll.PNG` (first seen: `loot.js:409`)
- `/icons/items/Enchantment_34_summoning_scroll.PNG` (first seen: `loot.js:412`)
- `/icons/items/Enchantment_37_demon_scroll.PNG` (first seen: `loot.js:395`)
- `/icons/items/Enchantment_38_shadow_scroll.PNG` (first seen: `loot.js:393`)
- `/icons/items/Enchantment_39_mana_scroll.PNG` (first seen: `loot.js:396`)
- `/icons/items/Scroll_enchant.PNG` (first seen: `loot.js:391`)
- `/icons/items/Scroll_fire.PNG` (first seen: `loot.js:392`)

### Chest / Casket Variants (6)

- `/icons/loot/Blacksmith_51_wooden_chest.PNG` (first seen: `loot.js:334`)
- `/icons/loot/Blacksmith_52_wooden_chest.PNG` (first seen: `loot.js:336`)
- `/icons/loot/Blacksmith_53_red_chest.PNG` (first seen: `loot.js:337`)
- `/icons/loot/Blacksmith_54_iron_chest.PNG` (first seen: `loot.js:339`)
- `/icons/loot/Blacksmith_56_royal_casket.PNG` (first seen: `loot.js:341`)
- `/icons/loot/Blacksmith_60_magic_chest.PNG` (first seen: `loot.js:343`)

### Weapon Icon Path Mismatches (3)

- `weapons/Staff_02.PNG` (first seen: `accounts.js:2378`)
- `weapons/Staff_05.PNG` (first seen: `accounts.js:2369`)
- `weapons/Staff_08.PNG` (first seen: `accounts.js:2379`)

## Placeholder Icon Paths (need concrete art or resolver mapping)

- Skill icon placeholders (6):
  - `skills/Alchemy/`
  - `skills/Blacksmith/`
  - `skills/Cooking_fishing/`
  - `skills/Enchantment/`
  - `skills/Engineering/`
  - `skills/Herbalism/`

- Card icon placeholders (6 unique, reused across 667 cards):
  - `skills/Alchemy/`
  - `skills/Blacksmith/`
  - `skills/Cooking_fishing/`
  - `skills/Enchantment/`
  - `skills/Engineering/`
  - `skills/Herbalism/`

## MVP Art Asset Checklist (Sellable MVP)

### A) Must-Have Visual Foundation
- 1 visual direction guide (palette, line style, lighting, material language)
- 1 UI kit (window frames, buttons, tabs, tooltips, bars, minimap frame, inventory slots)
- 1 typography kit (title font, body font, numbers font)
- Brand pack: logo + launcher icon + 6-10 store screenshots + 3 capsule/cover variants

### B) World & Dungeon Environment
- Overworld tileset coverage for 17 biome families (MVP can collapse to 8 shared kits + palette swaps)
- Hollow Earth variant tiles for 12 biome families (can be recolors of overworld kits at MVP)
- Dungeon kit coverage for 50 themes (MVP: 8-12 kits reused across themes)
- Props/interactables: doors, chests, shrines, traps, forge/anvil/stations, bridges, portals

### C) Characters, Enemies, Bosses, Mounts
- Playable race/class visual set for 8 races (MVP: 8 base sprites + palette/gear overlays)
- Animation set per base actor: idle, walk (4-dir), attack, hit, death (minimum)
- Enemy sprite library (MVP target: 24-40 reusable enemies + color variants instead of 500+ uniques)
- Boss set: at least 8 signature bosses (aligned to 8 boss mechanic families)
- Mount sprites for 8 referenced mount types

### D) Combat, Skills, Cards, Items
- VFX set: melee arcs, projectile trails, impact bursts, crit, heal, buff/debuff aura, AoE telegraph, status icons
- Card system visuals: rarity frames, style overlays, archetype/type badges, card back(s), evolution/fusion VFX
- Skill icons: concrete image icons for 45 skill defs or a deterministic atlas mapping
- Item/resource icons: normalize around existing ICON_REGISTRY (58 unique paths)
- Fix all currently missing referenced icons: 103

### E) Social & Profile
- Portrait/avatar set for profile system (60 entries currently referenced)
- Guild/party/trade status icons and rank emblems

## Practical Scope Recommendation

- Technical MVP (playtest-ready): keep procedural rendering, fix missing references + path mismatches, add a minimal UI polish pass.
- Sellable MVP: invest in a coherent 2D style pack and prioritize readability/identity over raw unique asset count (reuse + palette strategy).
- Do **not** attempt unique art for all 667 cards and 500+ enemy definitions in first pass; use modular templates and tiered variants.
