import { bundleRootHex } from "@/lib/hashing/merkle";
import { sha256Hex } from "@/lib/hashing/sha256";
import { stableStringify } from "@/lib/hashing/stable-json";
import { DisclosureManifest, HashesJson } from "@/lib/types";

function manifestForHash(manifest: DisclosureManifest): DisclosureManifest {
  const clone: DisclosureManifest = JSON.parse(JSON.stringify(manifest));
  if (clone.proof?.bundle_root_sha256) {
    delete clone.proof.bundle_root_sha256;
  }
  if ((clone as any).timestamps) {
    delete (clone as any).timestamps;
  }
  if ((clone as any).publication) {
    delete (clone as any).publication;
  }
  return clone;
}

export async function computeManifestHash(manifest: DisclosureManifest): Promise<string> {
  const sanitized = manifestForHash(manifest);
  return sha256Hex(stableStringify(sanitized));
}

export async function buildHashes(manifest: DisclosureManifest): Promise<{
  manifestSha256: string;
  bundleRootSha256: string;
  hashes: HashesJson;
}> {
  const manifestSha256 = await computeManifestHash(manifest);
  const proofHashes = manifest.proof.items.map((item) => item.sha256);
  const bundleRootSha256 = await bundleRootHex(manifestSha256, proofHashes);

  const hashes: HashesJson = {
    algo: "sha256+merkle/v1",
    manifest_sha256: manifestSha256,
    proof: manifest.proof.items.map((item) => ({
      id: item.id,
      sha256: item.sha256,
      size_bytes: item.size_bytes,
      path: item.path
    })),
    bundle_root_sha256: bundleRootSha256
  };

  return { manifestSha256, bundleRootSha256, hashes };
}
