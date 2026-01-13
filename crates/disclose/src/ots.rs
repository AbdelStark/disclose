use anyhow::{anyhow, Result};
use serde::Deserialize;
use std::path::{Path, PathBuf};
use std::process::Command;

fn helper_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../scripts/ots-helper.mjs")
}

fn run_helper(args: &[String]) -> Result<String> {
    let output = Command::new("node")
        .arg(helper_path())
        .args(args)
        .output()?;
    if !output.status.success() {
        return Err(anyhow!(String::from_utf8_lossy(&output.stderr).to_string()));
    }
    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

#[derive(Debug, Deserialize)]
struct StampResult {
    ok: bool,
    receipt_path: Option<String>,
}

#[derive(Debug, Deserialize)]
struct UpgradeResult {
    ok: bool,
    changed: Option<bool>,
}

#[derive(Debug, Deserialize)]
struct InfoResult {
    ok: bool,
    info: serde_json::Value,
}

#[derive(Debug, Deserialize)]
struct VerifyResult {
    ok: bool,
    verified: bool,
    result: Option<serde_json::Value>,
}

pub fn stamp(digest_hex: &str, out: &Path, calendars: Option<&str>, timeout: Option<u64>) -> Result<()> {
    let mut args = vec!["stamp".to_string(), "--digest".to_string(), digest_hex.to_string()];
    args.push("--out".to_string());
    args.push(out.to_string_lossy().to_string());
    if let Some(cal) = calendars {
        args.push("--calendars".to_string());
        args.push(cal.to_string());
    }
    if let Some(timeout) = timeout {
        args.push("--timeout".to_string());
        args.push(timeout.to_string());
    }
    let output = run_helper(&args)?;
    let parsed: StampResult = serde_json::from_str(&output)?;
    if !parsed.ok {
        return Err(anyhow!("Stamp failed"));
    }
    Ok(())
}

pub fn upgrade(receipt: &Path) -> Result<bool> {
    let args = vec![
        "upgrade".to_string(),
        "--receipt".to_string(),
        receipt.to_string_lossy().to_string(),
    ];
    let output = run_helper(&args)?;
    let parsed: UpgradeResult = serde_json::from_str(&output)?;
    if !parsed.ok {
        return Err(anyhow!("Upgrade failed"));
    }
    Ok(parsed.changed.unwrap_or(false))
}

pub fn info(receipt: &Path) -> Result<String> {
    let args = vec![
        "info".to_string(),
        "--receipt".to_string(),
        receipt.to_string_lossy().to_string(),
    ];
    let output = run_helper(&args)?;
    let parsed: InfoResult = serde_json::from_str(&output)?;
    if !parsed.ok {
        return Err(anyhow!("Info failed"));
    }
    Ok(parsed.info.to_string())
}

pub fn verify(receipt: &Path, digest_hex: &str, timeout: Option<u64>) -> Result<bool> {
    let mut args = vec![
        "verify".to_string(),
        "--receipt".to_string(),
        receipt.to_string_lossy().to_string(),
        "--digest".to_string(),
        digest_hex.to_string(),
    ];
    if let Some(timeout) = timeout {
        args.push("--timeout".to_string());
        args.push(timeout.to_string());
    }
    let output = run_helper(&args)?;
    let parsed: VerifyResult = serde_json::from_str(&output)?;
    if !parsed.ok {
        return Err(anyhow!("Verify failed"));
    }
    Ok(parsed.verified)
}

pub fn receipt_sha256(receipt: &Path) -> Result<String> {
    let bytes = std::fs::read(receipt)?;
    Ok(crate::hashing::sha256_hex_bytes(&bytes))
}
