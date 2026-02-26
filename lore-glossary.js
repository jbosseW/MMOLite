// lore-glossary.js
// Glossary terms for MMOLite — Age After the Atlas universe (Year 500 Post-Atlas)
// The continent of Fortuna. The Helios Doctrine. The Rift that was placed as punishment.
// Exports ~70 terms across 10 categories with query helpers.

const GLOSSARY_TERMS = [

  // ─────────────────────────── COMBAT (8) ───────────────────────────
  {
    id: 'hit_points',
    term: 'Hit Points (HP)',
    definition: 'A measure of how much damage a character can sustain before falling. When HP reaches zero inside the Rift, the adventurer is expelled to the nearest camp and loses a portion of carried loot.',
    category: 'combat',
    seeAlso: ['player_death', 'defense', 'dungeon_camp'],
    unlockTrigger: null
  },
  {
    id: 'attack_power',
    term: 'Attack Power',
    definition: 'The base damage value behind every strike. Attack power is derived from equipped cards, skill levels, and racial bonuses, then modified by the target\'s defense before final damage is dealt.',
    category: 'combat',
    seeAlso: ['critical_hit', 'equipped_cards', 'skill_level'],
    unlockTrigger: null
  },
  {
    id: 'defense',
    term: 'Defense',
    definition: 'Flat damage reduction applied to every incoming hit. Defense is raised by equipped cards, crafted armor, and certain racial traits. It cannot reduce damage below one.',
    category: 'combat',
    seeAlso: ['hit_points', 'attack_power', 'card_slot'],
    unlockTrigger: null
  },
  {
    id: 'critical_hit',
    term: 'Critical Hit',
    definition: 'A strike that deals amplified damage, typically double the base value. Critical chance scales with the Anatomy skill and certain card styles. Boss-floor enemies are immune to critical hits until their shield phase ends.',
    category: 'combat',
    seeAlso: ['attack_power', 'anatomy_skill', 'boss_floor'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'boss_floor',
    term: 'Boss Floor',
    definition: 'Every tenth floor of the Rift is sealed by a powerful guardian. Boss floors cannot be skipped; the guardian must be defeated to unlock the stairway deeper. Loot quality on boss floors is significantly higher than normal.',
    category: 'combat',
    seeAlso: ['rift_dungeon', 'floor_theme', 'floor_modifier'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'enemy_ai',
    term: 'Enemy AI',
    definition: 'Rift creatures follow behavioral patterns that shift with floor depth. Shallow enemies patrol fixed paths, mid-depth foes hunt by proximity, and deep-floor horrors coordinate in packs and set ambushes.',
    category: 'combat',
    seeAlso: ['boss_floor', 'mimic', 'fog_of_war'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'mimic',
    term: 'Mimic',
    definition: 'A Rift-spawned predator that disguises itself as a treasure chest, resource node, or even a camp fire. Mimics grow more convincing on deeper floors and always drop a rare material when slain.',
    category: 'combat',
    seeAlso: ['enemy_ai', 'resource_node', 'rift_dungeon'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'player_death',
    term: 'Player Death',
    definition: 'When an adventurer\'s HP reaches zero they are expelled from the dungeon, losing a percentage of unsecured loot. Death inside the Rift carries no permanent penalty, but dying during a Bleed event on the overworld costs additional coins.',
    category: 'combat',
    seeAlso: ['hit_points', 'bleed_event', 'coins'],
    unlockTrigger: 'dungeon_enter'
  },

  // ─────────────────────────── CARDS (8) ────────────────────────────
  {
    id: 'card_pack',
    term: 'Card Pack',
    definition: 'A sealed bundle of collectable cards purchased from the Card Vendor or earned as Rift rewards. Each pack contains five cards with rarities determined by weighted random draws and the pity system.',
    category: 'cards',
    seeAlso: ['card_rarity', 'pity_system', 'card_vendor'],
    unlockTrigger: 'card_open_pack'
  },
  {
    id: 'card_rarity',
    term: 'Card Rarity',
    definition: 'Cards are graded across eight tiers: Common, Uncommon, Rare, Ultra Rare, Mythic Rare, Legendary, Godly, and Relic. Higher-rarity cards provide stronger stat bonuses and unique passive effects when equipped.',
    category: 'cards',
    seeAlso: ['card_pack', 'card_fusion', 'equipped_cards'],
    unlockTrigger: 'card_open_pack'
  },
  {
    id: 'card_fusion',
    term: 'Card Fusion',
    definition: 'Three identical cards of the same rarity can be fused into a single card of the next rarity tier. Fusion preserves the card\'s style but rerolls its secondary stat bonus. Relic-tier cards cannot be fused further.',
    category: 'cards',
    seeAlso: ['card_rarity', 'card_style'],
    unlockTrigger: 'card_open_pack'
  },
  {
    id: 'card_style',
    term: 'Card Style',
    definition: 'A cosmetic and mechanical variant applied to a card at creation. Styles include Standard, Foil, Holographic, and Prismatic, each granting a small bonus multiplier to the card\'s base effect.',
    category: 'cards',
    seeAlso: ['card_rarity', 'card_fusion'],
    unlockTrigger: 'card_open_pack'
  },
  {
    id: 'card_slot',
    term: 'Card Slot',
    definition: 'Adventurers begin with three card slots and can unlock up to six through guild rank promotions. Only cards placed in active slots provide their stat bonuses and passive effects during combat.',
    category: 'cards',
    seeAlso: ['equipped_cards', 'guild_rank'],
    unlockTrigger: 'card_open_pack'
  },
  {
    id: 'equipped_cards',
    term: 'Equipped Cards',
    definition: 'Cards placed into active card slots that modify an adventurer\'s stats. Equipped cards can be swapped freely outside the Rift but are locked in place once a dungeon delve begins.',
    category: 'cards',
    seeAlso: ['card_slot', 'attack_power', 'defense'],
    unlockTrigger: 'card_open_pack'
  },
  {
    id: 'pity_system',
    term: 'Pity System',
    definition: 'A hidden counter that guarantees a high-rarity card after a streak of low-rarity pulls. Every fifty packs opened without a Legendary or above triggers a guaranteed Legendary card in the next pack.',
    category: 'cards',
    seeAlso: ['card_pack', 'card_rarity', 'card_vendor'],
    unlockTrigger: 'card_open_pack'
  },
  {
    id: 'card_vendor',
    term: 'Card Vendor',
    definition: 'An NPC merchant found in every major settlement who sells card packs for coins. The vendor\'s stock rotates daily and occasionally includes limited-edition themed packs tied to seasonal events.',
    category: 'cards',
    seeAlso: ['card_pack', 'coins', 'npc_shop'],
    unlockTrigger: null
  },

  // ─────────────────────────── SKILLS (7) ───────────────────────────
  {
    id: 'skill_xp',
    term: 'Skill XP',
    definition: 'Experience points earned by performing actions tied to a specific skill. Chopping a tree grants Woodcutting XP, smelting ore grants Smithing XP, and so on. XP requirements increase with each level.',
    category: 'skills',
    seeAlso: ['skill_level', 'gathering_skills', 'crafting_skills'],
    unlockTrigger: null
  },
  {
    id: 'skill_level',
    term: 'Skill Level',
    definition: 'A numeric representation of proficiency in a given skill, ranging from 1 to 99. Higher levels unlock new recipes, resource nodes, and passive bonuses. Reaching level 99 grants a mastery title.',
    category: 'skills',
    seeAlso: ['skill_xp', 'recipe'],
    unlockTrigger: null
  },
  {
    id: 'gathering_skills',
    term: 'Gathering Skills',
    definition: 'The family of skills used to harvest raw materials from the world: Mining, Woodcutting, Fishing, Herbalism, and Skinning. Gathering skill levels determine which resource nodes can be harvested.',
    category: 'skills',
    seeAlso: ['resource_node', 'skill_level', 'skill_xp'],
    unlockTrigger: 'first_harvest'
  },
  {
    id: 'crafting_skills',
    term: 'Crafting Skills',
    definition: 'Skills that transform raw materials into finished goods: Smithing, Tailoring, Alchemy, Cooking, and Enchanting. Each crafting skill has its own station type and recipe list.',
    category: 'skills',
    seeAlso: ['crafting_station', 'recipe', 'skill_level'],
    unlockTrigger: 'first_craft'
  },
  {
    id: 'combat_skills',
    term: 'Combat Skills',
    definition: 'Passive skills that improve automatically through Rift combat: Melee, Ranged, Arcane, and Vitality. Each governs a different aspect of fighting and unlocks new card synergies at milestone levels.',
    category: 'skills',
    seeAlso: ['attack_power', 'defense', 'equipped_cards'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'dungeon_delving',
    term: 'Dungeon Delving',
    definition: 'A meta-skill that tracks total floors cleared across all Rift expeditions. Higher Dungeon Delving levels increase the chance of finding rare floor modifiers and hidden rooms.',
    category: 'skills',
    seeAlso: ['rift_dungeon', 'floor_modifier', 'skill_xp'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'anatomy_skill',
    term: 'Anatomy',
    definition: 'A combat sub-skill governing critical hit chance and weak-point exploitation. Anatomy levels increase passively with each unique enemy type slain and grant a small critical damage bonus every ten levels.',
    category: 'skills',
    seeAlso: ['critical_hit', 'combat_skills', 'enemy_ai'],
    unlockTrigger: 'dungeon_enter'
  },

  // ─────────────────────────── RACES (9) ────────────────────────────
  {
    id: 'human_race',
    term: 'Human',
    definition: 'Builders of the Holy Dominion and the most numerous people on Fortuna. Humans worship Helios as the supreme deity and govern through the Helios Doctrine, which declares human spiritual primacy over all other races. Humans receive bonuses to XP gain, market prices within Dominion territory, and social manipulation skills.',
    category: 'races',
    seeAlso: ['holy_dominion', 'helios_doctrine', 'coins'],
    unlockTrigger: 'race_select'
  },
  {
    id: 'elf_race',
    term: 'Elf (High Elf)',
    definition: 'Long-lived survivors of the Calidar cataclysm, now serving as the Holy Dominion\'s administrative caste. Elves shared the city of Calidar with the Dark Elves before Heaven\'s Atlas destroyed it. They gain bonuses to magic skill XP and unlock magic abilities faster, but have lower base HP and reduced melee effectiveness.',
    category: 'races',
    seeAlso: ['calidar', 'dark_elf_lore', 'heavens_atlas', 'hit_points'],
    unlockTrigger: 'race_select'
  },
  {
    id: 'dark_elf_lore',
    term: 'Dark Elf',
    definition: 'A distinct elven culture who shared the city of Calidar with the High Elves, practicing divine ritual magic and following a god separate from Helios. Dark Elves were systematically exterminated by the Holy Dominion in the century following Year 0, blamed collectively for the Reclamation Sect\'s petition for divine intervention — a group that represented a fraction of Calidar\'s population. Their records were destroyed, their religion officially suppressed, and their people eliminated by Luminary Inquest campaigns. By Year 100, no living Dark Elf remained. They are remembered only in fragmented, heavily altered Dominion historical accounts that conflate the innocent Vel\'sharath scholars with the Reclamation Sect. Their god, however, endures.',
    category: 'races',
    seeAlso: ['calidar', 'elf_race', 'heavens_atlas', 'the_rift'],
    unlockTrigger: 'book_discover:two_movements_calidar'
  },
  {
    id: 'orc_race',
    term: 'Orc',
    definition: 'Warriors of the fragmented Steppe Khanate, organized into competing clans since the death of Great Khan Morghul in Year -45. Orcs have the highest base HP and melee combat bonuses of any race but suffer a penalty to magical ability. Their clan-moot governance and oral tradition preserve thousands of years of history the Dominion would prefer forgotten.',
    category: 'races',
    seeAlso: ['khanate', 'attack_power', 'crafting_skills'],
    unlockTrigger: 'race_select'
  },
  {
    id: 'dwarf_race',
    term: 'Dwarf',
    definition: 'Mountain-dwelling artisans who maintain the Free Holds of Stone in the western mountains of Fortuna. Dwarves rejected the Helios Doctrine in Year -600 and have maintained that rejection ever since. They gain bonuses to mining and crafting, possess innate darkvision, and have a minor tremor sense that makes them exceptional underground fighters.',
    category: 'races',
    seeAlso: ['free_holds', 'crafting_skills', 'rift_dungeon'],
    unlockTrigger: 'race_select'
  },
  {
    id: 'gnome_race',
    term: 'Gnome',
    definition: 'Tinkerers and engineers who run the Gnomish Collective on the eastern archipelago of Fortuna. The Collective has been withdrawing from continental affairs since Year 120, building toward Phase Three — a contingency plan of unknown scope. Gnomes gain substantial bonuses to engineering, cogworking, and automaton construction.',
    category: 'races',
    seeAlso: ['gnomish_collective', 'mimic', 'crafting_skills'],
    unlockTrigger: 'race_select'
  },
  {
    id: 'goblin_race',
    term: 'Goblin',
    definition: 'Resourceful survivors of five hundred years of suppression across Fortuna, maintaining a continent-spanning resistance network of extraordinary sophistication. Goblins are classified as vermin in Dominion documents. They respond with espionage and sabotage. They receive substantial stealth and evasion bonuses, as well as bonuses to archery and trap-making.',
    category: 'races',
    seeAlso: ['goblin_resistance', 'npc_shop', 'coins'],
    unlockTrigger: 'race_select'
  },
  {
    id: 'lizardfolk_race',
    term: 'Lizardfolk',
    definition: 'Sect-organized scholars of the southern marshlands of Fortuna, who have been observing and documenting events on the continent for millennia. The Astronomy Sect predicted the Atlas event a decade before it occurred. The warning went unread. Lizardfolk subsequently founded the Veiled Hand. They gain bonuses to fishing, possess thermal vision, can breathe underwater, and have innate poison immunity.',
    category: 'races',
    seeAlso: ['defense', 'hit_points', 'floor_theme'],
    unlockTrigger: 'race_select'
  },
  {
    id: 'catfolk_race',
    term: 'Catfolk',
    definition: 'Nomadic traders and acrobats known across the Free Holds for their caravan networks. Catfolk gain bonus critical hit chance, move faster on the overworld, and receive improved prices at NPC shops.',
    category: 'races',
    seeAlso: ['critical_hit', 'npc_shop', 'free_holds'],
    unlockTrigger: 'race_select'
  },

  // ─────────────────────────── WORLD (9) ────────────────────────────
  {
    id: 'fortuna',
    term: 'Fortuna',
    definition: 'The continent where the game takes place, called the Enlightened Continent by the Holy Dominion and the Holy Lands by its religious faithful. Other races of Fortuna use the name without the attached theology. Nine peoples have shared this continent for millennia. For five hundred years, the wound at its center has been the world\'s defining crisis.',
    category: 'world',
    seeAlso: ['holy_dominion', 'the_rift', 'helios_doctrine'],
    unlockTrigger: null
  },
  {
    id: 'helios_doctrine',
    term: 'The Helios Doctrine',
    definition: 'The theological and political framework issued by the Holy Dominion asserting that Helios is the primary deity of all peoples on Fortuna, that other races\' gods are lesser powers subordinate to his authority, and that humanity, as Helios\'s chosen people, has a divine mandate to administer all other races. The Doctrine has been the formal basis of Dominion foreign policy for over five hundred years. What the Doctrine does not acknowledge is that Helios is a demi-god, not a full deity — born of a divine father and a mortal woman — and that he has been sealed below Solara for five centuries, his divine essence siphoned to power imperial artifacts.',
    category: 'world',
    seeAlso: ['holy_dominion', 'helios_sealed', 'heavens_atlas'],
    unlockTrigger: null
  },
  {
    id: 'helios_sealed',
    term: 'Helios (Sealed)',
    definition: 'The demi-god at the center of Dominion theology, currently imprisoned in vaults below the Cathedral of the Chosen in Solara. Helios is the son of a divine lord and a mortal woman — powerful enough to be worshipped, not powerful enough to resist being sealed. The deployment of Heaven\'s Atlas, which contained one of his own organs, nearly destroyed him. He has been in a state between life and death for five hundred years, his essence continuously siphoned by the Dominion\'s Cardinal leadership to power artifacts of war. He is not conscious. He cannot respond to prayer. He does not know the soldier who carries his punishment is searching for him.',
    category: 'world',
    seeAlso: ['helios_doctrine', 'heavens_atlas', 'the_rift'],
    unlockTrigger: 'book_discover:covenant_fragment_4'
  },
  {
    id: 'the_rift',
    term: 'The Rift',
    definition: 'A spatial tear created by a Dark Elven god at the epicenter of Heaven\'s Atlas\'s detonation, placed as divine punishment at the heart of the old human capital. The Rift is an infinite, ever-shifting labyrinth whose floors reseed daily — each floor populated by near-perfect hollow replicas of known species, beings that cannot speak and that sometimes shift form mid-encounter. Something inside it has been there for five hundred years. It is not the Rift itself that is the threat. It is what the Rift contains, and what it is doing to the world around it as it widens.',
    category: 'world',
    seeAlso: ['heavens_atlas', 'calidar', 'bleed_event', 'rift_dungeon', 'helios_doctrine'],
    unlockTrigger: null
  },
  {
    id: 'heavens_atlas',
    term: 'Heaven\'s Atlas',
    definition: 'A mystical device of divine origin, forged by gods and sealed with one of Helios\'s own organs. It glowed sickly green and burned to the touch and was carried in a great metal container to Calidar, where a Dominion warrior placed it at the city\'s heart and activated it. The detonation destroyed Calidar entirely and created the spatial rift that became the Rift. The Atlas nearly destroyed Helios in the process. The Dominion\'s official position is that the Atlas was a divine weapon wielded by Helios\'s grace. The Astronomy Sect\'s sealed records describe it as a demi-god\'s organ weaponized against his will.',
    category: 'world',
    seeAlso: ['the_rift', 'calidar', 'helios_sealed'],
    unlockTrigger: 'book_discover:covenant_fragment_7'
  },
  {
    id: 'calidar',
    term: 'Calidar',
    definition: 'Once the most beautiful city on Fortuna: a desert oasis joint capital of the Elven and Dark Elven peoples, where marble colonnades and obsidian towers rose from carefully cultivated gardens. Heaven\'s Atlas consumed it entirely — every structure, every person within it, every century of accumulated scholarship and artistry — in a single hot flash of white light and sickly green fire. What remains is fifty miles of green glass, hot ash, and fluctuating magma. Its name is spoken in code by elves and in grief by the handful of surviving Dark Elves. The Dominion does not speak it at all if it can avoid the subject.',
    category: 'world',
    seeAlso: ['the_rift', 'heavens_atlas', 'dark_elf_lore'],
    unlockTrigger: 'book_discover:history_last_war'
  },
  {
    id: 'bleed_event',
    term: 'Bleed Event',
    definition: 'A periodic surge where Rift energy spills onto the overworld of Fortuna, spawning hostile creatures outside the dungeon. Bleeds last several real-time minutes and drop unique materials not found inside the Rift itself. The frequency of Bleed events has increased sharply in the past decade, correlating with the lich\'s increasing activity on the surface.',
    category: 'world',
    seeAlso: ['the_rift', 'enemy_ai', 'resource_node'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'rift_compact',
    term: 'The Compact',
    definition: 'A treaty signed by six of the eight racial governments of Fortuna in Year 480, establishing the Adventure Guild as the sole authority over Rift exploration and granting Guild towns extraterritorial status. The Dominion signed under protest. The Dark Elven people, eliminated by Inquest campaigns in the preceding century, were not represented. The Compact is fragile — the Dominion views it as an infringement on the Helios Doctrine\'s divine mandate, and the Inquest has been systematically testing its boundaries.',
    category: 'world',
    seeAlso: ['adventure_guild', 'the_rift', 'helios_doctrine'],
    unlockTrigger: 'book_discover:history_guild_founding'
  },
  {
    id: 'year_zero',
    term: 'Year Zero',
    definition: 'The calendar epoch marking the destruction of Calidar by Heaven\'s Atlas and the opening of the Rift as divine punishment. All modern dates are reckoned from this event. The current year is 500 Post-Atlas. Five centuries have passed since the morning the world went green.',
    category: 'world',
    seeAlso: ['calidar', 'heavens_atlas', 'the_rift'],
    unlockTrigger: null
  },
  {
    id: 'cathedral_district',
    term: 'Cathedral District',
    definition: 'The walled heart of the Dominion capital in Solara, where the Luminary Inquest holds court and the Cathedral of the Chosen stands. Non-humans require special permits to enter. Below the Cathedral, in vaults that have not been inspected by any independent authority in five centuries, Helios is sealed — alive, barely, his essence siphoned continuously for the Dominion\'s use.',
    category: 'world',
    seeAlso: ['holy_dominion', 'luminary_inquest', 'helios_sealed'],
    unlockTrigger: 'book_discover:history_dominion'
  },

  // ─────────────────────────── ECONOMY (6) ──────────────────────────
  {
    id: 'coins',
    term: 'Coins',
    definition: 'The universal currency of the Age After War, minted by the Adventure Guild under the terms of the Compact. Coins are earned by selling loot, completing quests, and trading with other players.',
    category: 'economy',
    seeAlso: ['npc_shop', 'auction_house', 'player_trade'],
    unlockTrigger: null
  },
  {
    id: 'npc_shop',
    term: 'NPC Shop',
    definition: 'Merchant stalls found in settlements that buy and sell goods at fixed base prices. Shop inventories rotate daily and prices are influenced by the supply-demand system. Goblins and catfolk receive racial discounts.',
    category: 'economy',
    seeAlso: ['coins', 'supply_demand', 'goblin_race'],
    unlockTrigger: null
  },
  {
    id: 'auction_house',
    term: 'Auction House',
    definition: 'A player-driven marketplace where items are listed for sale at prices set by the seller. The Adventure Guild takes a five-percent fee on every completed transaction. Listings expire after 48 real-time hours.',
    category: 'economy',
    seeAlso: ['coins', 'player_trade', 'adventure_guild'],
    unlockTrigger: null
  },
  {
    id: 'player_trade',
    term: 'Player Trade',
    definition: 'A direct item-and-coin exchange between two players conducted through a secure trade window. Both parties must confirm before the trade finalizes. There is no fee for direct trades.',
    category: 'economy',
    seeAlso: ['coins', 'auction_house'],
    unlockTrigger: null
  },
  {
    id: 'supply_demand',
    term: 'Supply and Demand',
    definition: 'A dynamic pricing system applied to NPC shops. When players sell large quantities of an item, the buy price drops; when stock runs low, sell prices rise. Prices reset gradually over a 24-hour cycle.',
    category: 'economy',
    seeAlso: ['npc_shop', 'coins'],
    unlockTrigger: null
  },
  {
    id: 'presence_discount',
    term: 'Presence Discount',
    definition: 'A small price reduction at NPC shops granted to players who have claimed a housing plot in the same settlement. The discount scales with the player\'s local reputation and plot tier.',
    category: 'economy',
    seeAlso: ['npc_shop', 'plot_claim', 'coins'],
    unlockTrigger: 'plot_claim'
  },

  // ─────────────────────────── HOUSING (4) ──────────────────────────
  {
    id: 'plot_claim',
    term: 'Plot Claim',
    definition: 'The act of purchasing an empty plot of land in a settlement to build on. Plots come in small, medium, and large sizes, each allowing progressively more placed objects. Claiming a plot unlocks the Presence Discount at local shops.',
    category: 'housing',
    seeAlso: ['plot_placement', 'presence_discount', 'coins'],
    unlockTrigger: 'plot_claim'
  },
  {
    id: 'plot_placement',
    term: 'Plot Placement',
    definition: 'The building interface used to place furniture, crafting stations, storage, and decorations on a claimed plot. Objects snap to a grid and can be rotated freely. Some items require a minimum plot size.',
    category: 'housing',
    seeAlso: ['plot_claim', 'crafting_station'],
    unlockTrigger: 'plot_claim'
  },
  {
    id: 'personal_portal',
    term: 'Personal Portal',
    definition: 'A portal stone placed on the player\'s plot that allows instant travel home from any settlement. Crafting a personal portal requires a rare Rift crystal dropped on floors 20 and below.',
    category: 'housing',
    seeAlso: ['anchor_portal', 'plot_claim', 'rift_dungeon'],
    unlockTrigger: 'plot_claim'
  },
  {
    id: 'anchor_portal',
    term: 'Anchor Portal',
    definition: 'Fixed portal gates built by the Adventure Guild in every major settlement, allowing fast travel between towns. Using an anchor portal costs a small coin fee that scales with distance.',
    category: 'housing',
    seeAlso: ['personal_portal', 'coins', 'adventure_guild'],
    unlockTrigger: null
  },

  // ─────────────────────────── DUNGEONS (8) ─────────────────────────
  {
    id: 'rift_dungeon',
    term: 'Rift Dungeon',
    definition: 'The infinite, procedurally generated labyrinth beneath the Rift. Floors reseed daily at midnight server time, ensuring no two days play the same. Depth is theoretically limitless, but floor difficulty scales without cap.',
    category: 'dungeons',
    seeAlso: ['the_rift', 'floor_theme', 'boss_floor'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'overworld_cave',
    term: 'Overworld Cave',
    definition: 'Small, finite dungeons scattered across the surface world, unrelated to the Rift. Overworld caves have fixed layouts, weaker enemies, and are ideal for new adventurers preparing for their first Rift descent.',
    category: 'dungeons',
    seeAlso: ['rift_dungeon', 'enemy_ai'],
    unlockTrigger: null
  },
  {
    id: 'floor_theme',
    term: 'Floor Theme',
    definition: 'Each Rift floor is assigned a biome theme that determines its tileset, enemy roster, and environmental hazards. Themes include Fungal Cavern, Flooded Ruins, Obsidian Forge, Bone Garden, and many others.',
    category: 'dungeons',
    seeAlso: ['rift_dungeon', 'floor_modifier', 'boss_floor'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'dungeon_camp',
    term: 'Dungeon Camp',
    definition: 'Safe zones that appear every five floors inside the Rift, marked by Adventure Guild lanterns. Camps allow players to bank loot, swap equipped cards, and access a limited NPC shop before continuing deeper.',
    category: 'dungeons',
    seeAlso: ['rift_dungeon', 'equipped_cards', 'npc_shop'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'guild_rank',
    term: 'Guild Rank',
    definition: 'An adventurer\'s standing within the Adventure Guild, progressing through Stone, Iron, Silver, Gold, Platinum, Diamond, and Relic tiers. Higher ranks unlock deeper Rift access, additional card slots, and exclusive daily quests.',
    category: 'dungeons',
    seeAlso: ['adventure_guild', 'card_slot', 'daily_quest'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'daily_quest',
    term: 'Daily Quest',
    definition: 'A set of three randomized objectives issued by the Adventure Guild each day. Tasks range from slaying specific enemies to harvesting rare materials. Completing all three grants bonus coins and guild reputation.',
    category: 'dungeons',
    seeAlso: ['guild_rank', 'adventure_guild', 'coins'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'fog_of_war',
    term: 'Fog of War',
    definition: 'Unexplored areas of a Rift floor are hidden behind impenetrable darkness. The fog recedes as the player moves and is permanently cleared for the remainder of that day\'s seed. Light sources extend reveal range.',
    category: 'dungeons',
    seeAlso: ['rift_dungeon', 'enemy_ai'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'floor_modifier',
    term: 'Floor Modifier',
    definition: 'A random mutator applied to a Rift floor that alters the rules of engagement. Examples include "Darkened" (reduced vision), "Frenzied" (faster enemies), and "Bountiful" (double resource nodes). Rare modifiers stack on deep floors.',
    category: 'dungeons',
    seeAlso: ['rift_dungeon', 'floor_theme', 'dungeon_delving'],
    unlockTrigger: 'dungeon_enter'
  },

  // ─────────────────────────── CRAFTING (5) ─────────────────────────
  {
    id: 'crafting_station',
    term: 'Crafting Station',
    definition: 'Specialized workbenches required to craft items of a particular discipline. Anvils serve Smithing, Looms serve Tailoring, Cauldrons serve Alchemy, and so on. Stations can be placed on housing plots or found in settlements.',
    category: 'crafting',
    seeAlso: ['recipe', 'crafting_skills', 'plot_placement'],
    unlockTrigger: 'first_craft'
  },
  {
    id: 'recipe',
    term: 'Recipe',
    definition: 'A formula that specifies the materials, crafting station, and minimum skill level needed to produce an item. Recipes are unlocked by reaching skill milestones, completing quests, or discovering them as Rift loot.',
    category: 'crafting',
    seeAlso: ['crafting_station', 'skill_level', 'resource_node'],
    unlockTrigger: 'first_craft'
  },
  {
    id: 'resource_node',
    term: 'Resource Node',
    definition: 'Harvestable objects scattered across the overworld and inside Rift floors: ore veins, trees, herb patches, fishing spots. Each node requires a minimum gathering skill level and respawns after a cooldown period.',
    category: 'crafting',
    seeAlso: ['gathering_skills', 'skill_level'],
    unlockTrigger: 'first_harvest'
  },
  {
    id: 'smelting',
    term: 'Smelting',
    definition: 'The Smithing sub-process of refining raw ore into ingots at a Furnace station. Smelting yields scale with Smithing level, and high-level smelts can produce bonus ingots from a single ore batch.',
    category: 'crafting',
    seeAlso: ['crafting_station', 'crafting_skills', 'resource_node'],
    unlockTrigger: 'first_craft'
  },
  {
    id: 'cooking_skill',
    term: 'Cooking',
    definition: 'A crafting discipline focused on preparing food that grants temporary stat buffs when consumed. Cooked meals restore HP over time and can boost attack power, defense, or gathering speed for several real-time minutes.',
    category: 'crafting',
    seeAlso: ['crafting_skills', 'hit_points', 'attack_power'],
    unlockTrigger: 'first_craft'
  },

  // ─────────────────────────── FACTIONS (8) ─────────────────────────
  {
    id: 'adventure_guild',
    term: 'Adventure Guild',
    definition: 'The multinational organization chartered by the Compact to contain the Rift and regulate dungeon exploration. The Guild maintains camps inside the Rift, issues daily quests, ranks adventurers, and mints the universal coin currency.',
    category: 'factions',
    seeAlso: ['rift_compact', 'guild_rank', 'daily_quest', 'coins'],
    unlockTrigger: null
  },
  {
    id: 'holy_dominion',
    term: 'Holy Dominion',
    definition: 'A human theocratic empire that controls the central plains of Fortuna, founded on the Helios Doctrine. The Dominion deployed Heaven\'s Atlas against Calidar in Year 0 and has governed the continent\'s political narrative ever since. It regulates magic use through the Luminary Inquest, executing unlicensed practitioners. Below its capital, Helios himself is sealed and drained. The Dominion considers the Rift a divine testing ground. The Rift does not care about this interpretation.',
    category: 'factions',
    seeAlso: ['luminary_inquest', 'human_race', 'cathedral_district', 'helios_doctrine'],
    unlockTrigger: null
  },
  {
    id: 'luminary_inquest',
    term: 'Luminary Inquest',
    definition: 'The Holy Dominion\'s magical enforcement order on Fortuna, founded in Year 1 to enforce the Magic Ban. Inquest agents — Luminaries — have the legal authority to investigate, detain, and execute unlicensed magic users. All magic use outside Inquest-approved licenses is punishable by imprisonment or death. The Inquest\'s classified records contain evidence of the lich\'s true identity that has never been published.',
    category: 'factions',
    seeAlso: ['holy_dominion', 'cathedral_district'],
    unlockTrigger: 'book_discover:covenant_fragment_3'
  },
  {
    id: 'veiled_hand',
    term: 'The Veiled Hand',
    definition: 'A compartmentalized assassination network founded by lizardfolk astronomers in Year 1, after the Astronomy Sect\'s warning about the Atlas went unheeded. Its mandate is anti-escalation: the removal of individuals whose plans would cause another Calidar-scale catastrophe. The Veiled Hand possesses the only complete documented account of the lich\'s true identity and origin — the Dominion warrior who carried Heaven\'s Atlas into Calidar, punished by a Dark Elven god, trapped in the Rift for five centuries. The Hand has not shared this information with the Adventure Guild. They are still assessing whether sharing it would help.',
    category: 'factions',
    seeAlso: ['heavens_atlas', 'adventure_guild', 'the_soldier'],
    unlockTrigger: 'book_discover:soldier_record_fragments'
  },
  {
    id: 'free_holds',
    term: 'Free Holds',
    definition: 'The anarcho-syndicalist dwarven labor federation of the western mountains of Fortuna — a network of autonomous underground holds that refused to sign the Helios Doctrine in Year -600 and have maintained that refusal ever since. The Free Holds are Fortuna\'s largest producers of refined metals and precision stonework. No imperial authority has successfully established a presence inside the holds. The empire stopped trying after a punitive expedition was annihilated in an event the official record calls "a training exercise with unexpectedly high attrition."',
    category: 'factions',
    seeAlso: ['dwarf_race', 'smelting', 'rift_compact'],
    unlockTrigger: null
  },
  {
    id: 'khanate',
    term: 'Steppe Khanate (Fragmented)',
    definition: 'The orcish confederation of Fortuna\'s northern steppes, once the most powerful military force on the continent under Great Khan Morghul. The Khan died in Year -45 with his succession clause unfinished, fragmenting the Khanate into competing clan alliances. The Dominion has worked deliberately to ensure no new Khan can be legitimately named. The clan-moots continue. The memory of unity continues. What the clans are building toward, in the long patience of people who live three to five centuries, is not visible yet.',
    category: 'factions',
    seeAlso: ['orc_race', 'rift_compact'],
    unlockTrigger: null
  },
  {
    id: 'gnomish_collective',
    term: 'Gnomish Collective',
    definition: 'The industrial state of the eastern archipelago of Fortuna, governed by the Synthesis Council. The Collective has been withdrawing from Fortuna\'s continental affairs since Year 120, building Phase Three — a contingency plan of unknown scope that appears to be approaching activation. The Collective produces the world\'s most advanced engineering and is the leading authority on Rift energy signatures. What they detected that triggered the Phase Three update, they have shared with no one outside the Council.',
    category: 'factions',
    seeAlso: ['gnome_race', 'crafting_skills'],
    unlockTrigger: null
  },
  {
    id: 'goblin_resistance',
    term: 'Goblin Resistance',
    definition: 'A decentralized intelligence and guerrilla network spanning every nation on Fortuna, active for over five hundred years. The Resistance was forged from extermination campaigns and has evolved into the most sophisticated covert operation on the continent. The Dominion classifies goblins as vermin in official documents. The Resistance\'s files on Dominion officials, updated quarterly, would destabilize three different Cardinal families if published simultaneously.',
    category: 'factions',
    seeAlso: ['goblin_race', 'veiled_hand', 'coins'],
    unlockTrigger: 'book_discover:history_great_khan'
  },

  // ─────────────────────── COMBAT RESOURCES (4) ──────────────────────
  {
    id: 'mana',
    term: 'Mana',
    definition: 'Arcane energy channeled through study and willpower. Mana regenerates passively each turn and fuels all spellcasting, healing, and enchantment abilities. Elves and Gnomes have an innate affinity for mana, starting with a larger pool.',
    category: 'combat',
    seeAlso: ['stamina', 'bloodlust', 'focus', 'hit_points'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'stamina',
    term: 'Stamina',
    definition: 'Physical endurance that regenerates steadily each turn. Stamina powers melee strikes, shield abilities, and feats of physical prowess. Dwarves and Cat Folk draw deeply from this well of vitality.',
    category: 'combat',
    seeAlso: ['mana', 'bloodlust', 'focus'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'bloodlust',
    term: 'Bloodlust',
    definition: 'Predatory energy that surges with each enemy slain. Bloodlust does not regenerate naturally — it must be earned through kills. Without fresh blood, it decays rapidly. Orcs and Goblins thrive on this primal resource, fueling berserker rages and devastating burst attacks.',
    category: 'combat',
    seeAlso: ['mana', 'stamina', 'focus'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'focus',
    term: 'Focus',
    definition: 'Mental concentration built through sustained engagement with a single target. Each consecutive action on the same foe deepens focus, empowering stealth techniques, precision strikes, and tactical abilities. Switching targets disrupts this concentration. Humans and Lizard Folk excel at maintaining focus.',
    category: 'combat',
    seeAlso: ['mana', 'stamina', 'bloodlust'],
    unlockTrigger: 'dungeon_enter'
  },

  // ─────────────────────── RIFT SCARS (1) ────────────────────────────
  {
    id: 'rift_scar',
    term: 'Rift Scar',
    definition: 'Random modifications found on items recovered from the Rift. Prolonged exposure to Rift energy warps equipment in unpredictable ways, leaving "scars" that grant additional power — or strange side effects. Rarer items bear more scars. Prefix scars enhance offense; suffix scars bolster defense.',
    category: 'cards',
    seeAlso: ['rift_dungeon', 'card_rarity'],
    unlockTrigger: 'dungeon_enter'
  },

  // ─────────────────────── AWAKENINGS (1) ────────────────────────────
  {
    id: 'awakening',
    term: 'Awakening',
    definition: 'A transformative milestone ability unlocked at levels 25 and 50. Prolonged exposure to Rift energy awakens latent potential in seasoned adventurers. Each Awakening requires a minimum of 40 points in a specific stat and offers a choice between mutually exclusive paths of power.',
    category: 'progression',
    seeAlso: ['skill_level', 'rift_dungeon'],
    unlockTrigger: null
  },

  // ─────────────────────── STATUS CATEGORIES (3) ─────────────────────
  {
    id: 'physical_debuff',
    term: 'Physical Debuff',
    definition: 'Status effects rooted in the body: bleeding, burning, poisoning, freezing, and constriction. Physical debuffs can be removed by the Tourniquet ability or abilities that cleanse physical conditions.',
    category: 'combat',
    seeAlso: ['mental_debuff', 'magical_debuff'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'mental_debuff',
    term: 'Mental Debuff',
    definition: 'Status effects targeting the mind: stun, fear, confusion, charm, and silence. Mental debuffs can be broken by a Rally Cry or other mental-cleansing abilities.',
    category: 'combat',
    seeAlso: ['physical_debuff', 'magical_debuff'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'magical_debuff',
    term: 'Magical Debuff',
    definition: 'Status effects of arcane origin: curses, hexes, mana burns, runic marks, and drains. Magical debuffs require Purify or similar magical cleansing to remove.',
    category: 'combat',
    seeAlso: ['physical_debuff', 'mental_debuff'],
    unlockTrigger: 'dungeon_enter'
  },

  // ─────────────────────── SIGIL SATURATION (1) ──────────────────────
  {
    id: 'sigil_saturation',
    term: 'Sigil Saturation',
    definition: 'A stacking penalty that occurs when the same type of sigil is used repeatedly in quick succession. Each cast of a sigil ability while another sigil of the same type is still active increases the cooldown of subsequent sigil uses. The Sigil Mastery passive reduces saturation buildup.',
    category: 'combat',
    seeAlso: ['card_rarity'],
    unlockTrigger: 'dungeon_enter'
  },

  // ─────────────────────── RESOURCE ATTUNEMENT (1) ───────────────────
  {
    id: 'resource_attunement',
    term: 'Resource Attunement',
    definition: 'A rare passive card that expands a secondary combat resource pool by 25%. All characters can use all four resources, but non-primary pools start at half capacity. Attunement cards allow hybrid builds — an Orc can expand their mana pool to cast spells effectively, though it requires investment.',
    category: 'cards',
    seeAlso: ['mana', 'stamina', 'bloodlust', 'focus'],
    unlockTrigger: 'card_open_pack'
  },

  // ─────────────────────── LORE: THE SOLDIER & RIFT ORIGIN (5) ───────
  {
    id: 'the_soldier',
    term: 'The Soldier (The Atlas Warrior)',
    definition: 'The unnamed Dominion warrior sent to deploy Heaven\'s Atlas against Calidar in Year 0. Chosen personally by the Prophet-King, devout, decorated, and certain of his mission. He placed the Atlas at the city\'s heart and activated it. A High Elven god held his consciousness above Calidar as it burned. A Dark Elven god then implanted a binding artifact in his chest and sent him into the Rift with an impossible task: retrieve five divine souls from inside. He has been inside the Rift for five hundred years. He cannot die — fragments of five divine essences, one in each limb and one in his head, anchor him to existence. The Dominion classifies him as "the Primary Lich." He is not a lich. He is a man who did as he was told and has not stopped paying for it.',
    category: 'world',
    seeAlso: ['the_rift', 'heavens_atlas', 'calidar', 'five_souls', 'helios_sealed'],
    unlockTrigger: 'book_discover:soldier_record_fragments'
  },
  {
    id: 'five_souls',
    term: 'The Five Souls',
    definition: 'The divine task imposed on the Atlas soldier by the Dark Elven god who punished him: five divine souls trapped within the Rift must be retrieved. These were not human souls but deities — divine beings caught in the spatial tear the Atlas detonation created. The soldier spent subjective centuries inside the Rift hunting each one, dying in the attempt, resetting, dying again. He found the first on floor twenty-five. When all five were finally captured, the Dark Elven god took them back and left only fragments — implanted in the soldier\'s limbs and skull — as a permanent curse. The five fragments are why he cannot die and cannot be destroyed. They are also why his sliver-selves, when he pushes them through the widening Rift, carry a divine signature that no ordinary necromancer possesses.',
    category: 'world',
    seeAlso: ['the_soldier', 'the_rift', 'heavens_atlas'],
    unlockTrigger: 'book_discover:soldier_record_fragments'
  },
  {
    id: 'the_hollow',
    term: 'The Hollow (Rift Inhabitants)',
    definition: 'The creatures that populate the Rift\'s floors. They wear the shapes of known species — human, elven, orcish, goblin — with a fidelity that is immediately, profoundly wrong. Their eyes express nothing: active but empty, like light passing through a room where no one stands. They do not speak. They cannot be communicated with. They shift species between one step and the next without awareness of the change. Guild researchers believe they are not alive in any meaningful sense — not undead, not elemental, not magical constructs. They are shapes that the Rift generates to fill its floors, wearing the forms of the world outside as an echo wears a voice. The deeper the floor, the more convincing and dangerous they become.',
    category: 'world',
    seeAlso: ['the_rift', 'rift_dungeon', 'the_soldier'],
    unlockTrigger: 'dungeon_enter'
  },
  {
    id: 'magic_ban',
    term: 'The Magic Ban',
    definition: 'A sweeping prohibition on all unlicensed sorcery enacted by the Holy Dominion in Year 1, immediately after the Calidar destruction. Officially justified as prevention of another Heaven\'s Atlas-scale event. In practice, it ensures that no race can develop magical capability sufficient to challenge Dominion military supremacy. Violations are punishable by imprisonment or execution, with no appeal process. The Luminary Inquest enforces it with lethal authority. Exceptions exist for agricultural magic, Inquest-approved research licenses, and — through a carefully maintained legal gray zone — Adventure Guild Rift operations, which require magic but are too politically necessary to shut down entirely.',
    category: 'world',
    seeAlso: ['luminary_inquest', 'holy_dominion', 'heavens_atlas'],
    unlockTrigger: null
  },
  {
    id: 'vel_sharath',
    term: 'The Vel\'sharath',
    definition: 'A scholarly order of Elven and Dark Elven researchers active in Calidar before its destruction, whose name means "Those Who Seek the Light" in Old Elvish. The Dominion\'s official history mistranslates this as "The Void Covenant" or "The Hollow Circle." The Vel\'sharath were not summoners of darkness. They were scientists documenting the absence of the gods — mapping the dimming of sacred sites, measuring falling prayer-response rates, and ultimately discovering that Helios was not enthroned in heaven but imprisoned below the Dominion\'s capital. They used a device called the Lesser Lens — a divine-origin artifact — to amplify divine resonance and send a signal outward, toward wherever the gods had gone. The Dominion destroyed Calidar to prevent this discovery from becoming public. The Vel\'sharath and the Dark Elven Reclamation Sect were two distinct groups in the same city. The Atlas killed both.',
    category: 'world',
    seeAlso: ['calidar', 'heavens_atlas', 'dark_elf_lore', 'helios_sealed', 'reclamation_sect'],
    unlockTrigger: 'book_discover:covenant_fragment_1'
  },
  {
    id: 'reclamation_sect',
    term: 'The Dark Elven Reclamation Sect',
    definition: 'A small but growing movement within Calidar\'s Dark Elven population in the centuries before Year 0. Distinct from the Vel\'sharath, the Sect sought not to find absent gods but to petition their own gods for divine intervention against the expanding Holy Dominion — a "righteous correction of human arrogance," as internal documents phrase it. The Sect reached out through ritual channels. The Dominion had been intercepting and disrupting divine communications for decades and had been reading the Sect\'s signals. The Dominion used the Sect\'s activities as justification for deploying Heaven\'s Atlas. The Sect was, at most, a few hundred individuals within a city of hundreds of thousands. The Atlas killed everyone.',
    category: 'world',
    seeAlso: ['calidar', 'dark_elf_lore', 'heavens_atlas', 'vel_sharath'],
    unlockTrigger: 'book_discover:two_movements_calidar'
  },
];

// ─────────────────────────── Query Functions ──────────────────────────

/**
 * Look up a single glossary term by its string id.
 * @param {string} id - The term's unique identifier.
 * @returns {object|null} The term object, or null if not found.
 */
function getTerm(id) {
  if (!id) return null;
  for (let i = 0; i < GLOSSARY_TERMS.length; i++) {
    if (GLOSSARY_TERMS[i].id === id) return GLOSSARY_TERMS[i];
  }
  return null;
}

/**
 * Return all glossary terms belonging to a given category.
 * @param {string} cat - The category name (e.g. 'combat', 'cards').
 * @returns {object[]} Array of matching term objects (empty if none match).
 */
function getTermsByCategory(cat) {
  if (!cat) return [];
  const lowerCat = cat.toLowerCase();
  return GLOSSARY_TERMS.filter(t => t.category === lowerCat);
}

/**
 * Search term names and definitions for a query string (case-insensitive).
 * @param {string} query - The search string.
 * @returns {object[]} Array of matching term objects.
 */
function searchTerms(query) {
  if (!query) return [];
  const lower = query.toLowerCase();
  return GLOSSARY_TERMS.filter(t =>
    t.term.toLowerCase().includes(lower) ||
    t.definition.toLowerCase().includes(lower)
  );
}

/**
 * Return all terms that should be revealed by a given unlock trigger.
 * Pass null to get terms available from the start.
 * @param {string|null} trigger - The trigger string, or null for starter terms.
 * @returns {object[]} Array of matching term objects.
 */
function getTermsForTrigger(trigger) {
  return GLOSSARY_TERMS.filter(t => t.unlockTrigger === trigger);
}

module.exports = {
  GLOSSARY_TERMS,
  getTerm,
  getTermsByCategory,
  searchTerms,
  getTermsForTrigger
};
