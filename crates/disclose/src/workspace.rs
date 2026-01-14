use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct Workspace {
    pub root: PathBuf,
}

impl Workspace {
    pub fn new(root: PathBuf) -> Self {
        Self { root }
    }

    pub fn disclosure_path(&self) -> PathBuf {
        self.root.join("disclosure.json")
    }

    pub fn hashes_path(&self) -> PathBuf {
        self.root.join("hashes.json")
    }

    pub fn receipts_dir(&self) -> PathBuf {
        self.root.join("receipts")
    }

    #[allow(dead_code)]
    pub fn proof_dir(&self) -> PathBuf {
        self.root.join("proof")
    }

    pub fn state_dir(&self) -> PathBuf {
        self.root.join(".disclose")
    }

    pub fn state_path(&self) -> PathBuf {
        self.state_dir().join("state.json")
    }

    pub fn ensure_state_dir(&self) -> std::io::Result<()> {
        std::fs::create_dir_all(self.state_dir())
    }

    #[allow(dead_code)]
    pub fn ensure_receipts_dir(&self) -> std::io::Result<()> {
        std::fs::create_dir_all(self.receipts_dir())
    }

    #[allow(dead_code)]
    pub fn ensure_proof_dir(&self) -> std::io::Result<()> {
        std::fs::create_dir_all(self.proof_dir())
    }

    pub fn exists(&self) -> bool {
        self.disclosure_path().exists()
    }

    pub fn root_path(&self) -> &Path {
        &self.root
    }
}
