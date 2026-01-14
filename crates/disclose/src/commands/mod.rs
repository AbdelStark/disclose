use anyhow::{anyhow, Result};
use base64::{engine::general_purpose, Engine as _};
use chrono::Utc;
use mime_guess::MimeGuess;
use serde_json::json;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use uuid::Uuid;

use crate::errors::ValidationError;
use crate::hashing::{build_hashes, hash_file, write_hashes, HashesJson};
use crate::manifest::{
    AssistanceGrade, AssistanceInfo, AssistanceStage, DisclosureManifest, OpenTimestampsInfo, ProofItem,
    ProofKind, ProofInfo, ProjectInfo, TemplateRef, TimestampInfo,
};
use crate::ots;
use crate::publish::{publish_disclosure, ReceiptPayload};
use crate::templates::{get_template, Template};
use crate::workspace::Workspace;
use crate::validation::validate_manifest;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum IncludeProof {
    None,
    Hashes,
    Copies,
}

#[derive(Debug, Clone, Copy)]
pub enum ExportFormat {
    Zip,
    Dir,
}

impl std::str::FromStr for IncludeProof {
    type Err = anyhow::Error;

    fn from_str(input: &str) -> Result<Self> {
        match input {
            "none" => Ok(IncludeProof::None),
            "hashes" => Ok(IncludeProof::Hashes),
            "copies" => Ok(IncludeProof::Copies),
            _ => Err(anyhow!("Invalid include-proof option")),
        }
    }
}

impl std::str::FromStr for ExportFormat {
    type Err = anyhow::Error;

    fn from_str(input: &str) -> Result<Self> {
        match input {
            "zip" => Ok(ExportFormat::Zip),
            "dir" => Ok(ExportFormat::Dir),
            _ => Err(anyhow!("Invalid export format")),
        }
    }
}

pub fn init_workspace(
    out_dir: PathBuf,
    template_slug: &str,
    title: &str,
    author: Option<String>,
    links: Vec<String>,
) -> Result<Workspace> {
    if out_dir.exists() {
        return Err(anyhow!("Output directory already exists"));
    }

    fs::create_dir_all(&out_dir)?;
    let workspace = Workspace::new(out_dir);
    workspace.ensure_state_dir()?;

    let template = get_template(template_slug)?;

    let stages = template
        .stages
        .iter()
        .map(|stage| AssistanceStage {
            key: stage.key.clone(),
            label: stage.label.clone(),
            grade: AssistanceGrade::None,
            approx_ai_percent: 0,
        })
        .collect();

    let manifest = DisclosureManifest {
        version: "1.0.0".to_string(),
        id: format!("dsc_{}", Uuid::new_v4()),
        created_at: Utc::now().to_rfc3339(),
        template: TemplateRef {
            slug: template.slug,
            version: template.version,
        },
        project: ProjectInfo {
            title: title.to_string(),
            author,
            links: if links.is_empty() { None } else { Some(links) },
            audience: Some("public".to_string()),
        },
        ai_tools: None,
        assistance: AssistanceInfo {
            global: crate::manifest::AssistanceGlobal {
                human_percent: 70,
                ai_percent: 30,
            },
            stages: Some(stages),
            notes: None,
        },
        proof: ProofInfo {
            items: Vec::new(),
            bundle_root_sha256: None,
        },
        timestamps: None,
        publication: None,
    };

    validate_manifest(&manifest)?;
    validate_manifest(&manifest)?;
    validate_manifest(&manifest)?;
    validate_manifest(&manifest)?;
    manifest.write_to(&workspace.disclosure_path())?;

    let state = json!({
        "version": 1,
        "status": "draft"
    });
    fs::write(workspace.state_path(), serde_json::to_string_pretty(&state)?)?;

    Ok(workspace)
}

fn build_file_proof(
    path: &Path,
    label: Option<&str>,
    note: Option<&str>,
    created_before_ai: Option<bool>,
    copy_into: Option<&Path>,
    workspace: &Workspace,
) -> Result<ProofItem> {
    let mut target_path = path.to_path_buf();
    if let Some(copy_dir) = copy_into {
        fs::create_dir_all(copy_dir)?;
        let filename = path
            .file_name()
            .ok_or_else(|| anyhow!("Invalid file name"))?;
        let dest = copy_dir.join(filename);
        fs::copy(path, &dest)?;
        target_path = dest;
    }

    let sha256 = hash_file(&target_path)?;
    let metadata = fs::metadata(&target_path)?;
    let file_name = target_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "proof".to_string());
    let display_label = label
        .map(|l| l.to_string())
        .unwrap_or_else(|| file_name.clone());
    let mime = MimeGuess::from_path(&target_path)
        .first_raw()
        .map(|m| m.to_string());

    let relative_path = pathdiff::diff_paths(&target_path, workspace.root_path())
        .unwrap_or(target_path.clone());

    Ok(ProofItem {
        id: format!("p_{}", Uuid::new_v4()),
        label: display_label,
        kind: ProofKind::File,
        path: Some(relative_path.to_string_lossy().to_string()),
        mime,
        size_bytes: Some(metadata.len()),
        sha256,
        created_before_ai,
        notes: note.map(|n| n.to_string()),
        git: None,
    })
}

fn build_git_proof(repo: &str, commit: &str, label: Option<&str>, note: Option<&str>) -> ProofItem {
    let payload = format!("git:{}@{}", repo, commit);
    let sha256 = crate::hashing::sha256_hex_bytes(payload.as_bytes());
    ProofItem {
        id: format!("p_{}", Uuid::new_v4()),
        label: label.map(|l| l.to_string()).unwrap_or_else(|| "Git commit".to_string()),
        kind: ProofKind::GitCommit,
        path: Some(payload.clone()),
        mime: None,
        size_bytes: None,
        sha256,
        created_before_ai: None,
        notes: note.map(|n| n.to_string()),
        git: Some(crate::manifest::GitProof {
            repo: Some(repo.to_string()),
            commit: Some(commit.to_string()),
        }),
    }
}

pub fn attach_proof(
    workspace: &Workspace,
    proof_paths: Vec<PathBuf>,
    label: Option<String>,
    note: Option<String>,
    created_before_ai: Option<bool>,
    copy_into: Option<PathBuf>,
    git: Option<(String, String)>,
) -> Result<HashesJson> {
    let mut manifest = DisclosureManifest::read_from(&workspace.disclosure_path())?;

    let copy_dir_opt = copy_into.as_deref();

    if let Some((repo, commit)) = git {
        manifest
            .proof
            .items
            .push(build_git_proof(&repo, &commit, label.as_deref(), note.as_deref()));
    }

    for path in proof_paths {
        let proof = build_file_proof(
            &path,
            label.as_deref(),
            note.as_deref(),
            created_before_ai,
            copy_dir_opt,
            workspace,
        )?;
        manifest.proof.items.push(proof);
    }

    let hashes = build_hashes(&manifest)?;
    manifest.proof.bundle_root_sha256 = Some(hashes.bundle_root_sha256.clone());
    validate_manifest(&manifest)?;
    manifest.write_to(&workspace.disclosure_path())?;
    write_hashes(&workspace.hashes_path(), &hashes)?;
    Ok(hashes)
}

fn grade_from_str(value: &str) -> Result<AssistanceGrade> {
    match value {
        "none" => Ok(AssistanceGrade::None),
        "light" => Ok(AssistanceGrade::Light),
        "moderate" => Ok(AssistanceGrade::Moderate),
        "heavy" => Ok(AssistanceGrade::Heavy),
        "full" => Ok(AssistanceGrade::Full),
        _ => Err(ValidationError::new("Unknown grade").into()),
    }
}

fn grade_percent(grade: &AssistanceGrade) -> i32 {
    match grade {
        AssistanceGrade::None => 0,
        AssistanceGrade::Light => 10,
        AssistanceGrade::Moderate => 30,
        AssistanceGrade::Heavy => 60,
        AssistanceGrade::Full => 90,
    }
}

pub fn update_meter(
    workspace: &Workspace,
    global_human: Option<i32>,
    global_ai: Option<i32>,
    stages: Vec<(String, String)>,
    allow_unknown: bool,
) -> Result<HashesJson> {
    let mut manifest = DisclosureManifest::read_from(&workspace.disclosure_path())?;
    let template = get_template(&manifest.template.slug)?;

    if let Some(human) = global_human {
        let ai = global_ai.unwrap_or(100 - human);
        if human + ai != 100 {
            return Err(ValidationError::new("Global split must sum to 100").into());
        }
        manifest.assistance.global.human_percent = human;
        manifest.assistance.global.ai_percent = ai;
    }

    if !stages.is_empty() {
        let mut stage_map = std::collections::HashMap::new();
        for stage in manifest.assistance.stages.clone().unwrap_or_default() {
            stage_map.insert(stage.key.clone(), stage);
        }
        for (key, grade_str) in stages {
            let grade = grade_from_str(&grade_str)?;
            let approx = grade_percent(&grade);
            if !template.stages.iter().any(|stage| stage.key == key) && !allow_unknown {
                return Err(ValidationError::new("Unknown stage key").into());
            }
            let label = template
                .stages
                .iter()
                .find(|stage| stage.key == key)
                .map(|stage| stage.label.clone())
                .unwrap_or_else(|| key.clone());
            stage_map.insert(
                key.clone(),
                AssistanceStage {
                    key,
                    label,
                    grade,
                    approx_ai_percent: approx,
                },
            );
        }
        manifest.assistance.stages = Some(stage_map.into_values().collect());
    }

    let hashes = build_hashes(&manifest)?;
    manifest.proof.bundle_root_sha256 = Some(hashes.bundle_root_sha256.clone());
    validate_manifest(&manifest)?;
    manifest.write_to(&workspace.disclosure_path())?;
    write_hashes(&workspace.hashes_path(), &hashes)?;
    Ok(hashes)
}

pub fn stamp_workspace(
    workspace: &Workspace,
    digest: Option<String>,
    calendars: Option<String>,
    out: Option<PathBuf>,
    upgrade: bool,
    timeout: Option<u64>,
) -> Result<()> {
    let mut manifest = DisclosureManifest::read_from(&workspace.disclosure_path())?;
    let hashes = build_hashes(&manifest)?;
    let bundle_root = digest.unwrap_or(hashes.bundle_root_sha256);

    let receipt_path = resolve_receipt_path(workspace, out);
    if let Some(parent) = receipt_path.parent() {
        fs::create_dir_all(parent)?;
    }
    ots::stamp(&bundle_root, &receipt_path, calendars.as_deref(), timeout)?;

    let receipt_sha = ots::receipt_sha256(&receipt_path)?;
    manifest.timestamps = Some(TimestampInfo {
        opentimestamps: Some(OpenTimestampsInfo {
            enabled: Some(true),
            status: Some("pending".to_string()),
            receipt_sha256: Some(receipt_sha),
            receipt_filename: receipt_path.file_name().map(|n| n.to_string_lossy().to_string()),
        }),
    });

    if upgrade {
        let changed = ots::upgrade(&receipt_path)?;
        if changed {
            if let Some(timestamps) = &mut manifest.timestamps {
                if let Some(ots_info) = &mut timestamps.opentimestamps {
                    ots_info.status = Some("complete".to_string());
                    ots_info.receipt_sha256 = Some(ots::receipt_sha256(&receipt_path)?);
                }
            }
        }
    }

    manifest.write_to(&workspace.disclosure_path())?;
    Ok(())
}

pub fn upgrade_receipt(workspace: &Workspace, receipt: Option<PathBuf>) -> Result<bool> {
    let mut manifest = DisclosureManifest::read_from(&workspace.disclosure_path())?;
    let receipt_path = resolve_receipt_path(workspace, receipt);
    let changed = ots::upgrade(&receipt_path)?;
    if let Some(timestamps) = &mut manifest.timestamps {
        if let Some(ots_info) = &mut timestamps.opentimestamps {
            if changed {
                ots_info.status = Some("complete".to_string());
                ots_info.receipt_sha256 = Some(ots::receipt_sha256(&receipt_path)?);
            }
        }
    }
    manifest.write_to(&workspace.disclosure_path())?;
    Ok(changed)
}

pub fn verify_receipt(workspace: &Workspace, receipt: Option<PathBuf>, timeout: Option<u64>) -> Result<bool> {
    let manifest = DisclosureManifest::read_from(&workspace.disclosure_path())?;
    let hashes = build_hashes(&manifest)?;
    let receipt_path = resolve_receipt_path(workspace, receipt);
    ots::verify(&receipt_path, &hashes.bundle_root_sha256, timeout)
}

pub fn info_receipt(workspace: &Workspace, receipt: Option<PathBuf>) -> Result<String> {
    let receipt_path = resolve_receipt_path(workspace, receipt);
    ots::info(&receipt_path)
}

pub fn export_bundle(
    workspace: &Workspace,
    bundle_path: PathBuf,
    include_proof: IncludeProof,
    include_receipts: bool,
    format: ExportFormat,
) -> Result<()> {
    let manifest = DisclosureManifest::read_from(&workspace.disclosure_path())?;
    let hashes = build_hashes(&manifest)?;
    let receipt_dir = workspace.receipts_dir();

    match format {
        ExportFormat::Dir => {
            fs::create_dir_all(&bundle_path)?;
            fs::write(bundle_path.join("disclosure.json"), serde_json::to_string_pretty(&manifest)?)?;
            if include_proof != IncludeProof::None {
                fs::write(bundle_path.join("hashes.json"), serde_json::to_string_pretty(&hashes)?)?;
            }
            if include_receipts && receipt_dir.exists() {
                let dest = bundle_path.join("receipts");
                fs::create_dir_all(&dest)?;
                for entry in fs::read_dir(receipt_dir)? {
                    let entry = entry?;
                    let path = entry.path();
                    if path.is_file() {
                        fs::copy(&path, dest.join(entry.file_name()))?;
                    }
                }
            }
            if include_proof == IncludeProof::Copies {
                let dest = bundle_path.join("proof");
                fs::create_dir_all(&dest)?;
                for item in manifest.proof.items.iter() {
                    if let Some(path) = &item.path {
                        let src = workspace.root_path().join(path);
                        if src.exists() {
                            let filename = src
                                .file_name()
                                .map(|n| n.to_string_lossy().to_string())
                                .unwrap_or_else(|| "proof".to_string());
                            fs::copy(&src, dest.join(filename))?;
                        }
                    }
                }
            }
        }
        ExportFormat::Zip => {
            let file = fs::File::create(&bundle_path)?;
            let mut zip = zip::ZipWriter::new(file);
            let options = zip::write::FileOptions::<()>::default();

            zip.start_file("disclosure.json", options)?;
            zip.write_all(serde_json::to_string_pretty(&manifest)?.as_bytes())?;

            if include_proof != IncludeProof::None {
                zip.start_file("hashes.json", options)?;
                zip.write_all(serde_json::to_string_pretty(&hashes)?.as_bytes())?;
            }

            if include_receipts && receipt_dir.exists() {
                for entry in fs::read_dir(&receipt_dir)? {
                    let entry = entry?;
                    let path = entry.path();
                    if path.is_file() {
                        let name = format!("receipts/{}", entry.file_name().to_string_lossy());
                        zip.start_file(name, options)?;
                        let bytes = fs::read(path)?;
                        zip.write_all(&bytes)?;
                    }
                }
            }

            if include_proof == IncludeProof::Copies {
                for item in manifest.proof.items.iter() {
                    if let Some(path) = &item.path {
                        let src = workspace.root_path().join(path);
                        if src.exists() {
                            let name = format!(
                                "proof/{}",
                                src.file_name().unwrap_or_default().to_string_lossy()
                            );
                            zip.start_file(name, options)?;
                            let bytes = fs::read(src)?;
                            zip.write_all(&bytes)?;
                        }
                    }
                }
            }

            zip.finish()?;
        }
    }

    Ok(())
}

pub async fn publish_workspace(
    workspace: &Workspace,
    endpoint: &str,
    token: Option<String>,
    include_receipts: bool,
) -> Result<(String, String)> {
    let mut manifest = DisclosureManifest::read_from(&workspace.disclosure_path())?;
    let hashes = build_hashes(&manifest)?;

    let receipts = if include_receipts {
        let mut receipts = Vec::new();
        if workspace.receipts_dir().exists() {
            for entry in fs::read_dir(workspace.receipts_dir())? {
                let entry = entry?;
                let bytes = fs::read(entry.path())?;
                receipts.push(ReceiptPayload {
                    filename: entry.file_name().to_string_lossy().to_string(),
                    bytes_base64: general_purpose::STANDARD.encode(bytes),
                });
            }
        }
        receipts
    } else {
        Vec::new()
    };

    let response = publish_disclosure(endpoint, token.as_deref(), &manifest, &hashes, receipts).await?;
    manifest.publication = Some(crate::manifest::PublicationInfo {
        slug: Some(response.slug.clone()),
        url: Some(response.url.clone()),
        published_at: Some(Utc::now().to_rfc3339()),
    });
    manifest.write_to(&workspace.disclosure_path())?;
    Ok((response.slug, response.url))
}

#[allow(dead_code)]
pub fn load_template_from_manifest(manifest: &DisclosureManifest) -> Result<Template> {
    get_template(&manifest.template.slug)
}

#[allow(dead_code)]
pub fn recompute_root(manifest: &mut DisclosureManifest) -> Result<HashesJson> {
    let hashes = build_hashes(manifest)?;
    manifest.proof.bundle_root_sha256 = Some(hashes.bundle_root_sha256.clone());
    Ok(hashes)
}

fn resolve_receipt_path(workspace: &Workspace, receipt: Option<PathBuf>) -> PathBuf {
    match receipt {
        Some(path) if path.is_absolute() => path,
        Some(path) => workspace.root_path().join(path),
        None => workspace.receipts_dir().join("bundle-root.ots"),
    }
}
