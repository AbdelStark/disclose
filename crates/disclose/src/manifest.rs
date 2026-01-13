use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TemplateRef {
    pub slug: String,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectInfo {
    pub title: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub author: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub links: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub audience: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiTool {
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub provider: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssistanceGlobal {
    pub human_percent: i32,
    pub ai_percent: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AssistanceGrade {
    None,
    Light,
    Moderate,
    Heavy,
    Full,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssistanceStage {
    pub key: String,
    pub label: String,
    pub grade: AssistanceGrade,
    pub approx_ai_percent: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AssistanceInfo {
    pub global: AssistanceGlobal,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub stages: Option<Vec<AssistanceStage>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ProofKind {
    File,
    GitCommit,
    TextNote,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitProof {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub repo: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub commit: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofItem {
    pub id: String,
    pub label: String,
    pub kind: ProofKind,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mime: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size_bytes: Option<u64>,
    pub sha256: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub created_before_ai: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub git: Option<GitProof>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProofInfo {
    pub items: Vec<ProofItem>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bundle_root_sha256: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OpenTimestampsInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enabled: Option<bool>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub receipt_sha256: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub receipt_filename: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimestampInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub opentimestamps: Option<OpenTimestampsInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PublicationInfo {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub slug: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub published_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisclosureManifest {
    pub version: String,
    pub id: String,
    pub created_at: String,
    pub template: TemplateRef,
    pub project: ProjectInfo,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ai_tools: Option<Vec<AiTool>>,
    pub assistance: AssistanceInfo,
    pub proof: ProofInfo,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timestamps: Option<TimestampInfo>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub publication: Option<PublicationInfo>,
}

impl DisclosureManifest {
    pub fn read_from(path: &std::path::Path) -> anyhow::Result<Self> {
        let data = std::fs::read_to_string(path)?;
        Ok(serde_json::from_str(&data)?)
    }

    pub fn write_to(&self, path: &std::path::Path) -> anyhow::Result<()> {
        let json = serde_json::to_string_pretty(self)?;
        std::fs::write(path, json)?;
        Ok(())
    }
}
