// combat-status-effects.js
// Per-turn status effect ticking and exhaustion damage.
// Extracted from dungeon-combat.js — dungeon-combat.js re-exports all names for backward compatibility.

var rpgData = require('./rpg-data');
var combatPassives = require('./combat-passive-helpers');
var combatGrid = require('./combat-grid');

var getUnitCombatPassive = combatPassives.getUnitCombatPassive;
var hasImmunity = combatPassives.hasImmunity;
var manhattanDist = combatGrid.manhattanDist;

var handleUnitDeath, getUnitsInRadius;

function init(deps) {
  handleUnitDeath = deps.handleUnitDeath;
  getUnitsInRadius = deps.getUnitsInRadius;
}

var EXHAUSTION_START        = 12;
var EXHAUSTION_START_BOSS   = 20;
var EXHAUSTION_PER_TURN     = 5;

/**
 * Tick status effects for a unit at end of their turn.
 * Applies tick damage and decrements durations.
 */
function tickStatusEffects(combat, unit) {
  if (!unit.statusEffects || unit.statusEffects.length === 0) return;

  var remaining = [];
  for (var i = 0; i < unit.statusEffects.length; i++) {
    var effect = unit.statusEffects[i];

    // Apply tick damage
    if (effect.tickDamage && effect.tickDamage > 0 && unit.alive) {
      // Check poison immunity before applying poison tick damage
      if (effect.name === 'poisoned' && hasImmunity(unit, 'poison')) {
        // Immune to poison — skip tick damage and remove effect
        continue; // Don't add to remaining, effectively removing it
      }
      unit.hp -= effect.tickDamage;
      if (unit.hp <= 0) {
        unit.alive = false;
        unit.hp = 0;
        handleUnitDeath(combat, unit.id, effect.sourceId || null);
      }

      // Broadcast status tick
      if (combat.callbacks.broadcastToFloor) {
        combat.callbacks.broadcastToFloor('tc_combat_status_tick', {
          combatId: combat.id,
          unitId: unit.id,
          effectName: effect.name || 'unknown',
          effectCategory: rpgData.getStatusEffectCategory(effect.name || 'unknown'),
          tickDamage: effect.tickDamage,
          unitHp: Math.max(0, unit.hp),
          unitMaxHp: unit.maxHp,
        });
      }
    }

    // --- Healing Resonance HoT: heal per turn from heal_resonance buff ---
    if (effect.name === 'healing_resonance' && effect.healPerTurn && effect.healPerTurn > 0 && unit.alive) {
      var hotOldHp = unit.hp;
      var hotHealAmt = effect.healPerTurn;

      // --- Support Passive: Dissonance — enemies near the HoT source have reduced healing ---
      if (effect.sourceId) {
        var hotSource = combat.units.get(effect.sourceId);
        if (hotSource) {
          var dissoNearby = getUnitsInRadius(combat, unit.x, unit.y, 3);
          for (var dsi = 0; dsi < dissoNearby.length; dsi++) {
            var dissoUnit = dissoNearby[dsi];
            if (dissoUnit.type === unit.type || !dissoUnit.alive) continue;
            var dissoPassive = getUnitCombatPassive(dissoUnit, 'dissonance');
            if (dissoPassive) {
              var dissoRange = dissoPassive.range || 3;
              if (manhattanDist(unit.x, unit.y, dissoUnit.x, dissoUnit.y) <= dissoRange) {
                hotHealAmt = Math.max(1, Math.floor(hotHealAmt * (1 - (dissoPassive.healReduction || 0.25))));
                break;
              }
            }
          }
        }
      }

      unit.hp = Math.min(unit.maxHp, unit.hp + hotHealAmt);
      var hotActual = unit.hp - hotOldHp;
      if (hotActual > 0 && combat.callbacks.broadcastToFloor) {
        combat.callbacks.broadcastToFloor('tc_combat_status_tick', {
          combatId: combat.id,
          unitId: unit.id,
          effectName: 'healing_resonance',
          effectCategory: rpgData.getStatusEffectCategory('healing_resonance'),
          healAmount: hotActual,
          unitHp: unit.hp,
          unitMaxHp: unit.maxHp,
        });
      }
    }

    // --- Animal Form per-turn effects ---
    if (effect.animalForm && unit.alive) {
      // HP regen from form (turtle form +5% per turn)
      if (effect.hpRegenPercent && effect.hpRegenPercent > 0) {
        var afRegenAmt = Math.max(1, Math.floor(unit.maxHp * effect.hpRegenPercent));
        var afOldHp = unit.hp;
        unit.hp = Math.min(unit.maxHp, unit.hp + afRegenAmt);
        var afActualRegen = unit.hp - afOldHp;
        if (afActualRegen > 0 && combat.callbacks.broadcastToFloor) {
          combat.callbacks.broadcastToFloor('tc_combat_status_tick', {
            combatId: combat.id, unitId: unit.id,
            effectName: effect.animalForm + '_form_regen',
            effectCategory: rpgData.getStatusEffectCategory(effect.animalForm + '_form_regen'),
            healAmount: afActualRegen, unitHp: unit.hp, unitMaxHp: unit.maxHp,
          });
        }
      }
      // Natural Attunement passive: +2% HP regen while in any animal form
      var natAttune = getUnitCombatPassive(unit, 'natural_attunement');
      if (natAttune && natAttune.formHpRegen) {
        var naRegenAmt = Math.max(1, Math.floor(unit.maxHp * natAttune.formHpRegen));
        var naOldHp = unit.hp;
        unit.hp = Math.min(unit.maxHp, unit.hp + naRegenAmt);
        var naActualRegen = unit.hp - naOldHp;
        if (naActualRegen > 0 && combat.callbacks.broadcastToFloor) {
          combat.callbacks.broadcastToFloor('tc_combat_status_tick', {
            combatId: combat.id, unitId: unit.id,
            effectName: 'natural_attunement_regen',
            effectCategory: rpgData.getStatusEffectCategory('natural_attunement_regen'),
            healAmount: naActualRegen, unitHp: unit.hp, unitMaxHp: unit.maxHp,
          });
        }
      }
      // Hound form: Loyal Companion aura — nearby allies get HP regen per turn
      if (effect.animalForm === 'hound' && effect.allyHpRegenAura) {
        var houndAllies = getUnitsInRadius(combat, unit.x, unit.y, 3);
        for (var hai = 0; hai < houndAllies.length; hai++) {
          var hAlly = houndAllies[hai];
          if (hAlly.id === unit.id || hAlly.type !== unit.type || !hAlly.alive) continue;
          var hRegenAmt = Math.max(1, Math.floor(hAlly.maxHp * effect.allyHpRegenAura));
          var hOldHp = hAlly.hp;
          hAlly.hp = Math.min(hAlly.maxHp, hAlly.hp + hRegenAmt);
          if (hAlly.hp > hOldHp && combat.callbacks.broadcastToFloor) {
            combat.callbacks.broadcastToFloor('tc_combat_status_tick', {
              combatId: combat.id, unitId: hAlly.id,
              effectName: 'loyal_companion_regen',
              effectCategory: rpgData.getStatusEffectCategory('loyal_companion_regen'),
              healAmount: hAlly.hp - hOldHp, unitHp: hAlly.hp, unitMaxHp: hAlly.maxHp,
            });
          }
        }
      }
    }

    // Decrement duration
    effect.duration--;
    if (effect.duration > 0) {
      remaining.push(effect);
    } else {
      // --- Animal Form expiry: revert all form bonuses ---
      if (effect.animalForm) {
        if (effect.maxHpBoost) {
          unit.maxHp -= effect.maxHpBoost;
          if (unit.hp > unit.maxHp) unit.hp = unit.maxHp;
        }
        unit.activeAnimalForm = null;
        unit._animalFormPounceReady = false;
        unit._animalFormShedSkinUsed = false;
        var primalSurge = getUnitCombatPassive(unit, 'primal_surge');
        if (primalSurge && unit.alive) {
          var psDuration = primalSurge.onFormExpireDuration || 2;
          var psDmgBoost = Math.max(1, Math.floor(5 * (primalSurge.onFormExpireBuff || 0.15) / 0.05));
          remaining.push({
            name: 'primal_surge', type: 'buff', duration: psDuration,
            damageBoost: psDmgBoost, armorBoost: Math.floor(psDmgBoost * 0.8),
            speedMult: 1 + (primalSurge.onFormExpireBuff || 0.15), sourceId: unit.id,
          });
          if (combat.callbacks.broadcastToFloor) {
            combat.callbacks.broadcastToFloor('tc_combat_status_tick', {
              combatId: combat.id, unitId: unit.id,
              effectName: 'primal_surge_activated',
              effectCategory: rpgData.getStatusEffectCategory('primal_surge_activated'),
              duration: psDuration,
            });
          }
        }
        if (combat.callbacks.broadcastToFloor) {
          combat.callbacks.broadcastToFloor('tc_combat_status_tick', {
            combatId: combat.id, unitId: unit.id,
            effectName: 'animal_form_expired',
            effectCategory: rpgData.getStatusEffectCategory('animal_form_expired'),
            form: effect.animalForm,
            unitHp: unit.hp, unitMaxHp: unit.maxHp,
          });
        }
      }
      // Revert maxHpBoost when food buff expires (non-animal-form buffs)
      else if (effect.maxHpBoost) {
        unit.maxHp -= effect.maxHpBoost;
        if (unit.hp > unit.maxHp) unit.hp = unit.maxHp;
      }
      // --- Support Passive: Vulnerability — when CC effect expires on target,
      // apply a damage_amplify debuff for 2 turns so the target takes 15% more damage. ---
      var ccEffectNames = ['stunned', 'rooted', 'frozen', 'knockdown', 'silenced', 'taunted', 'grappled', 'submission_hold', 'chokeholded'];
      if (effect.type === 'debuff' && ccEffectNames.indexOf(effect.name) !== -1 && effect.sourceId) {
        var vulnSource = combat.units.get(effect.sourceId);
        if (vulnSource && vulnSource.alive) {
          var vulnPassive = getUnitCombatPassive(vulnSource, 'vulnerability');
          if (vulnPassive) {
            if (!unit.statusEffects) unit.statusEffects = [];
            var hasVulnDebuff = false;
            for (var vci = 0; vci < remaining.length; vci++) {
              if (remaining[vci].name === 'vulnerability_exposed') {
                hasVulnDebuff = true;
                break;
              }
            }
            if (!hasVulnDebuff) {
              remaining.push({
                name: 'vulnerability_exposed',
                type: 'debuff',
                duration: vulnPassive.duration || 2,
                damageAmplify: vulnPassive.damageAmplify || 0.15,
                sourceId: effect.sourceId,
              });
              if (combat.callbacks.broadcastToFloor) {
                combat.callbacks.broadcastToFloor('tc_combat_passive_debuff', {
                  combatId: combat.id,
                  targetId: unit.id,
                  passive: 'vulnerability',
                  debuffName: 'vulnerability_exposed',
                  duration: vulnPassive.duration || 2,
                });
              }
            }
          }
        }
      }
    }
  }

  unit.statusEffects = remaining;
}

/**
 * Check and apply exhaustion damage (Turn 12 normal, Turn 20 boss/leviathan).
 * Deals escalating unblockable damage to ALL units.
 */
function checkExhaustion(combat) {
  var threshold = (combat._isLeviathanCombat || combat._hasBoss) ? EXHAUSTION_START_BOSS : EXHAUSTION_START;
  if (combat.turnNumber < threshold) return;

  var exhaustionDmg = (combat.turnNumber - threshold) * EXHAUSTION_PER_TURN;
  if (exhaustionDmg <= 0) return;

  combat.exhaustionDamage = exhaustionDmg;

  var casualties = [];
  var iter = combat.units.values();
  var entry = iter.next();

  while (!entry.done) {
    var unit = entry.value;
    entry = iter.next();

    if (!unit.alive) continue;

    unit.hp -= exhaustionDmg;
    if (unit.hp <= 0) {
      unit.alive = false;
      unit.hp = 0;
      casualties.push(unit.id);
    }
  }

  // Broadcast exhaustion
  if (combat.callbacks.broadcastToFloor) {
    combat.callbacks.broadcastToFloor('tc_combat_exhaustion', {
      combatId: combat.id,
      turnNumber: combat.turnNumber,
      damage: exhaustionDmg,
      casualties: casualties,
    });
  }

  // Process deaths
  for (var i = 0; i < casualties.length; i++) {
    handleUnitDeath(combat, casualties[i]);
  }
}

module.exports = {
  init: init,
  EXHAUSTION_START: EXHAUSTION_START,
  EXHAUSTION_START_BOSS: EXHAUSTION_START_BOSS,
  EXHAUSTION_PER_TURN: EXHAUSTION_PER_TURN,
  tickStatusEffects: tickStatusEffects,
  checkExhaustion: checkExhaustion,
};
