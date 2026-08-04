use crate::Modifier;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, Serialize, Deserialize, PartialEq)]
pub enum TriggerType {
    SelfCast,
    CastOnCrit,
    CastWhenDamageTaken,
    Spellslinger,
    CastOnMeleeKill,
    Arcanist,
}

#[derive(Clone, Debug)]
pub struct TriggerConfig {
    pub trigger_type: TriggerType,
    pub cooldown: f64,
    pub proc_chance: f64,
    pub attack_rate: f64,
    pub crit_chance: f64,
}

impl TriggerConfig {
    pub fn self_cast() -> Self {
        TriggerConfig {
            trigger_type: TriggerType::SelfCast,
            cooldown: 0.0,
            proc_chance: 1.0,
            attack_rate: 0.0,
            crit_chance: 0.0,
        }
    }

    pub fn cast_on_crit(attack_rate: f64, crit_chance: f64) -> Self {
        TriggerConfig {
            trigger_type: TriggerType::CastOnCrit,
            cooldown: 0.15,
            proc_chance: 1.0,
            attack_rate,
            crit_chance: crit_chance / 100.0,
        }
    }

    #[allow(unused_variables)]
    pub fn cwdt(level: u32) -> Self {
        TriggerConfig {
            trigger_type: TriggerType::CastWhenDamageTaken,
            cooldown: 0.25,
            proc_chance: 1.0,
            attack_rate: 0.0,
            crit_chance: 0.0,
        }
    }

    pub fn spellslinger(attack_rate: f64) -> Self {
        TriggerConfig {
            trigger_type: TriggerType::Spellslinger,
            cooldown: 0.5,
            proc_chance: 1.0,
            attack_rate,
            crit_chance: 0.0,
        }
    }
}

pub fn calc_trigger_rate(config: &TriggerConfig) -> f64 {
    match config.trigger_type {
        TriggerType::SelfCast => 0.0,

        TriggerType::CastOnCrit => {
            let procs_per_sec =
                config.attack_rate * config.crit_chance * config.proc_chance;
            let max_rate = 1.0 / config.cooldown.max(0.033);
            procs_per_sec.min(max_rate)
        }

        TriggerType::CastWhenDamageTaken => 1.0 / config.cooldown.max(0.1),

        TriggerType::Spellslinger => {
            let max_rate = 1.0 / config.cooldown.max(0.1);
            config.attack_rate.min(max_rate)
        }

        TriggerType::CastOnMeleeKill | TriggerType::Arcanist => 2.0,
    }
}

pub fn trigger_support_mods(trigger: &TriggerType) -> Vec<Modifier> {
    match trigger {
        TriggerType::CastOnCrit => {
            vec![Modifier {
                stat: "Damage".into(),
                value: -21.0,
                mod_type: "more".into(),
            }]
        }
        TriggerType::CastWhenDamageTaken => {
            vec![Modifier {
                stat: "Damage".into(),
                value: -30.0,
                mod_type: "more".into(),
            }]
        }
        TriggerType::Spellslinger => {
            vec![Modifier {
                stat: "Damage".into(),
                value: -10.0,
                mod_type: "more".into(),
            }]
        }
        _ => vec![],
    }
}

pub fn detect_trigger(support_name: &str) -> Option<TriggerType> {
    let name = support_name.to_lowercase();
    if name.contains("cast on critical") || name.contains("cast on crit") {
        Some(TriggerType::CastOnCrit)
    } else if name.contains("cast when damage taken") || name.contains("cwdt") {
        Some(TriggerType::CastWhenDamageTaken)
    } else if name.contains("spellslinger") {
        Some(TriggerType::Spellslinger)
    } else if name.contains("cast on melee kill") {
        Some(TriggerType::CastOnMeleeKill)
    } else if name.contains("arcanist brand") {
        Some(TriggerType::Arcanist)
    } else {
        None
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_coc_rate() {
        let config = TriggerConfig::cast_on_crit(8.0, 80.0);
        let rate = calc_trigger_rate(&config);
        assert!(rate > 5.0 && rate < 7.0, "CoC rate: {}", rate);
    }

    #[test]
    fn test_coc_capped_by_cooldown() {
        let config = TriggerConfig::cast_on_crit(20.0, 100.0);
        let rate = calc_trigger_rate(&config);
        assert!(rate < 7.0, "CoC should be capped: {}", rate);
    }

    #[test]
    fn test_cwdt_rate() {
        let config = TriggerConfig::cwdt(1);
        let rate = calc_trigger_rate(&config);
        assert_eq!(rate, 4.0);
    }

    #[test]
    fn test_spellslinger_rate_capped() {
        let config = TriggerConfig::spellslinger(5.0);
        let rate = calc_trigger_rate(&config);
        assert_eq!(rate, 2.0); // capped by 1/0.5
    }

    #[test]
    fn test_spellslinger_rate_slow() {
        let config = TriggerConfig::spellslinger(1.5);
        let rate = calc_trigger_rate(&config);
        assert_eq!(rate, 1.5); // attack rate is the bottleneck
    }

    #[test]
    fn test_detect_coc() {
        assert_eq!(
            detect_trigger("Cast on Critical Strike Support"),
            Some(TriggerType::CastOnCrit)
        );
    }

    #[test]
    fn test_detect_cwdt() {
        assert_eq!(
            detect_trigger("Cast When Damage Taken Support"),
            Some(TriggerType::CastWhenDamageTaken)
        );
    }

    #[test]
    fn test_detect_spellslinger() {
        assert_eq!(
            detect_trigger("Spellslinger Support"),
            Some(TriggerType::Spellslinger)
        );
    }

    #[test]
    fn test_detect_none() {
        assert_eq!(detect_trigger("Melee Splash Support"), None);
    }

    #[test]
    fn test_trigger_mods_coc() {
        let mods = trigger_support_mods(&TriggerType::CastOnCrit);
        assert_eq!(mods.len(), 1);
        assert_eq!(mods[0].stat, "Damage");
        assert_eq!(mods[0].mod_type, "more");
        assert_eq!(mods[0].value, -21.0);
    }

    #[test]
    fn test_trigger_mods_cwdt() {
        let mods = trigger_support_mods(&TriggerType::CastWhenDamageTaken);
        assert_eq!(mods[0].value, -30.0);
    }

    #[test]
    fn test_trigger_mods_selfcast() {
        let mods = trigger_support_mods(&TriggerType::SelfCast);
        assert!(mods.is_empty());
    }

    #[test]
    fn test_selfcast_rate() {
        let config = TriggerConfig::self_cast();
        assert_eq!(calc_trigger_rate(&config), 0.0);
    }

    #[test]
    fn test_arcanist_rate() {
        let config = TriggerConfig {
            trigger_type: TriggerType::Arcanist,
            cooldown: 0.0,
            proc_chance: 1.0,
            attack_rate: 0.0,
            crit_chance: 0.0,
        };
        assert_eq!(calc_trigger_rate(&config), 2.0);
    }
}
