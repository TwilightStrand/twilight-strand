use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use tsify_next::Tsify;

#[derive(Tsify, Serialize, Deserialize, Default)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct BuildStats {
    pub total_dps: f64,
    pub combined_dps: f64,
    pub total_ehp: f64,
    pub life: f64,
    pub energy_shield: f64,
    pub mana: f64,
    pub strength: f64,
    pub dexterity: f64,
    pub intelligence: f64,
}

#[wasm_bindgen]
pub fn evaluate_build_xml(_xml: &str) -> Result<JsValue, JsError> {
    let stats = BuildStats::default();
    serde_wasm_bindgen::to_value(&stats).map_err(|e| JsError::new(&e.to_string()))
}
