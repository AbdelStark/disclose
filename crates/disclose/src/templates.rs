use anyhow::{anyhow, Result};
use include_dir::{include_dir, Dir};
use serde::Deserialize;

static TEMPLATES_DIR: Dir = include_dir!("$CARGO_MANIFEST_DIR/../../shared/templates");

#[derive(Debug, Clone, Deserialize)]
pub struct TemplateStage {
    pub key: String,
    pub label: String,
}

#[derive(Debug, Clone, Deserialize)]
pub struct Template {
    pub slug: String,
    pub version: String,
    pub label: String,
    #[allow(dead_code)]
    #[serde(default)]
    pub recommended_proof: Vec<String>,
    pub stages: Vec<TemplateStage>,
}

pub fn load_templates() -> Result<Vec<Template>> {
    let mut templates = Vec::new();
    for file in TEMPLATES_DIR.files() {
        if let Some(ext) = file.path().extension() {
            if ext == "json" {
                let content = file
                    .contents_utf8()
                    .ok_or_else(|| anyhow!("Invalid UTF-8"))?;
                let template: Template = serde_json::from_str(content)?;
                templates.push(template);
            }
        }
    }
    Ok(templates)
}

pub fn get_template(slug: &str) -> Result<Template> {
    let templates = load_templates()?;
    templates
        .into_iter()
        .find(|template| template.slug == slug)
        .ok_or_else(|| anyhow!("Unknown template"))
}
