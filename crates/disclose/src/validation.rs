use anyhow::{anyhow, Result};
use jsonschema::JSONSchema;
use serde_json::Value;

use crate::manifest::DisclosureManifest;

pub fn validate_manifest(manifest: &DisclosureManifest) -> Result<()> {
    let schema_str = include_str!("$CARGO_MANIFEST_DIR/../../shared/schemas/disclosure.schema.json");
    let schema: Value = serde_json::from_str(schema_str)?;
    let compiled = JSONSchema::compile(&schema)?;
    let instance = serde_json::to_value(manifest)?;
    if let Err(errors) = compiled.validate(&instance) {
        let messages: Vec<String> = errors.map(|e| e.to_string()).collect();
        return Err(anyhow!("validation error: {}", messages.join(", ")));
    }
    Ok(())
}
