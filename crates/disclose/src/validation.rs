use anyhow::{anyhow, Result};
use jsonschema::JSONSchema;
use serde_json::Value;
use std::sync::OnceLock;

use crate::manifest::DisclosureManifest;

pub fn validate_manifest(manifest: &DisclosureManifest) -> Result<()> {
    static SCHEMA: OnceLock<Result<JSONSchema, String>> = OnceLock::new();
    let compiled = SCHEMA.get_or_init(|| {
        let schema_str = include_str!(concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../shared/schemas/disclosure.schema.json"
        ));
        let schema: Value = serde_json::from_str(schema_str).map_err(|err| err.to_string())?;
        let schema = Box::leak(Box::new(schema));
        JSONSchema::compile(schema).map_err(|err| err.to_string())
    });
    let compiled = match compiled {
        Ok(schema) => schema,
        Err(err) => return Err(anyhow!(err.clone())),
    };
    let instance = serde_json::to_value(manifest)?;
    if let Err(errors) = compiled.validate(&instance) {
        let messages: Vec<String> = errors.map(|e| e.to_string()).collect();
        return Err(anyhow!("validation error: {}", messages.join(", ")));
    }
    Ok(())
}
