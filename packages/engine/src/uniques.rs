use crate::Modifier;

/// Apply special unique item effects that go beyond normal mod parsing.
/// These are the "build-defining" uniques that need custom logic.
pub fn get_unique_effects(item_name: &str) -> Vec<Modifier> {
    let name = item_name.to_lowercase();
    let mut mods = Vec::new();

    // === BODY ARMOUR ===
    if name.contains("kaom's heart") {
        mods.push(Modifier { stat: "Life".into(), value: 500.0, mod_type: "flat".into() });
    }
    if name.contains("shavronne's wrappings") || name.contains("shav's") {
        mods.push(Modifier { stat: "EnergyShield".into(), value: 250.0, mod_type: "flat".into() });
    }
    if name.contains("carcass jack") {
        mods.push(Modifier { stat: "Damage".into(), value: 50.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 55.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "FireRes".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 25.0, mod_type: "flat".into() });
    }
    if name.contains("brass dome") {
        mods.push(Modifier { stat: "Armour".into(), value: 2000.0, mod_type: "flat".into() });
    }
    if name.contains("skin of the lords") || name.contains("skin of the loyal") {
        mods.push(Modifier { stat: "Life".into(), value: 100.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 100.0, mod_type: "increased".into() });
    }
    if name.contains("loreweave") {
        mods.push(Modifier { stat: "Damage".into(), value: 40.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 60.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 30.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "CritChance".into(), value: 60.0, mod_type: "increased".into() });
    }
    if name.contains("belly of the beast") {
        mods.push(Modifier { stat: "Life".into(), value: 40.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "FireRes".into(), value: 15.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 15.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: 15.0, mod_type: "flat".into() });
    }
    if name.contains("inpulsa") {
        mods.push(Modifier { stat: "Damage".into(), value: 40.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 70.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningDamage".into(), value: 25.0, mod_type: "increased".into() });
    }
    if name.contains("replica farrul") {
        mods.push(Modifier { stat: "Damage".into(), value: 15.0, mod_type: "more".into() });
        mods.push(Modifier { stat: "Armour".into(), value: 1500.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Evasion".into(), value: 1500.0, mod_type: "flat".into() });
    }
    if name.contains("dialla's malefaction") {
        mods.push(Modifier { stat: "Damage".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 100.0, mod_type: "flat".into() });
    }

    // === WEAPONS ===
    if name.contains("tulfall") {
        mods.push(Modifier { stat: "ColdDamage".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "SpellDamage".into(), value: 30.0, mod_type: "increased".into() });
    }
    if name.contains("heartbreaker") {
        mods.push(Modifier { stat: "SpellDamage".into(), value: 50.0, mod_type: "increased".into() });
    }
    if name.contains("void battery") {
        mods.push(Modifier { stat: "SpellDamage".into(), value: 80.0, mod_type: "increased".into() });
    }
    if name.contains("nebulis") {
        mods.push(Modifier { stat: "ColdDamage".into(), value: 50.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "FireDamage".into(), value: 50.0, mod_type: "increased".into() });
    }
    if name.contains("doryani's catalyst") {
        mods.push(Modifier { stat: "Damage".into(), value: 112.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 10.0, mod_type: "increased".into() });
    }
    if name.contains("eclipse solaris") {
        mods.push(Modifier { stat: "SpellDamage".into(), value: 120.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "CritChance".into(), value: 80.0, mod_type: "increased".into() });
    }
    if name.contains("starforge") {
        mods.push(Modifier { stat: "Damage".into(), value: 600.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 5.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 100.0, mod_type: "flat".into() });
    }
    if name.contains("windripper") {
        mods.push(Modifier { stat: "Damage".into(), value: 200.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "CritChance".into(), value: 40.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 10.0, mod_type: "increased".into() });
    }
    if name.contains("mjolner") || name.contains("mjölner") {
        mods.push(Modifier { stat: "LightningDamage".into(), value: 60.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Str".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Damage".into(), value: 150.0, mod_type: "flat".into() });
    }

    // === HELMETS ===
    if name.contains("crown of the inward eye") {
        mods.push(Modifier { stat: "Life".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Mana".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("starkonja") {
        mods.push(Modifier { stat: "Life".into(), value: 100.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Dex".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 25.0, mod_type: "increased".into() });
    }
    if name.contains("hrimnor's resolve") {
        mods.push(Modifier { stat: "Armour".into(), value: 400.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "FireDamage".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 30.0, mod_type: "flat".into() });
    }
    if name.contains("heatshiver") {
        mods.push(Modifier { stat: "Damage".into(), value: 30.0, mod_type: "more".into() });
        mods.push(Modifier { stat: "ColdDamage".into(), value: 40.0, mod_type: "increased".into() });
    }

    // === AMULETS ===
    if name.contains("dragonfang's flight") || name.contains("replica dragonfang") {
        mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("aul's uprising") {
        mods.push(Modifier { stat: "Damage".into(), value: 15.0, mod_type: "increased".into() });
    }
    if name.contains("ashes of the stars") {
        mods.push(Modifier { stat: "Life".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Mana".into(), value: 50.0, mod_type: "flat".into() });
    }
    if name.contains("mageblood") {
        mods.push(Modifier { stat: "Armour".into(), value: 3000.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Evasion".into(), value: 3000.0, mod_type: "flat".into() });
    }
    if name.contains("presence of chayula") {
        mods.push(Modifier { stat: "ChaosRes".into(), value: 60.0, mod_type: "flat".into() });
    }
    if name.contains("eyes of the greatwolf") {
        mods.push(Modifier { stat: "Damage".into(), value: 50.0, mod_type: "increased".into() });
    }
    if name.contains("crystallised omniscience") {
        mods.push(Modifier { stat: "FirePenetration".into(), value: 20.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdPenetration".into(), value: 20.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningPenetration".into(), value: 20.0, mod_type: "flat".into() });
    }
    if name.contains("badge of the brotherhood") {
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 35.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "CritChance".into(), value: 50.0, mod_type: "increased".into() });
    }

    // === RINGS ===
    if name.contains("mark of the shaper") {
        mods.push(Modifier { stat: "SpellDamage".into(), value: 80.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 60.0, mod_type: "flat".into() });
    }
    if name.contains("kalandra's touch") {
        mods.push(Modifier { stat: "Life".into(), value: 50.0, mod_type: "flat".into() });
    }
    if name.contains("pyre") {
        mods.push(Modifier { stat: "FireDamage".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 40.0, mod_type: "flat".into() });
    }
    if name.contains("circle of") {
        mods.push(Modifier { stat: "Damage".into(), value: 25.0, mod_type: "increased".into() });
    }
    if name.contains("nimis") {
        mods.push(Modifier { stat: "Damage".into(), value: 30.0, mod_type: "more".into() });
        mods.push(Modifier { stat: "CritMultiplier".into(), value: 30.0, mod_type: "flat".into() });
    }
    if name.contains("ventor's gamble") {
        mods.push(Modifier { stat: "FireRes".into(), value: 30.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 30.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: 30.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Life".into(), value: 40.0, mod_type: "flat".into() });
    }

    // === BOOTS ===
    if name.contains("seven-league step") {
        mods.push(Modifier { stat: "MovementSpeed".into(), value: 50.0, mod_type: "increased".into() });
    }
    if name.contains("atziri's step") {
        mods.push(Modifier { stat: "Evasion".into(), value: 180.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Life".into(), value: 70.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "SpellSuppressionChance".into(), value: 26.0, mod_type: "flat".into() });
    }
    if name.contains("death's door") {
        mods.push(Modifier { stat: "Str".into(), value: 20.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Armour".into(), value: 250.0, mod_type: "flat".into() });
    }

    // === GLOVES ===
    if name.contains("shaper's touch") {
        // Str gives ES%, Dex gives accuracy, Int gives life% — unique interactions
        mods.push(Modifier { stat: "Life".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Accuracy".into(), value: 200.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Evasion".into(), value: 200.0, mod_type: "flat".into() });
    }
    if name.contains("command of the pit") {
        mods.push(Modifier { stat: "Accuracy".into(), value: 1000.0, mod_type: "flat".into() });
    }
    if name.contains("hands of the high templar") {
        mods.push(Modifier { stat: "Life".into(), value: 80.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 60.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "CritChance".into(), value: 30.0, mod_type: "increased".into() });
    }
    if name.contains("gravebind") {
        mods.push(Modifier { stat: "Life".into(), value: 40.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Str".into(), value: 20.0, mod_type: "flat".into() });
    }

    // === BELTS ===
    if name.contains("headhunter") {
        mods.push(Modifier { stat: "Str".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Dex".into(), value: 25.0, mod_type: "flat".into() });
    }
    if name.contains("darkness enthroned") {
        mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("stygian vise") {
        // Base has an abyssal socket — not a unique effect per se
    }
    if name.contains("immortal flesh") {
        mods.push(Modifier { stat: "Life".into(), value: 75.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Mana".into(), value: 50.0, mod_type: "flat".into() });
    }

    // === SHIELDS ===
    if name.contains("aegis aurora") {
        mods.push(Modifier { stat: "Armour".into(), value: 300.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 40.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 25.0, mod_type: "flat".into() });
    }
    if name.contains("magna eclipsis") {
        mods.push(Modifier { stat: "Armour".into(), value: 500.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 100.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "BlockChance".into(), value: 8.0, mod_type: "flat".into() });
    }
    if name.contains("spirit of the prism guardian") || name.contains("prism guardian") {
        mods.push(Modifier { stat: "FireRes".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: 25.0, mod_type: "flat".into() });
    }
    if name.contains("the squire") || name == "squire" {
        mods.push(Modifier { stat: "Damage".into(), value: 40.0, mod_type: "more".into() });
    }

    // Unique flasks are handled in flasks.rs via active_flasks; not duplicated here.

    // === BODY ARMOUR (additional) ===
    if name.contains("hyrri's ire") {
        mods.push(Modifier { stat: "Evasion".into(), value: 2000.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "SpellSuppressionChance".into(), value: 14.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Dex".into(), value: 25.0, mod_type: "flat".into() });
    }
    if name.contains("farrul's fur") {
        mods.push(Modifier { stat: "Armour".into(), value: 1500.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Evasion".into(), value: 1500.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Life".into(), value: 100.0, mod_type: "flat".into() });
    }
    if name.contains("the covenant") {
        mods.push(Modifier { stat: "SpellDamage".into(), value: 50.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 200.0, mod_type: "flat".into() });
    }
    if name.contains("cloak of defiance") {
        mods.push(Modifier { stat: "Mana".into(), value: 100.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 50.0, mod_type: "flat".into() });
    }
    if name.contains("atziri's splendour") {
        mods.push(Modifier { stat: "Armour".into(), value: 400.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "EnergyShield".into(), value: 100.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Evasion".into(), value: 400.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Life".into(), value: 70.0, mod_type: "flat".into() });
    }
    if name.contains("lightning coil") {
        mods.push(Modifier { stat: "Armour".into(), value: 200.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Life".into(), value: 60.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: -60.0, mod_type: "flat".into() });
    }
    if name.contains("tinkerskin") {
        mods.push(Modifier { stat: "Evasion".into(), value: 200.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Life".into(), value: 80.0, mod_type: "flat".into() });
    }

    // === SHIELDS (additional) ===
    if name.contains("dawnbreaker") {
        mods.push(Modifier { stat: "Armour".into(), value: 300.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "FireRes".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "BlockChance".into(), value: 5.0, mod_type: "flat".into() });
    }

    // === BOOTS (additional) ===
    if name.contains("sin trek") {
        mods.push(Modifier { stat: "EnergyShield".into(), value: 100.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Dex".into(), value: 30.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Int".into(), value: 30.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "MovementSpeed".into(), value: 30.0, mod_type: "increased".into() });
    }
    if name.contains("ralakesh's impatience") {
        mods.push(Modifier { stat: "Life".into(), value: 60.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "MovementSpeed".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("alberon's warpath") {
        mods.push(Modifier { stat: "Str".into(), value: 18.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Armour".into(), value: 180.0, mod_type: "flat".into() });
    }
    if name.contains("garukhan's flight") {
        mods.push(Modifier { stat: "Evasion".into(), value: 200.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "MovementSpeed".into(), value: 30.0, mod_type: "increased".into() });
    }

    // === BELTS (additional) ===
    if name.contains("cyclopean coil") {
        mods.push(Modifier { stat: "Life".into(), value: 80.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Str".into(), value: 15.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Dex".into(), value: 15.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Int".into(), value: 15.0, mod_type: "flat".into() });
    }
    if name.contains("the magnate") || name.contains("perseverance") {
        mods.push(Modifier { stat: "Damage".into(), value: 40.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 50.0, mod_type: "flat".into() });
    }

    // === RINGS (additional) ===
    if name.contains("the taming") {
        mods.push(Modifier { stat: "Damage".into(), value: 30.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "FireRes".into(), value: 20.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 20.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: 20.0, mod_type: "flat".into() });
    }
    if name.contains("precursor's emblem") {
        mods.push(Modifier { stat: "Life".into(), value: 50.0, mod_type: "flat".into() });
    }
    if name.contains("call of the brotherhood") {
        mods.push(Modifier { stat: "Int".into(), value: 15.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: 30.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: 30.0, mod_type: "flat".into() });
    }
    if name.contains("essence worm") {
        mods.push(Modifier { stat: "FireRes".into(), value: -20.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: -20.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: -20.0, mod_type: "flat".into() });
    }

    // === HELMETS (additional) ===
    if name.contains("devoto's devotion") {
        mods.push(Modifier { stat: "Armour".into(), value: 200.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Dex".into(), value: 20.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 16.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "MovementSpeed".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("the vertex") {
        mods.push(Modifier { stat: "EnergyShield".into(), value: 250.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Evasion".into(), value: 200.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ChaosRes".into(), value: 36.0, mod_type: "flat".into() });
    }
    if name.contains("fractal thoughts") {
        mods.push(Modifier { stat: "CritMultiplier".into(), value: 30.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Life".into(), value: 80.0, mod_type: "flat".into() });
    }

    // === AMULETS (additional) ===
    if name.contains("astramentis") {
        mods.push(Modifier { stat: "Str".into(), value: 80.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Dex".into(), value: 80.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Int".into(), value: 80.0, mod_type: "flat".into() });
    }
    if name.contains("marylene's fallacy") {
        mods.push(Modifier { stat: "CritMultiplier".into(), value: 150.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "CritChance".into(), value: -40.0, mod_type: "increased".into() });
    }
    if name.contains("impresence") {
        mods.push(Modifier { stat: "Life".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Armour".into(), value: 400.0, mod_type: "flat".into() });
    }
    if name.contains("the jinxed juju") {
        mods.push(Modifier { stat: "Life".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Damage".into(), value: 15.0, mod_type: "increased".into() });
    }

    // === WEAPONS (additional) ===
    if name.contains("paradoxica") {
        mods.push(Modifier { stat: "Damage".into(), value: 100.0, mod_type: "more".into() });
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("cospri's malice") {
        mods.push(Modifier { stat: "ColdDamage".into(), value: 50.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "CritChance".into(), value: 60.0, mod_type: "increased".into() });
    }
    if name.contains("saviour") {
        mods.push(Modifier { stat: "Damage".into(), value: 50.0, mod_type: "more".into() });
        mods.push(Modifier { stat: "CritChance".into(), value: 30.0, mod_type: "increased".into() });
    }
    if name.contains("dreamfeather") && !name.contains("replica") {
        mods.push(Modifier { stat: "Damage".into(), value: 60.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Evasion".into(), value: 300.0, mod_type: "flat".into() });
    }
    if name.contains("ahn's might") {
        mods.push(Modifier { stat: "Damage".into(), value: 400.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Accuracy".into(), value: 100.0, mod_type: "increased".into() });
    }
    if name.contains("rebuke of the vaal") {
        mods.push(Modifier { stat: "Damage".into(), value: 500.0, mod_type: "flat".into() });
    }

    // === JEWELS ===
    if name.contains("thread of hope") {
        mods.push(Modifier { stat: "FireRes".into(), value: -10.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: -10.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: -10.0, mod_type: "flat".into() });
    }
    if name.contains("militant faith") {
        mods.push(Modifier { stat: "Damage".into(), value: 10.0, mod_type: "increased".into() });
    }
    if name.contains("unnatural instinct") {
        mods.push(Modifier { stat: "Damage".into(), value: 15.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Life".into(), value: 30.0, mod_type: "flat".into() });
    }
    if name.contains("the interrogation") {
        mods.push(Modifier { stat: "CritMultiplier".into(), value: 50.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Damage".into(), value: 20.0, mod_type: "increased".into() });
    }
    if name.contains("melding of the flesh") {
        mods.push(Modifier { stat: "FireRes".into(), value: -70.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "ColdRes".into(), value: -70.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "LightningRes".into(), value: -70.0, mod_type: "flat".into() });
    }
    if name.contains("original sin") {
        mods.push(Modifier { stat: "ChaosPenetration".into(), value: 25.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "Damage".into(), value: 30.0, mod_type: "increased".into() });
    }
    if name.contains("replica dreamfeather") {
        mods.push(Modifier { stat: "Damage".into(), value: 60.0, mod_type: "increased".into() });
        mods.push(Modifier { stat: "Evasion".into(), value: 300.0, mod_type: "flat".into() });
        mods.push(Modifier { stat: "AttackSpeed".into(), value: 15.0, mod_type: "increased".into() });
    }

    mods
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_kaoms_heart() {
        let mods = get_unique_effects("Kaom's Heart");
        assert!(mods.iter().any(|m| m.stat == "Life" && m.value == 500.0));
    }

    #[test]
    fn test_carcass_jack() {
        let mods = get_unique_effects("Carcass Jack");
        assert!(mods.iter().any(|m| m.stat == "Damage"));
        assert!(mods.iter().any(|m| m.stat == "Life"));
    }

    #[test]
    fn test_case_insensitive() {
        let mods = get_unique_effects("KAOM'S HEART");
        assert!(!mods.is_empty());
    }

    #[test]
    fn test_unknown_unique() {
        let mods = get_unique_effects("Some Random Rare Item");
        assert!(mods.is_empty());
    }

    #[test]
    fn test_starkonja() {
        let mods = get_unique_effects("Starkonja's Head");
        assert!(mods.iter().any(|m| m.stat == "Life"));
        assert!(mods.iter().any(|m| m.stat == "Dex"));
        assert!(mods.iter().any(|m| m.stat == "AttackSpeed"));
    }

    #[test]
    fn test_aegis_aurora() {
        let mods = get_unique_effects("Aegis Aurora");
        assert!(mods.iter().any(|m| m.stat == "Armour"));
        assert!(mods.iter().any(|m| m.stat == "ColdRes"));
    }

    #[test]
    fn test_shapers_touch() {
        let mods = get_unique_effects("Shaper's Touch");
        assert!(mods.iter().any(|m| m.stat == "Life"));
        assert!(mods.iter().any(|m| m.stat == "EnergyShield"));
        assert!(mods.iter().any(|m| m.stat == "Accuracy"));
    }

    #[test]
    fn test_belly_of_the_beast() {
        let mods = get_unique_effects("Belly of the Beast");
        assert!(mods.iter().any(|m| m.stat == "Life" && m.mod_type == "increased"));
        assert!(mods.iter().any(|m| m.stat == "FireRes"));
    }

    #[test]
    fn test_loreweave() {
        let mods = get_unique_effects("Loreweave");
        assert!(mods.iter().any(|m| m.stat == "Damage"));
        assert!(mods.iter().any(|m| m.stat == "CritChance"));
    }

    #[test]
    fn test_presence_of_chayula() {
        let mods = get_unique_effects("Presence of Chayula");
        assert!(mods.iter().any(|m| m.stat == "ChaosRes" && m.value == 60.0));
    }

    #[test]
    fn test_thread_of_hope() {
        let mods = get_unique_effects("Thread of Hope");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().all(|m| m.value == -10.0));
    }

    #[test]
    fn test_starforge() {
        let mods = get_unique_effects("Starforge");
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.value == 600.0 && m.mod_type == "flat"));
        assert!(mods.iter().any(|m| m.stat == "AttackSpeed" && m.value == 5.0));
        assert!(mods.iter().any(|m| m.stat == "Life" && m.value == 100.0));
    }

    #[test]
    fn test_nimis() {
        let mods = get_unique_effects("Nimis");
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.mod_type == "more" && m.value == 30.0));
        assert!(mods.iter().any(|m| m.stat == "CritMultiplier" && m.value == 30.0));
    }

    #[test]
    fn test_crystallised_omniscience() {
        let mods = get_unique_effects("Crystallised Omniscience");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().any(|m| m.stat == "FirePenetration" && m.value == 20.0));
        assert!(mods.iter().any(|m| m.stat == "ColdPenetration" && m.value == 20.0));
        assert!(mods.iter().any(|m| m.stat == "LightningPenetration" && m.value == 20.0));
    }

    #[test]
    fn test_melding_of_the_flesh() {
        let mods = get_unique_effects("Melding of the Flesh");
        assert_eq!(mods.len(), 3);
        assert!(mods.iter().all(|m| m.value == -70.0));
        assert!(mods.iter().any(|m| m.stat == "FireRes"));
        assert!(mods.iter().any(|m| m.stat == "ColdRes"));
        assert!(mods.iter().any(|m| m.stat == "LightningRes"));
    }

    #[test]
    fn test_inpulsa() {
        let mods = get_unique_effects("Inpulsa's Broken Heart");
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.value == 40.0 && m.mod_type == "increased"));
        assert!(mods.iter().any(|m| m.stat == "Life" && m.value == 70.0));
        assert!(mods.iter().any(|m| m.stat == "LightningDamage" && m.value == 25.0));
    }

    #[test]
    fn test_windripper() {
        let mods = get_unique_effects("Windripper");
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.value == 200.0 && m.mod_type == "flat"));
        assert!(mods.iter().any(|m| m.stat == "CritChance"));
        assert!(mods.iter().any(|m| m.stat == "AttackSpeed"));
    }

    #[test]
    fn test_ventors_gamble() {
        let mods = get_unique_effects("Ventor's Gamble");
        assert_eq!(mods.len(), 4);
        assert!(mods.iter().any(|m| m.stat == "Life" && m.value == 40.0));
        assert!(mods.iter().any(|m| m.stat == "FireRes" && m.value == 30.0));
    }

    #[test]
    fn test_mjolner() {
        let mods = get_unique_effects("Mjolner");
        assert!(mods.iter().any(|m| m.stat == "LightningDamage" && m.value == 60.0));
        assert!(mods.iter().any(|m| m.stat == "Str" && m.value == 25.0));
        assert!(mods.iter().any(|m| m.stat == "Damage" && m.value == 150.0 && m.mod_type == "flat"));
    }
}
