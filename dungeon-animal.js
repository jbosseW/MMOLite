// dungeon-animal.js
// Animal morphing system — form-gated interactables and ambient dungeon animals.
// Extracted from dungeon-data.js. Pure data + functions that only reference their
// own tables, except generateFormInteractables/generateAnimalNpcs which receive
// a TILE constant via the init() binding (avoids circular require).

// ---------------------------------------------------------------------------
// Form-gated interactable features (animal morphing exploration)
// ---------------------------------------------------------------------------

var FORM_INTERACTABLES = {
  cracked_wall: {
    name: 'Cracked Wall',
    description: 'A wall with deep fractures. Something strong could break through.',
    requiredAbility: 'canBreakWalls',
    alternateAbility: 'canDig',
    result: 'passage',
    icon: 'cracked_wall',
    placement: 'wall_adjacent',
  },
  small_hole: {
    name: 'Small Hole',
    description: 'A tiny opening in the wall. Only something very small could fit.',
    requiredAbility: 'canFitSmallHoles',
    alternateAbility: null,
    result: 'passage',
    icon: 'small_hole',
    placement: 'wall_adjacent',
  },
  locked_grate: {
    name: 'Locked Grate',
    description: 'A heavy iron grate blocks this passage. Something might fit underneath.',
    requiredAbility: 'canCrawlUnderDoors',
    alternateAbility: 'canForceOpenDoors',
    result: 'passage',
    icon: 'grate',
    placement: 'room_edge',
  },
  high_ledge: {
    name: 'High Ledge',
    description: 'A ledge far above. Only something that can fly or climb could reach it.',
    requiredAbility: 'canFly',
    alternateAbility: 'canClimbWalls',
    result: 'treasure_room',
    icon: 'ledge',
    placement: 'room_edge',
  },
  deep_pool: {
    name: 'Deep Pool',
    description: 'Dark water fills this passage. Something aquatic could explore below.',
    requiredAbility: 'canSwimDeep',
    alternateAbility: 'canSwim',
    result: 'underwater_passage',
    icon: 'pool',
    placement: 'room_interior',
  },
  gap_chasm: {
    name: 'Wide Chasm',
    description: 'A yawning gap in the floor. Only something that can fly or bridge it could cross.',
    requiredAbility: 'canFly',
    alternateAbility: 'canWebBridge',
    result: 'passage',
    icon: 'chasm',
    placement: 'room_edge',
  },
  ceiling_vent: {
    name: 'Ceiling Vent',
    description: 'A narrow vent shaft in the ceiling. Small creatures could squeeze through.',
    requiredAbility: 'canAccessVents',
    alternateAbility: null,
    result: 'passage',
    icon: 'vent',
    placement: 'wall_adjacent',
  },
  rubble_pile: {
    name: 'Rubble Pile',
    description: 'Collapsed stonework. Something could dig through or push it aside.',
    requiredAbility: 'canDig',
    alternateAbility: 'canPushBoulders',
    result: 'passage',
    icon: 'rubble',
    placement: 'room_interior',
  },
  boulder: {
    name: 'Heavy Boulder',
    description: 'A massive boulder blocks the path. Only immense strength could move it.',
    requiredAbility: 'canPushBoulders',
    alternateAbility: null,
    result: 'passage',
    icon: 'boulder',
    placement: 'room_interior',
  },
  soft_ground: {
    name: 'Soft Earth',
    description: 'The ground here is soft and loose. Something could burrow through.',
    requiredAbility: 'canBurrow',
    alternateAbility: 'canDig',
    result: 'underground_passage',
    icon: 'dirt',
    placement: 'room_interior',
  },
};

var FORM_INTERACTABLE_KEYS = Object.keys(FORM_INTERACTABLES);

// Theme to weighted interactable preferences (themes favor certain interactables)
var THEME_FORM_INTERACTABLE_WEIGHTS = {
  coral_grotto:     { deep_pool: 5, gap_chasm: 1, small_hole: 1 },
  flooded_ruins:    { deep_pool: 4, locked_grate: 2, rubble_pile: 1 },
  crystal_cavern:   { cracked_wall: 3, high_ledge: 2, boulder: 2 },
  fungal_forest:    { small_hole: 3, soft_ground: 3, rubble_pile: 1 },
  lava_rift:        { gap_chasm: 4, cracked_wall: 2, boulder: 1 },
  frozen_depths:    { cracked_wall: 3, gap_chasm: 2, high_ledge: 2 },
  bone_yard:        { soft_ground: 3, rubble_pile: 3, cracked_wall: 1 },
  shadow_realm:     { ceiling_vent: 3, gap_chasm: 3, locked_grate: 1 },
  overgrown_temple: { small_hole: 2, rubble_pile: 3, soft_ground: 2 },
  clockwork_maze:   { locked_grate: 4, ceiling_vent: 3, boulder: 1 },
  sand_tomb:        { soft_ground: 4, cracked_wall: 2, rubble_pile: 1 },
  stone_keep:       { cracked_wall: 3, locked_grate: 2, high_ledge: 2 },
  grand_hall:       { high_ledge: 3, locked_grate: 2, cracked_wall: 2 },
  armory_vault:     { locked_grate: 4, boulder: 2, cracked_wall: 1 },
  throne_dungeon:   { locked_grate: 3, high_ledge: 3, ceiling_vent: 1 },
  catacombs:        { small_hole: 3, soft_ground: 2, rubble_pile: 2 },
  floating_islands: { gap_chasm: 5, high_ledge: 3 },
  void_debris:      { gap_chasm: 3, cracked_wall: 2, ceiling_vent: 2 },
  ancient_library:  { small_hole: 2, locked_grate: 3, ceiling_vent: 2 },
};

// Select a weighted random interactable type for a theme
function selectFormInteractable(theme, rng) {
  var weights = THEME_FORM_INTERACTABLE_WEIGHTS[theme];
  if (!weights) {
    // Default uniform random from all types
    return FORM_INTERACTABLE_KEYS[Math.floor(rng() * FORM_INTERACTABLE_KEYS.length)];
  }
  var keys = Object.keys(weights);
  var totalWeight = 0;
  for (var i = 0; i < keys.length; i++) totalWeight += weights[keys[i]];
  var roll = rng() * totalWeight;
  var cumulative = 0;
  for (var j = 0; j < keys.length; j++) {
    cumulative += weights[keys[j]];
    if (roll < cumulative) return keys[j];
  }
  return keys[keys.length - 1];
}

// ---------------------------------------------------------------------------
// Dungeon animal NPCs — theme-based ambient animals
// ---------------------------------------------------------------------------

var DUNGEON_ANIMALS = {
  stone_keep:        ['rat', 'bat', 'spider'],
  grand_hall:        ['rat', 'bat', 'cat'],
  armory_vault:      ['rat', 'spider', 'bat'],
  throne_dungeon:    ['rat', 'cat', 'bat', 'snake'],
  catacombs:         ['bat', 'spider', 'rat', 'snake'],
  crystal_cavern:    ['bat', 'spider', 'snake'],
  fungal_forest:     ['spider', 'snake', 'frog', 'rat'],
  lava_rift:         ['bat', 'snake', 'lizard'],
  frozen_depths:     ['wolf', 'owl', 'bat'],
  flooded_ruins:     ['fish', 'turtle', 'frog', 'crab'],
  floating_islands:  ['eagle', 'hawk', 'owl', 'bat'],
  bone_yard:         ['wolf', 'rat', 'bat', 'snake'],
  shadow_realm:      ['bat', 'spider', 'owl', 'snake'],
  overgrown_temple:  ['spider', 'snake', 'parrot', 'monkey'],
  clockwork_maze:    ['rat', 'spider', 'bat'],
  sand_tomb:         ['snake', 'scorpion', 'lizard', 'hawk'],
  coral_grotto:      ['fish', 'turtle', 'eel', 'crab'],
  void_debris:       ['bat', 'spider', 'owl'],
  ancient_library:   ['rat', 'owl', 'cat', 'spider'],
};

// Map animal types to the canAnimalSpeak categories they belong to
var ANIMAL_SPEAK_CATEGORIES = {
  rat:       [],
  bat:       [],
  wolf:      ['wolf', 'dog', 'hound'],
  bear:      ['bear'],
  cat:       ['cat', 'lion', 'panther'],
  dog:       ['dog', 'wolf', 'hound'],
  hound:     ['dog', 'wolf', 'hound'],
  fish:      ['fish', 'aquatic'],
  turtle:    ['turtle', 'tortoise', 'reptile'],
  eagle:     ['bird', 'eagle', 'hawk'],
  hawk:      ['bird', 'eagle', 'hawk'],
  owl:       ['bird', 'owl'],
  spider:    ['spider', 'insect'],
  snake:     ['snake', 'serpent', 'reptile'],
  serpent:   ['snake', 'serpent', 'reptile'],
  frog:      ['aquatic'],
  crab:      ['aquatic'],
  eel:       ['fish', 'aquatic'],
  lizard:    ['snake', 'serpent', 'reptile'],
  scorpion:  ['spider', 'insect'],
  parrot:    ['bird'],
  monkey:    [],
  deer:      [],
  rabbit:    [],
  fox:       [],
  mountain_goat: [],
  penguin:   ['bird'],
  heron:     ['bird'],
};

// ---------------------------------------------------------------------------
// Animal dialogue templates — short hints about the current dungeon floor
// ---------------------------------------------------------------------------

var ANIMAL_DIALOGUES = {
  wolf: {
    greetings: [
      "The wolf regards you with knowing eyes. 'Pack-brother, the den to the north holds danger.'",
      "A low growl of recognition. 'Humans passed through here recently. They smelled of iron and fear.'",
      "'The alpha fell to the shadow creatures. Avenge us, and the pack will remember.'",
    ],
    hints: [
      'The wolf sniffs the air and turns east. Something important lies that way.',
      'The wolf paws at a spot on the ground. There may be something buried nearby.',
      'The wolf whines softly and glances at a cracked section of wall.',
    ],
  },
  bat: {
    greetings: [
      "The bat clicks rapidly, sharing echoes of the cave's shape with you.",
      "A friendly bat settles on your shoulder. Its echolocation pulses reveal hidden spaces.",
    ],
    hints: [
      'The bat flutters toward the ceiling. A vent shaft is hidden above.',
      'The bat avoids a particular corridor. Danger lurks that way.',
      'The bat squeaks excitedly near a wall. Something is concealed behind it.',
    ],
  },
  rat: {
    greetings: [
      "The rat twitches its whiskers at you. It seems oddly calm.",
      "A plump rat eyes you without fear. It knows every crack in these walls.",
    ],
    hints: [
      'The rat scurries toward a tiny hole in the wall. A shortcut, perhaps.',
      'The rat avoids a section of floor. Traps, most likely.',
      'The rat chitters and points its nose toward a pile of rubble.',
    ],
  },
  cat: {
    greetings: [
      "The cat purrs and rubs against your legs. It has been here a long time.",
      "A sleek cat blinks slowly at you. An old friend in a dark place.",
    ],
    hints: [
      'The cat leaps onto a high ledge effortlessly. There is a path up there.',
      'The cat hisses at a doorway. Something dangerous waits beyond.',
      'The cat kneads a soft patch of ground. Something valuable is buried here.',
    ],
  },
  spider: {
    greetings: [
      "The spider waves a leg in greeting. Its web glints with reflected light.",
      "A large spider descends on a thread. It seems more curious than hostile.",
    ],
    hints: [
      'The spider weaves a thread toward a gap in the floor. It could be bridged.',
      'The spider taps the wall rapidly. A hidden passage lies beyond.',
      'The spider avoids a particular web. Another creature has claimed that territory.',
    ],
  },
  snake: {
    greetings: [
      "The serpent tastes the air with its tongue. 'You speak our language, warm-blood.'",
      "A coiled snake raises its head. 'Few can hear us. What do you seek?'",
    ],
    hints: [
      'The snake slithers toward a patch of soft earth. A tunnel could be dug here.',
      'The snake flicks its tongue toward a pool of water. Something waits below.',
      'The snake coils away from a corridor. Poison gas, or worse.',
    ],
  },
  owl: {
    greetings: [
      "The owl hoots softly. Its ancient eyes have seen every shadow in this place.",
      "'Who?' the owl asks. Then, recognizing you: 'Ah. A friend in the dark.'",
    ],
    hints: [
      'The owl turns its head toward a distant room. Treasure lies that way.',
      'The owl ruffles its feathers at a particular door. Best avoided.',
      'The owl blinks deliberately. The stairs down are closer than you think.',
    ],
  },
  fish: {
    greetings: [
      "The fish surfaces and blows a bubble at you. A greeting, perhaps.",
      "A shimmering fish circles in the pool. It knows these waters well.",
    ],
    hints: [
      'The fish dives deep and surfaces at the far end. An underwater passage connects them.',
      'The fish avoids a murky section of water. Something lurks below.',
      'The fish circles a sunken object. There is treasure at the bottom.',
    ],
  },
  turtle: {
    greetings: [
      "The turtle withdraws, then slowly re-emerges. 'Patience,' it seems to say.",
      "An ancient turtle blinks at you. It has outlived everything else here.",
    ],
    hints: [
      'The turtle paddles toward deep water. A safe passage lies beneath.',
      'The turtle tucks into its shell near a doorway. Danger approaches from that direction.',
      'The turtle nudges a loose stone. Something is hidden behind the wall.',
    ],
  },
  eagle: {
    greetings: [
      "The eagle shrieks a greeting. Even underground, its spirit soars.",
      "A proud eagle regards you from its perch. It has scouted far ahead.",
    ],
    hints: [
      'The eagle spreads its wings toward a high ledge. Treasure awaits above.',
      'The eagle dips its head away from a passage. Enemies gather there.',
      'The eagle cries sharply. The exit is near.',
    ],
  },
  hawk: {
    greetings: [
      "The hawk tilts its head, studying you with sharp eyes.",
    ],
    hints: [
      'The hawk circles above, then dives toward a distant room. Something valuable lies there.',
      'The hawk screeches a warning. Danger is close.',
    ],
  },
  frog: {
    greetings: [
      "The frog croaks at you from atop a rock. It seems friendly enough.",
    ],
    hints: [
      'The frog leaps toward a pool. There may be an underwater shortcut.',
      'The frog avoids a puddle. That water is not safe.',
    ],
  },
  crab: {
    greetings: [
      "The crab clicks its claws in greeting. It shuffles sideways to face you.",
    ],
    hints: [
      'The crab digs into the sand near a wall. Something is buried there.',
      'The crab retreats from an opening. The current beyond is too strong.',
    ],
  },
  eel: {
    greetings: [
      "The eel surfaces briefly, its body crackling with faint electricity.",
    ],
    hints: [
      'The eel vanishes into a narrow underwater channel. A hidden path.',
      'The eel avoids a particular pool. Something dangerous inhabits it.',
    ],
  },
  lizard: {
    greetings: [
      "The lizard bobs its head at you. A simple but sincere greeting.",
    ],
    hints: [
      'The lizard basks on a warm stone near a crack in the wall. Something lies beyond.',
      'The lizard scurries away from a tunnel. Best to heed its warning.',
    ],
  },
  scorpion: {
    greetings: [
      "The scorpion raises its tail, then lowers it. A gesture of non-aggression.",
    ],
    hints: [
      'The scorpion burrows into soft ground. A passage could be dug here.',
      'The scorpion circles a floor tile. A trap is concealed beneath.',
    ],
  },
  parrot: {
    greetings: [
      "'Hello! Hello!' the parrot squawks. It mimics sounds from deeper in the dungeon.",
    ],
    hints: [
      'The parrot repeats a grinding sound. Something mechanical is nearby.',
      'The parrot flies toward a high vent and perches. An exit route.',
    ],
  },
  monkey: {
    greetings: [
      "The monkey chatters and offers you a shiny pebble. A peace offering.",
    ],
    hints: [
      'The monkey points toward a ledge and pantomimes climbing. Treasure is up there.',
      'The monkey covers its ears near a doorway. Loud and dangerous things beyond.',
    ],
  },
};

// Default fallback dialogues for animals without specific entries
var ANIMAL_DIALOGUE_DEFAULT = {
  greetings: [
    'The creature regards you calmly. It senses you are kindred.',
  ],
  hints: [
    'The creature glances in a direction and then back at you. Something of interest lies that way.',
    'The creature shifts uneasily. Danger is nearby.',
  ],
};

// Generate animal dialogue for a specific animal on a floor
function getAnimalDialogue(animalType, floor, rng) {
  var dialogues = ANIMAL_DIALOGUES[animalType] || ANIMAL_DIALOGUE_DEFAULT;
  var greetingPool = dialogues.greetings || ANIMAL_DIALOGUE_DEFAULT.greetings;
  var hintPool = dialogues.hints || ANIMAL_DIALOGUE_DEFAULT.hints;
  var greeting = greetingPool[Math.floor(rng() * greetingPool.length)];
  var hint = hintPool[Math.floor(rng() * hintPool.length)];
  return { greeting: greeting, hint: hint };
}

// ---------------------------------------------------------------------------
// Generate form interactables for a floor (called during generateFloor)
// TILE is passed in via init() to avoid circular require with dungeon-data.
// ---------------------------------------------------------------------------

var _TILE = null;

function init(TILE) {
  _TILE = TILE;
}

function generateFormInteractables(floor, rng) {
  var interactables = [];
  // Only floors 2+ get form interactables
  if (floor.floorNum < 2) return interactables;
  // Boss floors do not get form interactables (keep them clean for the fight)
  if (floor.isBossFloor) return interactables;

  // 1-3 interactables per floor
  var count = 1 + Math.floor(rng() * 3);
  var usedPositions = {};
  var placedTypes = {};

  for (var i = 0; i < count; i++) {
    var type = selectFormInteractable(floor.theme, rng);
    // Avoid duplicate types on same floor
    if (placedTypes[type]) {
      type = selectFormInteractable(floor.theme, rng);
      if (placedTypes[type]) continue; // skip if still duplicate
    }
    placedTypes[type] = true;

    var def = FORM_INTERACTABLES[type];
    if (!def) continue;

    // Find a valid placement position
    var placed = false;
    var attempts = 0;
    var maxAttempts = 30;

    while (!placed && attempts < maxAttempts) {
      attempts++;
      // Pick a room (not first room, not last room on boss floors)
      var roomIdx = 1 + Math.floor(rng() * (floor.rooms.length - 1));
      if (roomIdx >= floor.rooms.length) roomIdx = floor.rooms.length - 1;
      var rm = floor.rooms[roomIdx];

      var px, py;

      if (def.placement === 'wall_adjacent') {
        // Place adjacent to a wall tile inside the room
        // Pick a position on the room perimeter (one tile inside)
        var side = Math.floor(rng() * 4);
        if (side === 0) { px = rm.x; py = rm.y + 1 + Math.floor(rng() * Math.max(1, rm.h - 2)); }
        else if (side === 1) { px = rm.x + rm.w - 1; py = rm.y + 1 + Math.floor(rng() * Math.max(1, rm.h - 2)); }
        else if (side === 2) { px = rm.x + 1 + Math.floor(rng() * Math.max(1, rm.w - 2)); py = rm.y; }
        else { px = rm.x + 1 + Math.floor(rng() * Math.max(1, rm.w - 2)); py = rm.y + rm.h - 1; }
      } else if (def.placement === 'room_edge') {
        // Place at room edge (entrance/exit area)
        var edge = Math.floor(rng() * 4);
        if (edge === 0) { px = rm.x + Math.floor(rm.w / 2); py = rm.y; }
        else if (edge === 1) { px = rm.x + Math.floor(rm.w / 2); py = rm.y + rm.h - 1; }
        else if (edge === 2) { px = rm.x; py = rm.y + Math.floor(rm.h / 2); }
        else { px = rm.x + rm.w - 1; py = rm.y + Math.floor(rm.h / 2); }
      } else {
        // room_interior
        px = rm.x + 1 + Math.floor(rng() * Math.max(1, rm.w - 2));
        py = rm.y + 1 + Math.floor(rng() * Math.max(1, rm.h - 2));
      }

      // Bounds check
      if (px < 0 || px >= floor.width || py < 0 || py >= floor.height) continue;
      // Must be on a floor tile (not stairs, chest, trap, etc.)
      if (floor.grid[py][px] !== _TILE.FLOOR) continue;
      // No duplicate positions
      var posKey = px + ',' + py;
      if (usedPositions[posKey]) continue;

      usedPositions[posKey] = true;
      interactables.push({
        id: 'fi_' + floor.floorNum + '_' + i,
        type: type,
        name: def.name,
        description: def.description,
        requiredAbility: def.requiredAbility,
        alternateAbility: def.alternateAbility || null,
        result: def.result,
        icon: def.icon,
        x: px,
        y: py,
        roomIndex: roomIdx,
        explored: false,
      });
      placed = true;
    }
  }

  return interactables;
}

// ---------------------------------------------------------------------------
// Generate animal NPCs for a floor
// ---------------------------------------------------------------------------

function generateAnimalNpcs(floor, rng) {
  var animalNpcs = [];
  // Animal NPCs can appear on any floor
  var animalPool = DUNGEON_ANIMALS[floor.theme];
  if (!animalPool || animalPool.length === 0) return animalNpcs;

  // 0-2 animals per floor
  var count = Math.floor(rng() * 3); // 0, 1, or 2
  if (count === 0) return animalNpcs;

  var usedPositions = {};

  for (var i = 0; i < count; i++) {
    var animalType = animalPool[Math.floor(rng() * animalPool.length)];
    var dialogue = getAnimalDialogue(animalType, floor, rng);
    var speakCategories = ANIMAL_SPEAK_CATEGORIES[animalType] || [];

    // Find placement in a non-first room
    var placed = false;
    var attempts = 0;
    while (!placed && attempts < 20) {
      attempts++;
      var roomIdx = 1 + Math.floor(rng() * (floor.rooms.length - 1));
      if (roomIdx >= floor.rooms.length) roomIdx = floor.rooms.length - 1;
      var rm = floor.rooms[roomIdx];
      var ax = rm.x + 1 + Math.floor(rng() * Math.max(1, rm.w - 2));
      var ay = rm.y + 1 + Math.floor(rng() * Math.max(1, rm.h - 2));

      if (ax < 0 || ax >= floor.width || ay < 0 || ay >= floor.height) continue;
      if (floor.grid[ay][ax] !== _TILE.FLOOR) continue;
      var posKey = ax + ',' + ay;
      if (usedPositions[posKey]) continue;

      usedPositions[posKey] = true;
      animalNpcs.push({
        id: 'animal_' + floor.floorNum + '_' + i,
        animalType: animalType,
        name: animalType.charAt(0).toUpperCase() + animalType.slice(1),
        speakCategories: speakCategories,
        dialogue: dialogue,
        x: ax,
        y: ay,
        roomIndex: roomIdx,
        interacted: false,
      });
      placed = true;
    }
  }

  return animalNpcs;
}

module.exports = {
  // Init (bind TILE constant from dungeon-data)
  init,

  // Form interactables
  FORM_INTERACTABLES,
  FORM_INTERACTABLE_KEYS,
  THEME_FORM_INTERACTABLE_WEIGHTS,
  selectFormInteractable,
  generateFormInteractables,

  // Animal NPCs
  DUNGEON_ANIMALS,
  ANIMAL_SPEAK_CATEGORIES,
  ANIMAL_DIALOGUES,
  ANIMAL_DIALOGUE_DEFAULT,
  getAnimalDialogue,
  generateAnimalNpcs,
};
