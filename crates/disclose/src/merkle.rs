use anyhow::{anyhow, Result};
use sha2::{Digest, Sha256};

fn sha256_bytes(data: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(data);
    hasher.finalize().to_vec()
}

pub fn merkle_root_hex(leaves_hex: &[String]) -> Result<String> {
    if leaves_hex.is_empty() {
        return Err(anyhow!("Merkle root requires at least one leaf"));
    }

    let mut level: Vec<Vec<u8>> = leaves_hex
        .iter()
        .map(|leaf| hex::decode(leaf))
        .collect::<Result<Vec<_>, _>>()
        .map_err(|_| anyhow!("Invalid hex in leaf"))?;

    while level.len() > 1 {
        if level.len() % 2 == 1 {
            let last = level.last().cloned().unwrap();
            level.push(last);
        }

        let mut next = Vec::new();
        for pair in level.chunks(2) {
            let left = &pair[0];
            let right = &pair[1];
            let mut combined = Vec::with_capacity(left.len() + right.len());
            combined.extend_from_slice(left);
            combined.extend_from_slice(right);
            next.push(sha256_bytes(&combined));
        }
        level = next;
    }

    Ok(hex::encode(&level[0]))
}

pub fn bundle_root_hex(manifest_hex: &str, proof_hexes: &[String]) -> Result<String> {
    let mut sorted = proof_hexes.to_vec();
    sorted.sort();
    let mut leaves = Vec::with_capacity(sorted.len() + 1);
    leaves.push(manifest_hex.to_string());
    leaves.extend(sorted);
    merkle_root_hex(&leaves)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn merkle_root_known_vector() {
        let manifest = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa".to_string();
        let proofs = vec![
            "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb".to_string(),
            "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc".to_string(),
            "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd".to_string(),
        ];
        let root = bundle_root_hex(&manifest, &proofs).unwrap();
        assert_eq!(
            root,
            "81952b5c47f0703b5f2543a6dde2be50c5271e327c438e85c70874adf5b10e12"
        );
    }
}
