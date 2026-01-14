use assert_cmd::cargo::cargo_bin_cmd;
use assert_cmd::Command;
use serde_json::Value;
use std::fs;
use std::io::{Read, Write};
use std::net::{TcpListener, TcpStream};
use std::path::PathBuf;
use std::sync::mpsc;
use std::thread;
use std::time::{Duration, Instant};
use tempfile::TempDir;
use zip::ZipArchive;

fn disclose_cmd() -> Command {
    let mut cmd = cargo_bin_cmd!("disclose");
    cmd.env("DISCLOSE_OTS_MOCK", "1");
    cmd
}

fn read_json(path: &std::path::Path) -> Value {
    let bytes = fs::read(path).expect("read json");
    serde_json::from_slice(&bytes).expect("parse json")
}

fn init_workspace(temp: &TempDir, name: &str) -> PathBuf {
    let workspace = temp.path().join(name);
    disclose_cmd()
        .args([
            "init",
            "--template",
            "code",
            "--title",
            "CLI E2E Disclosure",
            "--author",
            "Test Runner",
            "--out",
            workspace.to_str().expect("workspace str"),
        ])
        .assert()
        .success();
    workspace
}

fn write_proof_files(temp: &TempDir) -> (PathBuf, PathBuf) {
    let proof_src = temp.path().join("proof-src");
    fs::create_dir_all(&proof_src).expect("proof src");

    let proof_a = proof_src.join("notes.txt");
    let proof_b = proof_src.join("design.md");
    fs::write(&proof_a, "alpha evidence").expect("write proof a");
    fs::write(&proof_b, "beta evidence").expect("write proof b");
    (proof_a, proof_b)
}

fn is_hex(value: &str, len: usize) -> bool {
    value.len() == len && value.chars().all(|c| c.is_ascii_hexdigit())
}

fn find_subslice(haystack: &[u8], needle: &[u8]) -> Option<usize> {
    haystack
        .windows(needle.len())
        .position(|window| window == needle)
}

fn parse_content_length(headers: &[u8]) -> Option<usize> {
    let text = String::from_utf8_lossy(headers);
    for line in text.lines() {
        if line.to_ascii_lowercase().starts_with("content-length:") {
            let value = line.split(':').nth(1).unwrap_or("").trim();
            return value.parse().ok();
        }
    }
    None
}

fn read_http_request(stream: &mut TcpStream) -> (String, Vec<u8>) {
    let mut buffer = Vec::new();
    let mut headers_end = None;
    let mut content_length = None;
    let _ = stream.set_read_timeout(Some(Duration::from_secs(10)));

    loop {
        let mut chunk = [0u8; 1024];
        let count = match stream.read(&mut chunk) {
            Ok(0) => break,
            Ok(n) => n,
            Err(err) => {
                if matches!(
                    err.kind(),
                    std::io::ErrorKind::WouldBlock | std::io::ErrorKind::TimedOut
                ) {
                    break;
                }
                panic!("read error: {err}");
            }
        };
        buffer.extend_from_slice(&chunk[..count]);
        if headers_end.is_none() {
            if let Some(pos) = find_subslice(&buffer, b"\r\n\r\n") {
                headers_end = Some(pos + 4);
                content_length = parse_content_length(&buffer[..pos + 4]);
            }
        }
        if let (Some(end), Some(len)) = (headers_end, content_length) {
            if buffer.len() >= end + len {
                break;
            }
        }
    }

    let end = headers_end.expect("missing headers");
    let body_len = content_length.unwrap_or(0);
    let body = if buffer.len() >= end + body_len {
        buffer[end..end + body_len].to_vec()
    } else {
        Vec::new()
    };
    let headers = &buffer[..end];
    let headers_text = String::from_utf8_lossy(headers);
    let request_line = headers_text.lines().next().unwrap_or("").to_string();
    (request_line, body)
}

fn spawn_publish_server() -> (String, mpsc::Receiver<Value>, thread::JoinHandle<()>) {
    let listener = TcpListener::bind("127.0.0.1:0").expect("bind server");
    listener.set_nonblocking(true).expect("set nonblocking");
    let addr = listener.local_addr().expect("local addr");
    let endpoint = format!("http://{}", addr);
    let (tx, rx) = mpsc::channel();

    let handle = thread::spawn(move || {
        let start = Instant::now();
        loop {
            match listener.accept() {
                Ok((mut stream, _)) => {
                    let (request_line, body) = read_http_request(&mut stream);
                    let mut parts = request_line.split_whitespace();
                    let method = parts.next().unwrap_or("");
                    let path = parts.next().unwrap_or("");
                    assert_eq!(method, "POST");
                    assert_eq!(path, "/api/disclosures");

                    let payload: Value =
                        serde_json::from_slice(&body).expect("publish payload json");
                    let _ = tx.send(payload);

                    let response_body =
                        serde_json::json!({ "slug": "e2e-test", "url": "http://localhost:3000/d/e2e-test" })
                            .to_string();
                    let response = format!(
                        "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{}",
                        response_body.len(),
                        response_body
                    );
                    let _ = stream.write_all(response.as_bytes());
                    break;
                }
                Err(err) if err.kind() == std::io::ErrorKind::WouldBlock => {
                    if start.elapsed() > Duration::from_secs(10) {
                        break;
                    }
                    thread::sleep(Duration::from_millis(50));
                }
                Err(err) => panic!("accept error: {err}"),
            }
        }
    });

    (endpoint, rx, handle)
}

#[test]
#[ignore]
fn cli_e2e_flow() {
    let temp = TempDir::new().expect("tempdir");
    let workspace = init_workspace(&temp, "workspace");
    let (proof_a, proof_b) = write_proof_files(&temp);

    let copy_into = workspace.join("proof");
    disclose_cmd()
        .args([
            "attach",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--proof",
            proof_a.to_str().expect("proof a str"),
            "--proof",
            proof_b.to_str().expect("proof b str"),
            "--label",
            "Evidence",
            "--created-before-ai",
            "--copy-into",
            copy_into.to_str().expect("copy into str"),
        ])
        .assert()
        .success();

    assert!(copy_into.join("notes.txt").exists());
    assert!(copy_into.join("design.md").exists());

    disclose_cmd()
        .args([
            "meter",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--global-human",
            "80",
            "--global-ai",
            "20",
            "--stage",
            "design=light",
            "--stage",
            "implementation=moderate",
        ])
        .assert()
        .success();

    let hashes = read_json(&workspace.join("hashes.json"));
    let bundle_root = hashes["bundle_root_sha256"].as_str().expect("bundle root");
    assert_eq!(hashes["algo"].as_str().expect("algo"), "sha256+merkle/v1");
    assert!(is_hex(bundle_root, 64));
    assert_eq!(hashes["proof"].as_array().expect("proof array").len(), 2);
    let manifest = read_json(&workspace.join("disclosure.json"));
    assert_eq!(
        manifest["proof"]["bundle_root_sha256"]
            .as_str()
            .expect("manifest root"),
        bundle_root
    );

    disclose_cmd()
        .args([
            "stamp",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--ots",
            "--timeout",
            "10",
        ])
        .assert()
        .success();

    let receipt_path = workspace.join("receipts").join("bundle-root.ots");
    assert!(receipt_path.exists());

    disclose_cmd()
        .args([
            "info",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--receipt",
            receipt_path.to_str().expect("receipt str"),
        ])
        .assert()
        .success();

    let verify_output = disclose_cmd()
        .args([
            "--json",
            "verify",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--receipt",
            receipt_path.to_str().expect("receipt str"),
        ])
        .output()
        .expect("verify output");
    assert!(verify_output.status.success());
    let verify_json: Value = serde_json::from_slice(&verify_output.stdout).expect("verify json");
    assert_eq!(
        verify_json["result"]["verified"]
            .as_bool()
            .expect("verified"),
        true
    );

    disclose_cmd()
        .args([
            "upgrade",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--receipt",
            receipt_path.to_str().expect("receipt str"),
        ])
        .assert()
        .success();

    let bundle_path = temp.path().join("bundle.zip");
    disclose_cmd()
        .args([
            "export",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--bundle",
            bundle_path.to_str().expect("bundle str"),
            "--include-proof",
            "copies",
            "--include-receipts",
            "yes",
        ])
        .assert()
        .success();

    let file = fs::File::open(&bundle_path).expect("open bundle");
    let mut archive = ZipArchive::new(file).expect("zip archive");
    assert!(archive.by_name("disclosure.json").is_ok());
    assert!(archive.by_name("hashes.json").is_ok());
    assert!(archive.by_name("proof/notes.txt").is_ok());
    assert!(archive.by_name("proof/design.md").is_ok());
    assert!(archive.by_name("receipts/bundle-root.ots").is_ok());

    let (endpoint, rx, handle) = spawn_publish_server();
    let publish_output = disclose_cmd()
        .args([
            "--json",
            "publish",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--endpoint",
            &endpoint,
        ])
        .output()
        .expect("publish output");
    assert!(publish_output.status.success());

    let payload = rx
        .recv_timeout(Duration::from_secs(5))
        .expect("publish payload");
    assert!(payload.get("manifest").is_some());
    assert!(payload.get("hashes").is_some());
    let receipts = payload["receipts"].as_array().expect("receipts array");
    assert_eq!(receipts.len(), 1);
    assert!(
        receipts[0]["bytes_base64"]
            .as_str()
            .expect("receipt bytes")
            .len()
            > 10
    );

    handle.join().expect("server thread");

    let manifest_after = read_json(&workspace.join("disclosure.json"));
    assert_eq!(
        manifest_after["publication"]["slug"]
            .as_str()
            .expect("publication slug"),
        "e2e-test"
    );
}

#[test]
#[ignore]
fn cli_e2e_meter_invalid_split() {
    let temp = TempDir::new().expect("tempdir");
    let workspace = init_workspace(&temp, "invalid-split");

    disclose_cmd()
        .args([
            "meter",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--global-human",
            "80",
            "--global-ai",
            "30",
        ])
        .assert()
        .failure()
        .code(2);
}

#[test]
#[ignore]
fn cli_e2e_meter_unknown_stage() {
    let temp = TempDir::new().expect("tempdir");
    let workspace = init_workspace(&temp, "unknown-stage");

    disclose_cmd()
        .args([
            "meter",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--stage",
            "unknown=light",
        ])
        .assert()
        .failure()
        .code(2);
}

#[test]
#[ignore]
fn cli_e2e_verify_mismatch() {
    let temp = TempDir::new().expect("tempdir");
    let workspace = init_workspace(&temp, "verify-mismatch");
    let (proof_a, proof_b) = write_proof_files(&temp);

    disclose_cmd()
        .args([
            "attach",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--proof",
            proof_a.to_str().expect("proof a str"),
            "--proof",
            proof_b.to_str().expect("proof b str"),
            "--label",
            "Evidence",
            "--created-before-ai",
        ])
        .assert()
        .success();

    let hashes = read_json(&workspace.join("hashes.json"));
    let bundle_root = hashes["bundle_root_sha256"].as_str().expect("bundle root");
    let bad_digest = "00".repeat(32);
    assert_ne!(bundle_root, bad_digest);

    disclose_cmd()
        .args([
            "stamp",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--ots",
            "--digest",
            &bad_digest,
        ])
        .assert()
        .success();

    let receipt_path = workspace.join("receipts").join("bundle-root.ots");
    disclose_cmd()
        .args([
            "verify",
            "--path",
            workspace.to_str().expect("workspace str"),
            "--receipt",
            receipt_path.to_str().expect("receipt str"),
        ])
        .assert()
        .failure()
        .code(3);
}
