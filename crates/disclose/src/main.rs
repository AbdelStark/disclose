use anyhow::{anyhow, Result};
use clap::{Parser, Subcommand};
use serde_json::json;
use std::path::PathBuf;

mod commands;
mod errors;
mod hashing;
mod manifest;
mod merkle;
mod ots;
mod publish;
mod templates;
mod tui;
mod validation;
mod workspace;

use commands::{
    attach_proof, export_bundle, info_receipt, init_workspace, publish_workspace, stamp_workspace,
    update_meter, upgrade_receipt, verify_receipt, ExportFormat, IncludeProof,
};
use errors::ValidationError;
use workspace::Workspace;

#[derive(Parser)]
#[command(name = "disclose", version, about = "Local-first AI disclosure tool")]
struct Cli {
    #[arg(global = true, long, value_name = "DIR")]
    path: Option<PathBuf>,
    #[arg(global = true, long)]
    json: bool,
    #[arg(global = true, long)]
    quiet: bool,
    #[arg(global = true, long)]
    verbose: bool,
    #[arg(global = true, long = "no-color")]
    no_color: bool,
    #[arg(global = true, long)]
    yes: bool,
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    Init {
        #[arg(long)]
        template: String,
        #[arg(long)]
        title: String,
        #[arg(long)]
        author: Option<String>,
        #[arg(long, default_value = "./disclose")]
        out: PathBuf,
        #[arg(long)]
        link: Vec<String>,
    },
    Attach {
        #[arg(long, value_name = "PATH")]
        proof: Vec<PathBuf>,
        #[arg(long)]
        label: Option<String>,
        #[arg(long)]
        note: Option<String>,
        #[arg(long)]
        created_before_ai: bool,
        #[arg(long)]
        not_sure: bool,
        #[arg(long, value_name = "DIR")]
        copy_into: Option<PathBuf>,
        #[arg(long)]
        git: Option<String>,
        #[arg(long)]
        commit: Option<String>,
    },
    Meter {
        #[arg(long)]
        global_human: Option<i32>,
        #[arg(long)]
        global_ai: Option<i32>,
        #[arg(long)]
        stage: Vec<String>,
        #[arg(long)]
        allow_unknown_stages: bool,
    },
    Stamp {
        #[arg(long)]
        ots: bool,
        #[arg(long)]
        digest: Option<String>,
        #[arg(long)]
        calendars: Option<String>,
        #[arg(long, default_value = "receipts/bundle-root.ots")]
        out: PathBuf,
        #[arg(long)]
        upgrade: bool,
        #[arg(long)]
        timeout: Option<u64>,
    },
    Upgrade {
        #[arg(long)]
        receipt: Option<PathBuf>,
    },
    Verify {
        #[arg(long)]
        receipt: Option<PathBuf>,
        #[arg(long)]
        bitcoin_node: Option<String>,
        #[arg(long)]
        bitcoin_user: Option<String>,
        #[arg(long)]
        bitcoin_pass: Option<String>,
        #[arg(long)]
        timeout: Option<u64>,
    },
    Info {
        #[arg(long)]
        receipt: Option<PathBuf>,
    },
    Export {
        #[arg(long, default_value = "disclosure-bundle.zip")]
        bundle: PathBuf,
        #[arg(long, default_value = "hashes")]
        include_proof: IncludeProof,
        #[arg(long, default_value = "yes")]
        include_receipts: String,
        #[arg(long, default_value = "zip")]
        format: ExportFormat,
    },
    Publish {
        #[arg(long)]
        endpoint: String,
        #[arg(long)]
        token: Option<String>,
        #[arg(long, default_value = "yes")]
        include_receipts: String,
    },
    Tui,
}

fn resolve_workspace(path: Option<PathBuf>) -> Result<Workspace> {
    let root = path.unwrap_or(std::env::current_dir()?);
    let workspace = Workspace::new(root);
    if !workspace.exists() {
        return Err(anyhow!("disclosure.json not found in workspace"));
    }
    Ok(workspace)
}

fn output_json(action: &str, path: &str, result: serde_json::Value) {
    let payload = json!({
        "ok": true,
        "action": action,
        "path": path,
        "result": result
    });
    println!("{}", payload);
}

fn error_code(err: &anyhow::Error) -> i32 {
    if err.downcast_ref::<ValidationError>().is_some() {
        return 2;
    }
    let message = err.to_string().to_lowercase();
    let is_validation = message.contains("validation error");
    let is_split = message.contains("global") && message.contains("split");
    let is_unknown_stage = message.contains("unknown") && message.contains("stage");
    if is_validation || is_split || is_unknown_stage {
        return 2;
    }
    if err.downcast_ref::<reqwest::Error>().is_some() {
        return 4;
    }
    if err.downcast_ref::<std::io::Error>().is_some() {
        return 5;
    }
    1
}

#[tokio::main]
async fn main() {
    let cli = Cli::parse();
    let result: Result<()> = async {
        match cli.command {
        Commands::Init {
            template,
            title,
            author,
            out,
            link,
        } => {
            let workspace = init_workspace(out.clone(), &template, &title, author, link)?;
            if cli.json {
                output_json(
                    "init",
                    workspace.root_path().to_string_lossy().as_ref(),
                    json!({
                        "template": template,
                        "disclosure": workspace.disclosure_path().to_string_lossy()
                    }),
                );
            } else if !cli.quiet {
                println!("Created disclosure at {}", workspace.root_path().display());
            }
            Ok(())
        }
        Commands::Attach {
            proof,
            label,
            note,
            created_before_ai,
            not_sure,
            copy_into,
            git,
            commit,
        } => {
            let workspace = resolve_workspace(cli.path)?;
            if proof.is_empty() && git.is_none() {
                return Err(anyhow!("Provide --proof or --git/--commit"));
            }
            let created = if created_before_ai {
                Some(true)
            } else if not_sure {
                Some(false)
            } else {
                None
            };
            let git_tuple = match (git, commit) {
                (Some(repo), Some(commit)) => Some((repo, commit)),
                (Some(_), None) => return Err(anyhow!("--commit is required when using --git")),
                _ => None,
            };
            let hashes = attach_proof(&workspace, proof, label, note, created, copy_into, git_tuple)?;
            if cli.json {
                output_json(
                    "attach",
                    workspace.root_path().to_string_lossy().as_ref(),
                    json!({ "bundle_root": hashes.bundle_root_sha256 }),
                );
            } else if !cli.quiet {
                println!("Attached proof items. Bundle root: {}", hashes.bundle_root_sha256);
            }
            Ok(())
        }
        Commands::Meter {
            global_human,
            global_ai,
            stage,
            allow_unknown_stages,
        } => {
            let workspace = resolve_workspace(cli.path)?;
            let parsed_stages = stage
                .into_iter()
                .filter_map(|entry| {
                    entry
                        .split_once('=')
                        .map(|(key, grade)| (key.to_string(), grade.to_string()))
                })
                .collect();
            let hashes = update_meter(&workspace, global_human, global_ai, parsed_stages, allow_unknown_stages)?;
            if cli.json {
                output_json(
                    "meter",
                    workspace.root_path().to_string_lossy().as_ref(),
                    json!({ "bundle_root": hashes.bundle_root_sha256 }),
                );
            } else if !cli.quiet {
                println!("Updated assistance meter. Bundle root: {}", hashes.bundle_root_sha256);
            }
            Ok(())
        }
        Commands::Stamp {
            ots,
            digest,
            calendars,
            out,
            upgrade,
            timeout,
        } => {
            if !ots {
                return Err(anyhow!("--ots flag is required to stamp"));
            }
            let workspace = resolve_workspace(cli.path)?;
            stamp_workspace(&workspace, digest, calendars, Some(out), upgrade, timeout)?;
            if cli.json {
                output_json(
                    "stamp",
                    workspace.root_path().to_string_lossy().as_ref(),
                    json!({ "receipt": "bundle-root.ots" }),
                );
            } else if !cli.quiet {
                println!("Stamped disclosure. Receipt saved.");
            }
            Ok(())
        }
        Commands::Upgrade { receipt } => {
            let workspace = resolve_workspace(cli.path)?;
            let changed = upgrade_receipt(&workspace, receipt)?;
            if cli.json {
                output_json(
                    "upgrade",
                    workspace.root_path().to_string_lossy().as_ref(),
                    json!({ "upgraded": changed }),
                );
            } else if !cli.quiet {
                println!("Receipt upgraded: {}", changed);
            }
            Ok(())
        }
        Commands::Verify {
            receipt,
            timeout,
            ..
        } => {
            let workspace = resolve_workspace(cli.path)?;
            let ok = verify_receipt(&workspace, receipt, timeout)?;
            if cli.json {
                output_json(
                    "verify",
                    workspace.root_path().to_string_lossy().as_ref(),
                    json!({ "verified": ok }),
                );
            } else if !cli.quiet {
                println!("Verification result: {}", ok);
            }
            if !ok {
                std::process::exit(3);
            }
            Ok(())
        }
        Commands::Info { receipt } => {
            let workspace = resolve_workspace(cli.path)?;
            let info = info_receipt(&workspace, receipt)?;
            if cli.json {
                output_json(
                    "info",
                    workspace.root_path().to_string_lossy().as_ref(),
                    json!({ "info": info }),
                );
            } else if !cli.quiet {
                println!("{}", info);
            }
            Ok(())
        }
        Commands::Export {
            bundle,
            include_proof,
            include_receipts,
            format,
        } => {
            let workspace = resolve_workspace(cli.path)?;
            let include_receipts = matches!(include_receipts.as_str(), "yes" | "true");
            export_bundle(&workspace, bundle.clone(), include_proof, include_receipts, format)?;
            if cli.json {
                output_json(
                    "export",
                    workspace.root_path().to_string_lossy().as_ref(),
                    json!({ "bundle": bundle.to_string_lossy() }),
                );
            } else if !cli.quiet {
                println!("Exported bundle to {}", bundle.display());
            }
            Ok(())
        }
        Commands::Publish {
            endpoint,
            token,
            include_receipts,
        } => {
            let workspace = resolve_workspace(cli.path)?;
            let include_receipts = matches!(include_receipts.as_str(), "yes" | "true");
            let (slug, url) = publish_workspace(&workspace, &endpoint, token, include_receipts).await?;
            if cli.json {
                output_json(
                    "publish",
                    workspace.root_path().to_string_lossy().as_ref(),
                    json!({ "slug": slug, "url": url }),
                );
            } else if !cli.quiet {
                println!("Published: {}", url);
            }
            Ok(())
        }
        Commands::Tui => {
            let root = cli.path.unwrap_or(std::env::current_dir()?);
            tui::run_tui(root)?;
            Ok(())
        }
        }
    }
    .await;

    if let Err(err) = result {
        if !cli.quiet {
            eprintln!("Error: {}", err);
        }
        let code = error_code(&err);
        std::process::exit(code);
    }
}
