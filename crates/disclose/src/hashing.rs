use crate::manifest::DisclosureManifest;
use crate::merkle::bundle_root_hex;
use anyhow::{anyhow, Result};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use sha2::{Digest, Sha256};
use std::fs::File;
use std::io::{Read, Write};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofHashEntry {
    pub id: String,
    pub sha256: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size_bytes: Option<u64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HashesJson {
    pub algo: String,
    pub manifest_sha256: String,
    pub proof: Vec<ProofHashEntry>,
    pub bundle_root_sha256: String,
}

pub fn sha256_hex_bytes(bytes: &[u8]) -> String {
    let mut hasher = Sha256::new();
    hasher.update(bytes);
    hex::encode(hasher.finalize())
}

pub fn sha256_hex_reader<R: Read>(mut reader: R) -> Result<String> {
    let mut hasher = Sha256::new();
    let mut buf = [0u8; 8192];
    loop {
        let read = reader.read(&mut buf)?;
        if read == 0 {
            break;
        }
        hasher.update(&buf[..read]);
    }
    Ok(hex::encode(hasher.finalize()))
}

pub fn hash_file(path: &Path) -> Result<String> {
    let file = File::open(path)?;
    sha256_hex_reader(file)
}

fn canonicalize_value(value: &Value) -> Value {
    match value {
        Value::Array(items) => Value::Array(items.iter().map(canonicalize_value).collect()),
        Value::Object(map) => {
            let mut keys: Vec<String> = map.keys().cloned().collect();
            keys.sort();
            let mut next = serde_json::Map::new();
            for key in keys {
                if let Some(val) = map.get(&key) {
                    next.insert(key, canonicalize_value(val));
                }
            }
            Value::Object(next)
        }
        _ => value.clone(),
    }
}

pub fn stable_manifest_string(manifest: &DisclosureManifest) -> Result<String> {
    let mut value = serde_json::to_value(manifest)?;
    if let Some(proof) = value.get_mut("proof") {
        if let Some(obj) = proof.as_object_mut() {
            obj.remove("bundle_root_sha256");
        }
    }
    if let Some(obj) = value.as_object_mut() {
        obj.remove("timestamps");
        obj.remove("publication");
    }
    let canonical = canonicalize_value(&value);
    Ok(serde_json::to_string(&canonical)?)
}

pub fn manifest_hash(manifest: &DisclosureManifest) -> Result<String> {
    let payload = stable_manifest_string(manifest)?;
    Ok(sha256_hex_bytes(payload.as_bytes()))
}

pub fn build_hashes(manifest: &DisclosureManifest) -> Result<HashesJson> {
    let manifest_sha = manifest_hash(manifest)?;
    let proof_hashes: Vec<String> = manifest
        .proof
        .items
        .iter()
        .map(|item| item.sha256.clone())
        .collect();
    if proof_hashes.iter().any(|h| h.is_empty()) {
        return Err(anyhow!("Missing proof hashes"));
    }
    let bundle_root = bundle_root_hex(&manifest_sha, &proof_hashes)?;
    let proof_entries = manifest
        .proof
        .items
        .iter()
        .map(|item| ProofHashEntry {
            id: item.id.clone(),
            sha256: item.sha256.clone(),
            size_bytes: item.size_bytes,
            path: item.path.clone(),
        })
        .collect();

    Ok(HashesJson {
        algo: "sha256+merkle/v1".to_string(),
        manifest_sha256: manifest_sha,
        proof: proof_entries,
        bundle_root_sha256: bundle_root,
    })
}

pub fn write_hashes(path: &Path, hashes: &HashesJson) -> Result<()> {
    let mut file = File::create(path)?;
    let json = serde_json::to_string_pretty(hashes)?;
    file.write_all(json.as_bytes())?;
    Ok(())
}
