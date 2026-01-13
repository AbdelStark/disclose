use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::hashing::HashesJson;
use crate::manifest::DisclosureManifest;

#[derive(Debug, Serialize)]
pub struct ReceiptPayload {
    pub filename: String,
    pub bytes_base64: String,
}

#[derive(Debug, Serialize)]
struct PublishPayload<'a> {
    manifest: &'a DisclosureManifest,
    hashes: &'a HashesJson,
    receipts: Vec<ReceiptPayload>,
}

#[derive(Debug, Deserialize)]
pub struct PublishResponse {
    pub slug: String,
    pub url: String,
}

pub async fn publish_disclosure(
    endpoint: &str,
    token: Option<&str>,
    manifest: &DisclosureManifest,
    hashes: &HashesJson,
    receipts: Vec<ReceiptPayload>,
) -> Result<PublishResponse> {
    let client = Client::new();
    let url = format!("{}/api/disclosures", endpoint.trim_end_matches('/'));
    let payload = PublishPayload {
        manifest,
        hashes,
        receipts,
    };

    let mut request = client.post(url).json(&payload);
    if let Some(token) = token {
        request = request.bearer_auth(token);
    }

    let response = request.send().await?;
    let response = response.error_for_status()?;
    Ok(response.json::<PublishResponse>().await?)
}
